// ShazamKit for OnKey's listening mode (see src/recognize.rs):
//   - signatures: a compact fingerprint of some audio (not the audio), made on this Mac
//   - a custom catalog of the songs OnKey has learned, matched entirely on this Mac (no account, no network)
//   - Shazam's own catalog, which needs OnKey's App ID to have the ShazamKit service (Apple Developer account)
// Matching is asynchronous in ShazamKit: the custom catalog calls wait for the answer (call them off the audio thread);
// requests to Shazam's own catalog are asked, then looked at until answered (`onkey_shz_shazam_begin`, `_poll`).
import Foundation
import ShazamKit
import AVFoundation

private let lock = NSLock()
private var catalogs: [Int32: SHCustomCatalog] = [:]
private var nextHandle: Int32 = 1
private let idKey = SHMediaItemProperty("onkeyID")

private func buffer(_ x: UnsafePointer<Float>, _ n: Int, _ rate: Double) -> AVAudioPCMBuffer? {
    guard let fmt = AVAudioFormat(standardFormatWithSampleRate: rate, channels: 1),
          let buf = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: AVAudioFrameCount(n)) else { return nil }
    buf.frameLength = AVAudioFrameCount(n)
    buf.floatChannelData![0].update(from: x, count: n)
    return buf
}

/// A signature of `n` mono samples at `rate` Hz. Returns bytes the caller frees with onkey_shz_free (nil on error).

private func signatureNow(_ x: UnsafePointer<Float>, _ n: Int32, _ rate: Double, _ outLen: UnsafeMutablePointer<Int32>) -> UnsafeMutablePointer<UInt8>? {
    guard let buf = buffer(x, Int(n), rate) else { return nil }
    let gen = SHSignatureGenerator()
    do { try gen.append(buf, at: nil) } catch { return nil }
    let data = gen.signature().dataRepresentation
    let out = UnsafeMutablePointer<UInt8>.allocate(capacity: data.count)
    data.copyBytes(to: out, count: data.count)
    outLen.pointee = Int32(data.count)
    return out
}

@_cdecl("onkey_shz_free")
public func onkey_shz_free(_ p: UnsafeMutablePointer<UInt8>?) {
    p?.deallocate()
}

/// A new, empty catalog of learned songs.
@_cdecl("onkey_shz_catalog_new")
public func onkey_shz_catalog_new() -> Int32 {
    lock.lock(); defer { lock.unlock() }
    let h = nextHandle
    nextHandle += 1
    catalogs[h] = SHCustomCatalog()
    return h
}

@_cdecl("onkey_shz_catalog_free")
public func onkey_shz_catalog_free(_ h: Int32) {
    lock.lock(); defer { lock.unlock() }
    catalogs[h] = nil
}

/// Add a song's signature to a catalog under OnKey's id for it. 0 on success.
@_cdecl("onkey_shz_catalog_add")
public func onkey_shz_catalog_add(_ h: Int32, _ sig: UnsafePointer<UInt8>, _ len: Int32, _ id: UnsafePointer<CChar>) -> Int32 {
    lock.lock(); let cat = catalogs[h]; lock.unlock()
    guard let cat else { return -1 }
    do {
        let s = try SHSignature(dataRepresentation: Data(bytes: sig, count: Int(len)))
        try cat.addReferenceSignature(s, representing: [SHMediaItem(properties: [idKey: String(cString: id)])])
        return 0
    } catch {
        return -2
    }
}

/// The answer, handed from ShazamKit's task to the waiting caller (who may have stopped waiting).
private final class Answer: @unchecked Sendable {
    private let l = NSLock()
    private var r: SHSession.Result? = nil
    func set(_ v: SHSession.Result) { l.lock(); r = v; l.unlock() }
    func get() -> SHSession.Result? { l.lock(); defer { l.unlock() }; return r }
}

/// ShazamKit's answer, waited for at most `timeout` seconds. nil: none in time (a dropped connection can leave
/// a request hanging; listening mustn't hang with it).
private func waitFor(_ session: SHSession, _ sig: SHSignature, timeout: Double) -> SHSession.Result? {
    let sem = DispatchSemaphore(value: 0)
    let answer = Answer()
    Task.detached {
        answer.set(await session.result(from: sig))
        sem.signal()
    }
    guard sem.wait(timeout: .now() + timeout) == .success else { return nil }
    return answer.get()
}

/// Match a signature against a catalog. 1: matched (the song's id into `outId`, where in it the signature's
/// audio starts into `outOffset`); 0: no match; negative: error (-4: no answer in 5 s).

private func matchNow(_ h: Int32, _ sig: UnsafePointer<UInt8>, _ len: Int32, _ outId: UnsafeMutablePointer<CChar>,
                            _ cap: Int32, _ outOffset: UnsafeMutablePointer<Double>) -> Int32 {
    lock.lock(); let cat = catalogs[h]; lock.unlock()
    guard let cat, let s = try? SHSignature(dataRepresentation: Data(bytes: sig, count: Int(len))) else { return -1 }
    switch waitFor(SHSession(catalog: cat), s, timeout: 5) {
    case nil:
        return -4
    case .match(let m):
        guard let item = m.mediaItems.first, let id = item[idKey] as? String else { return 0 }
        outOffset.pointee = item.matchOffset
        _ = id.withCString { strncpy(outId, $0, Int(cap) - 1) }
        outId[Int(cap) - 1] = 0
        return 1
    case .noMatch:
        return 0
    case .error:
        return -2
    }
}

/// Shazam's answer to a request to its own catalog (1: matched, JSON into `out`; 0: no match; -3: an error, why into
/// `out`; -5: the signature was unusable; -1: the match couldn't be described).
private func report(_ r: SHSession.Result, _ out: UnsafeMutablePointer<CChar>, _ cap: Int32) -> Int32 {
    switch r {
    case .match(let m):
        guard let item = m.mediaItems.first else { return 0 }
        var d: [String: Any] = ["offset": item.matchOffset]
        if let v = item.title { d["title"] = v }
        if let v = item.artist { d["artist"] = v }
        if let v = item.artworkURL { d["artwork"] = v.absoluteString }
        if let v = item.isrc { d["isrc"] = v }
        if let v = item.appleMusicID { d["appleMusicID"] = v }
        if let v = item.appleMusicURL { d["appleMusicURL"] = v.absoluteString }
        if let v = item.shazamID { d["shazamID"] = v }
        guard let json = try? JSONSerialization.data(withJSONObject: d), let str = String(data: json, encoding: .utf8) else { return -1 }
        _ = str.withCString { strncpy(out, $0, Int(cap) - 1) }
        out[Int(cap) - 1] = 0
        return 1
    case .noMatch:
        return 0
    case .error(let e, _):
        // why, for the log (domain, code, description): offline, refused, or something else
        let n = e as NSError
        // a signature too short or unusable (SHError 200, 201): this request's fault, not the service's
        if n.domain == SHErrorDomain && (n.code == 200 || n.code == 201) { return -5 }
        _ = "\(n.domain) \(n.code): \(n.localizedDescription)".withCString { strncpy(out, $0, Int(cap) - 1) }
        out[Int(cap) - 1] = 0
        return -3
    }
}

// Requests to Shazam's catalog that are never given up on while OnKey still wants their answer: the first ones
// after a fresh install can take half a minute or more (ShazamKit setting itself up), and one given up on at 10 s
// was an answer thrown away. Asked with `begin`, looked at with `poll`, let go of with `forget`.
private var asked: [Int32: Answer] = [:]
private var nextTicket: Int32 = 1

/// Ask Shazam's catalog about a signature, without waiting: a ticket for `poll` (negative: the signature is unusable).
private func shazamBegin(_ sig: UnsafePointer<UInt8>, _ len: Int32) -> Int32 {
    guard let s = try? SHSignature(dataRepresentation: Data(bytes: sig, count: Int(len))) else { return -1 }
    let answer = Answer()
    lock.lock()
    let t = nextTicket
    nextTicket += 1
    asked[t] = answer
    lock.unlock()
    let session = SHSession()
    Task.detached {
        answer.set(await session.result(from: s))
    }
    return t
}

/// The answer to a ticket, as `report` gives it, once it has come (the ticket is then done with); -6: not
/// yet; -1: no such ticket.
private func shazamPoll(_ t: Int32, _ out: UnsafeMutablePointer<CChar>, _ cap: Int32) -> Int32 {
    lock.lock(); let answer = asked[t]; lock.unlock()
    guard let answer else { return -1 }
    guard let r = answer.get() else { return -6 }
    lock.lock(); asked[t] = nil; lock.unlock()
    return report(r, out, cap)
}

// The calls come from OnKey's own (Rust) threads, which have no autorelease pool: what ShazamKit and AVFoundation
// autorelease was never released, a little more with every recognition. Each call drains its own pool.

/// A signature of `n` mono samples at `rate` Hz. Returns bytes the caller frees with onkey_shz_free (nil on error).
@_cdecl("onkey_shz_signature")
public func onkey_shz_signature(_ x: UnsafePointer<Float>, _ n: Int32, _ rate: Double, _ outLen: UnsafeMutablePointer<Int32>) -> UnsafeMutablePointer<UInt8>? {
    autoreleasepool { signatureNow(x, n, rate, outLen) }
}

/// See `matchNow`.
@_cdecl("onkey_shz_match")
public func onkey_shz_match(_ h: Int32, _ sig: UnsafePointer<UInt8>, _ len: Int32, _ outId: UnsafeMutablePointer<CChar>,
                            _ cap: Int32, _ outOffset: UnsafeMutablePointer<Double>) -> Int32 {
    autoreleasepool { matchNow(h, sig, len, outId, cap, outOffset) }
}

/// See `shazamBegin`.
@_cdecl("onkey_shz_shazam_begin")
public func onkey_shz_shazam_begin(_ sig: UnsafePointer<UInt8>, _ len: Int32) -> Int32 {
    autoreleasepool { shazamBegin(sig, len) }
}

/// See `shazamPoll`.
@_cdecl("onkey_shz_shazam_poll")
public func onkey_shz_shazam_poll(_ t: Int32, _ out: UnsafeMutablePointer<CChar>, _ cap: Int32) -> Int32 {
    autoreleasepool { shazamPoll(t, out, cap) }
}

/// A ticket whose answer isn't wanted any more (it's dropped when it comes).
@_cdecl("onkey_shz_shazam_forget")
public func onkey_shz_shazam_forget(_ t: Int32) {
    lock.lock(); asked[t] = nil; lock.unlock()
}

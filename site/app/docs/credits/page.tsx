import type { Metadata } from "next";
import { codeUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Credits" };

const ROWS: [string, string, string, string][] = [
  ["CREPE (via torchcrepe)", "https://github.com/marl/crepe", "Pitch: full model when learning, tiny model live", "MIT"],
  ["GAME (OpenVPI)", "https://github.com/openvpi/GAME", "Each syllable's note", "MIT"],
  ["wav2vec 2.0 base 960h (torchaudio / fairseq)", "https://github.com/facebookresearch/fairseq", "When each word is sung", "MIT"],
  ["UVR MDX-Net Karaoke 2 (Ultimate Vocal Remover)", "https://github.com/Anjok07/ultimatevocalremovergui", "Separating the lead vocal", "MIT terms, with credit to UVR (Anjok07, aufr33)"],
  ["CMU Pronouncing Dictionary", "http://www.speech.cs.cmu.edu/cgi-bin/cmudict", "Syllable counts", "BSD-style"],
  ["LRCLIB", "https://lrclib.net", "Synced lyrics, fetched at runtime", "Service"],
  ["ShazamKit (Apple)", "https://developer.apple.com/shazamkit/", "Naming new songs", "Part of macOS"],
  ["iTunes Search API (Apple)", "https://performance-partners.apple.com/search-api", "Album covers and song lengths", "Service"],
  ["US English hyphenation patterns (hyph-utf8)", "https://github.com/hyphenation/tex-hyphen", "Splitting words into syllables", "Permissive (Kuiken)"],
  ["ONNX Runtime", "https://onnxruntime.ai", "Running the models", "MIT"],
  ["Tauri", "https://tauri.app", "The app", "MIT / Apache-2.0"],
];

export default function Credits() {
  return (
    <>
      <h1>Credits</h1>
      <p className="lede">OnKey is built on these open projects and services.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Component</th><th>Used for</th><th>Licence</th></tr></thead>
          <tbody>
            {ROWS.map(([name, url, use, lic]) => (
              <tr key={name}><td><a href={url}>{name}</a></td><td>{use}</td><td>{lic}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>OnKey itself is free and open source under the MIT licence. Full notices are in <a href={codeUrl("THIRD_PARTY_NOTICES.md")}>THIRD_PARTY_NOTICES.md</a>.</p>
    </>
  );
}

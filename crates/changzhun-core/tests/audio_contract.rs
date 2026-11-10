use changzhun_core::{dsp, resample::Resampler, PITCH_HOP};

#[test]
fn device_callback_chunk_sizes_do_not_change_resampled_audio() {
    // WASAPI and Core Audio deliver different callback sizes. A Windows device adapter must
    // be able to feed the same streaming resampler without changing the learnt signal.
    let input: Vec<f32> = (0..48_000).map(|i| (i as f32 * 440.0 * std::f32::consts::TAU / 48_000.0).sin()).collect();
    let mut one = Resampler::new(48_000.0, 16_000.0);
    let mut expected = Vec::new();
    one.process(&input, &mut expected);
    for chunk in [127, 256, 480, 1024] {
        let mut stream = Resampler::new(48_000.0, 16_000.0);
        let mut actual = Vec::new();
        for block in input.chunks(chunk) { stream.process(block, &mut actual); }
        assert_eq!(actual.len(), expected.len(), "callback size {chunk}");
        assert!(actual.iter().zip(&expected).all(|(a,b)| (a-b).abs()<1e-5), "callback size {chunk}");
    }
    assert!(expected.len() > 15_900);
    assert_eq!(PITCH_HOP as f64 / 16_000.0, dsp::FRAME_S);
}

#[test]
fn scoring_is_consistent_across_octaves_and_pitch_errors() {
    assert_eq!(dsp::credit(dsp::fold(1200.0)), 1.0);
    assert_eq!(dsp::credit(dsp::fold(-1200.0)), 1.0);
    assert_eq!(dsp::credit(50.0), 1.0);
    assert_eq!(dsp::credit(100.0), 0.5);
    assert_eq!(dsp::credit(150.0), 0.0);
    assert_eq!(dsp::credit(-150.0), 0.0);
}

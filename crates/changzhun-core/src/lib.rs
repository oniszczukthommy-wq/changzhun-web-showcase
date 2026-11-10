//! Shared, platform-independent algorithms used by the Mac application and tested on Windows.
//! Device capture, model execution, browser control and permissions belong to platform adapters.
pub const PITCH_HOP: usize = 160;
pub mod dsp;
pub mod notes;
pub mod resample;
pub mod ctc;
pub mod bleed;
pub mod beats;

"""Export the word-alignment model (torchaudio's WAV2VEC2_ASR_BASE_960H, fairseq weights, MIT) to ONNX in
16-bit floats: python export_wav2vec2.py OUT.onnx. Needs torch, torchaudio, onnx, onnxruntime.
Input "audio" (1, samples): 16 kHz mono; output "logprobs" (1, frames, 29): log-probabilities over
- | E T A O N I H S R D L U M W C F G Y P B V K ' X J Q Z, one frame per 20 ms."""
import sys, os, tempfile, torch, torchaudio, onnx
from onnxruntime.transformers.float16 import convert_float_to_float16
out = sys.argv[1]
m = torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H.get_model().eval()
class W(torch.nn.Module):
    def __init__(s, m): super().__init__(); s.m = m
    def forward(s, x): return torch.log_softmax(s.m(x)[0], -1)
tmp = os.path.join(tempfile.mkdtemp(), "w2v.onnx")
torch.onnx.export(W(m), (torch.randn(1, 32000),), tmp, input_names=["audio"], output_names=["logprobs"],
                  dynamic_axes={"audio": {1: "samples"}, "logprobs": {1: "frames"}}, opset_version=17, dynamo=False)
onnx.save(convert_float_to_float16(onnx.load(tmp), keep_io_types=True), out)
print("exported", out)

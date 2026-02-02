#!/usr/bin/env python3
"""
Minimal SadTalker server wrapper

Endpoints:
- POST /talk  -> upload multipart 'audio' (wav) and return generated MP4
- POST /speak -> accept JSON { text, voice? } -> synthesize WAV (edge-tts) -> run SadTalker -> return MP4
- GET  /healthz -> returns 200

Notes:
- Must be run from SadTalker repo root (so inference.py is available) or adjust paths.
- Requires: flask, flask_cors, edge-tts
  pip install flask flask-cors edge-tts

Run:
  export FLASK_APP=server.py
  flask run --host=0.0.0.0 --port=5000

This is a simple, unsecure example meant for local GPU servers behind a firewall.
"""
import asyncio
import os
import subprocess
import uuid
from pathlib import Path
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS

try:
    import edge_tts
except Exception:
    edge_tts = None

app = Flask(__name__)
CORS(app)

BASE = Path(__file__).resolve().parent
SADTALKER_ROOT = os.environ.get('SADTALKER_ROOT', str(BASE))
TEMP = BASE / 'temp'
RESULTS = BASE / 'results'
SOURCE_IMAGE = BASE / 'face.jpg'  # put your face image here

os.makedirs(TEMP, exist_ok=True)
os.makedirs(RESULTS, exist_ok=True)


def run_sadtalker(audio_path: str, out_dir: str, source_image: str = None):
    """Run SadTalker inference.py synchronously.

    The SADTALKER_ROOT env var can point to the SadTalker repo root. If not set, the server directory is used.
    """
    source = source_image or str(SOURCE_IMAGE)
    cmd = [
        'python',
        'inference.py',
        '--source_image',
        str(source),
        '--driven_audio',
        str(audio_path),
        '--result_dir',
        str(out_dir),
    ]

    proc = subprocess.run(cmd, cwd=SADTALKER_ROOT)
    return proc.returncode == 0


@app.route('/healthz', methods=['GET'])
def healthz():
    return 'OK', 200


@app.route('/talk', methods=['POST'])
def talk():
    if 'audio' not in request.files:
        return jsonify({'error': 'Missing audio file field `audio`'}), 400

    audio = request.files['audio']
    uid = str(uuid.uuid4())
    audio_path = str(TEMP / f"{uid}.wav")
    output_dir = str(RESULTS / uid)
    os.makedirs(output_dir, exist_ok=True)

    audio.save(audio_path)

    ok = run_sadtalker(audio_path, output_dir)
    if not ok:
        return jsonify({'error': 'SadTalker failed to render'}), 500

    # Find mp4
    for f in os.listdir(output_dir):
        if f.endswith('.mp4'):
            return send_file(os.path.join(output_dir, f), mimetype='video/mp4')

    return jsonify({'error': 'No MP4 found'}), 500


@app.route('/speak', methods=['POST'])
def speak():
    if edge_tts is None:
        return jsonify({'error': 'edge-tts not installed on server'}), 500

    data = request.get_json() or {}
    text = data.get('text', '')
    voice = data.get('voice', 'en-US-JennyNeural')

    if not text:
        return jsonify({'error': 'Missing text body'}), 400

    uid = str(uuid.uuid4())
    wav_path = str(TEMP / f"{uid}.wav")
    output_dir = str(RESULTS / uid)
    os.makedirs(output_dir, exist_ok=True)

    # Synthesize using edge-tts
    try:
        asyncio.get_event_loop()
    except RuntimeError:
        # in some environments there is no running loop
        pass

    try:
        asyncio.run(edge_tts.Communicate(text, voice).save(wav_path))
    except Exception as e:
        return jsonify({'error': f'Failed to synthesize TTS: {e}'}), 500

    ok = run_sadtalker(wav_path, output_dir)
    if not ok:
        return jsonify({'error': 'SadTalker failed to render'}), 500

    for f in os.listdir(output_dir):
        if f.endswith('.mp4'):
            return send_file(os.path.join(output_dir, f), mimetype='video/mp4')

    return jsonify({'error': 'No MP4 found'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

SadTalker integration

Quick notes to run a local SadTalker server (GPU required):

1) Server setup (on a GPU VM, e.g., T4):

```bash
sudo apt update
sudo apt install git ffmpeg python3 python3-pip -y
git clone https://github.com/OpenTalker/SadTalker.git
cd SadTalker
pip install -r requirements.txt
bash scripts/download_models.sh
```

2) Minimal server to accept audio and return an mp4 (example):

Place the example `server.py` in the SadTalker repo root, or set the `SADTALKER_ROOT` environment variable to point to the SadTalker repo when starting the server.

Create `server.py` in SadTalker root (example):

```py
from flask import Flask, request, send_file
import subprocess
import uuid
import os

app = Flask(__name__)

@app.route('/talk', methods=['POST'])
def talk():
    audio = request.files['audio']
    uid = str(uuid.uuid4())

    audio_path = f"temp/{uid}.wav"
    output_dir = f"results/{uid}"
    os.makedirs("temp", exist_ok=True)

    audio.save(audio_path)

    cmd = f"""
    python inference.py \
      --source_image face.jpg \
      --driven_audio {audio_path} \
      --result_dir {output_dir}
    """

    subprocess.run(cmd, shell=True)

    # find generated mp4
    for file in os.listdir(output_dir):
        if file.endswith('.mp4'):
            return send_file(os.path.join(output_dir, file), mimetype='video/mp4')

    return "Error", 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

3) From the app

- Go to Settings → Local Avatar Server and enable SadTalker, then set `http://YOUR_SERVER_IP:5000`.
- In a call, use the new "Upload WAV" button to upload a speech WAV and get back a talking MP4.

4) Automated server TTS (optional)


```bash
curl -X POST http://SERVER_IP:5000/speak -H "Content-Type: application/json" -d '{"text":"Hello there!","voice":"en-US-JennyNeural"}' --output out.mp4
Quick web test: serve `server/static` and open the page at http://localhost:8081/test.html then press Generate.

NPM scripts (from repo root):

- Serve the web test page (requires `npx serve`):
    - npm run sadtalker:serve-static

- Run the automated speak test (saves sadtalker_out.mp4 and opens it on macOS):
    - npm run sadtalker:test-speak -- http://SERVER_IP:5000 "Hello from automated test"

Notes: The test script uses the `/speak` endpoint (server TTS). If you'd prefer to upload a WAV instead, use the `/talk` endpoint with curl or the UI.
```

Install server deps:

```bash
pip install flask flask-cors edge-tts
```

Notes: `edge-tts` uses the Microsoft Edge TTS voices locally and does not require cloud credentials.

Notes

- The app currently uses manual WAV upload for SadTalker; you can later extend the app to generate WAVs automatically using a cloud TTS provider or a server-side TTS step.
- Uploaded WAV should be a clean single-speaker speech file (16k/24k/44.1kHz WAV works). Output MP4 is returned as a blob URL and played in the avatar.

Performance: A 10s clip on a T4 ~6-8s render time (depends on your machine and model versions).

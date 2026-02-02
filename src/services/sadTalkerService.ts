// Simple client for a local SadTalker server (expects /talk endpoint)
export async function sendAudioToSadTalker(file: File, serverUrl: string, apiKey?: string): Promise<{ videoUrl: string } | { error: string }> {
  try {
    const url = serverUrl.endsWith('/talk') ? serverUrl : `${serverUrl.replace(/\/$/, '')}/talk`;
    const fd = new FormData();
    fd.append('audio', file, file.name || 'speech.wav');

    const headers: Record<string,string> = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text();
      return { error: `SadTalker server error: ${res.status} ${text}` };
    }

    // We expect an mp4 blob back
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return { videoUrl: objectUrl };
  } catch (err: any) {
    console.error('SadTalker error', err);
    return { error: err.message || 'Failed to contact SadTalker server' };
  }
}

// Synthesizes text on the server (POST /speak) and returns a blob URL pointing at the MP4
export async function synthesizeTextToSadTalker(text: string, serverUrl: string, voice?: string, apiKey?: string): Promise<{ videoUrl: string } | { error: string }> {
  try {
    const url = serverUrl.replace(/\/$/, '') + '/speak';
    const headers: Record<string,string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, voice }),
    });

    if (!res.ok) {
      const textRes = await res.text();
      return { error: `SadTalker speak error: ${res.status} ${textRes}` };
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return { videoUrl: objectUrl };
  } catch (err: any) {
    console.error('SadTalker synth error', err);
    return { error: err.message || 'Failed to contact SadTalker /speak' };
  }
}

// D-ID API Integration
// D-ID creates realistic talking videos from photos
// This uses your D-ID API key to generate real lip-synced videos!

const DID_API_URL = 'https://api.d-id.com';

interface CreateTalkResponse {
  id: string;
  status: 'created' | 'started' | 'done' | 'error';
  result_url?: string;
}

interface TalkStatusResponse {
  id: string;
  status: 'created' | 'started' | 'done' | 'error';
  result_url?: string;
  error?: { message: string };
}

// Create a talking video using D-ID API
export async function createTalkingVideo(
  apiKey: string,
  imageUrl: string,
  text: string,
  voiceId: string = 'en-US-JennyNeural' // Microsoft voice
): Promise<{ videoUrl: string } | { error: string }> {
  try {
    console.log('Creating D-ID video with voice:', voiceId);
    
    // Step 1: Create the talk request
    const createResponse = await fetch(`${DID_API_URL}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        source_url: imageUrl,
        script: {
          type: 'text',
          input: text,
          provider: {
            type: 'microsoft',
            voice_id: voiceId,
          },
        },
        config: {
          fluent: true,
          pad_audio: 0,
          stitch: true,
        },
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      console.error('D-ID Create Error:', errorData);
      
      if (createResponse.status === 401) {
        return { error: 'Invalid API key. Please check your D-ID API key.' };
      }
      if (createResponse.status === 402) {
        return { error: 'Insufficient credits. Please add credits to your D-ID account.' };
      }
      
      return { error: errorData.message || errorData.description || 'Failed to create video' };
    }

    const createData: CreateTalkResponse = await createResponse.json();
    const talkId = createData.id;
    
    console.log('D-ID Talk created:', talkId);

    // Step 2: Poll for completion (video takes time to render)
    let attempts = 0;
    const maxAttempts = 60; // Max 60 seconds

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`${DID_API_URL}/talks/${talkId}`, {
        headers: {
          'Authorization': `Basic ${apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!statusResponse.ok) {
        console.error('D-ID Status check failed');
        return { error: 'Failed to check video status' };
      }

      const statusData: TalkStatusResponse = await statusResponse.json();
      console.log('D-ID Status:', statusData.status);

      if (statusData.status === 'done' && statusData.result_url) {
        console.log('D-ID Video ready:', statusData.result_url);
        return { videoUrl: statusData.result_url };
      }

      if (statusData.status === 'error') {
        console.error('D-ID Error:', statusData.error);
        return { error: statusData.error?.message || 'Video generation failed' };
      }

      attempts++;
    }

    return { error: 'Video generation timed out. Please try again.' };
  } catch (error) {
    console.error('D-ID API Error:', error);
    return { error: 'Network error. Please check your internet connection.' };
  }
}

// Get available Microsoft Azure voices for D-ID
export function getAvailableVoices() {
  return {
    female: [
      { id: 'en-US-JennyNeural', name: 'Jenny (US Female)' },
      { id: 'en-US-AriaNeural', name: 'Aria (US Female)' },
      { id: 'en-US-SaraNeural', name: 'Sara (US Female)' },
      { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female)' },
      { id: 'en-AU-NatashaNeural', name: 'Natasha (AU Female)' },
    ],
    male: [
      { id: 'en-US-GuyNeural', name: 'Guy (US Male)' },
      { id: 'en-US-DavisNeural', name: 'Davis (US Male)' },
      { id: 'en-US-TonyNeural', name: 'Tony (US Male)' },
      { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male)' },
      { id: 'en-AU-WilliamNeural', name: 'William (AU Male)' },
    ],
  };
}

// Validate D-ID API key by checking credits
export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; credits?: number; error?: string }> {
  try {
    const response = await fetch(`${DID_API_URL}/credits`, {
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return { valid: true, credits: data.remaining };
    }
    
    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }
    
    return { valid: false, error: 'Failed to validate' };
  } catch {
    return { valid: false, error: 'Network error' };
  }
}

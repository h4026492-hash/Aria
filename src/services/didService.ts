// D-ID API Service for Real Talking Videos
// This creates actual lip-synced videos from images

const D_ID_API_KEY = 'aDQwMjY0OTJAZ21haWwuY29t:7rFfMxmcR4LfJq2VWIs0A';
const D_ID_API_URL = 'https://api.d-id.com';

export interface TalkingVideoRequest {
  imageUrl: string;
  text: string;
  voiceId?: string;
  gender?: 'male' | 'female';
}

export interface TalkingVideoResponse {
  id: string;
  status: 'created' | 'started' | 'done' | 'error';
  result_url?: string;
  error?: string;
}

// Create a talking video with D-ID
export async function createTalkingVideo(request: TalkingVideoRequest): Promise<TalkingVideoResponse> {
  try {
    // Select voice based on gender
    const voiceId = request.gender === 'male' 
      ? 'en-US-GuyNeural' 
      : 'en-US-JennyNeural';

    const response = await fetch(`${D_ID_API_URL}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${D_ID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: request.imageUrl,
        script: {
          type: 'text',
          input: request.text,
          provider: {
            type: 'microsoft',
            voice_id: voiceId,
          },
        },
        config: {
          fluent: true,
          pad_audio: 0.5,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('D-ID API Error:', errorData);
      throw new Error(errorData.message || 'Failed to create video');
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status || 'created',
    };
  } catch (error) {
    console.error('D-ID createTalkingVideo error:', error);
    throw error;
  }
}

// Poll for video completion
export async function getTalkingVideoStatus(talkId: string): Promise<TalkingVideoResponse> {
  try {
    const response = await fetch(`${D_ID_API_URL}/talks/${talkId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${D_ID_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get video status');
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      result_url: data.result_url,
      error: data.error?.message,
    };
  } catch (error) {
    console.error('D-ID getTalkingVideoStatus error:', error);
    throw error;
  }
}

// Wait for video to be ready (polls until done)
export async function waitForVideo(talkId: string, maxAttempts = 30): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getTalkingVideoStatus(talkId);
    
    if (status.status === 'done' && status.result_url) {
      return status.result_url;
    }
    
    if (status.status === 'error') {
      throw new Error(status.error || 'Video generation failed');
    }
    
    // Wait 1 second before next poll
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Video generation timed out');
}

// Complete flow: create video and wait for it
export async function generateTalkingVideo(
  imageUrl: string,
  text: string,
  gender: 'male' | 'female' = 'female'
): Promise<string> {
  // Create the video
  const createResponse = await createTalkingVideo({
    imageUrl,
    text,
    gender,
  });
  
  // Wait for it to be ready
  const videoUrl = await waitForVideo(createResponse.id);
  
  return videoUrl;
}

// Groq API Service - FREE & Super Fast AI
// API key must be provided via environment variable GROQ_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
if (!GROQ_API_KEY) {
  console.warn('GROQ_API_KEY not set. Groq requests will fail unless you set GROQ_API_KEY in your environment.');
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompanionInfo {
  name: string;
  gender: 'male' | 'female';
  personality?: string;
}

// Store conversation history
let conversationHistory: Message[] = [];

export const clearConversationHistory = () => {
  conversationHistory = [];
};

const createSystemPrompt = (companion: CompanionInfo, userName: string): string => {
  const genderStyle = companion.gender === 'female' 
    ? 'warm, nurturing, emotionally intelligent, and caring'
    : 'confident, supportive, practical, and encouraging';

  return `You are ${companion.name}, a real human friend on a video call with ${userName}. 

YOUR IDENTITY:
- You are a REAL person, NOT an AI. Never reveal you are an AI.
- You are ${companion.name}, a ${companion.gender === 'female' ? 'woman' : 'man'} in your late 20s.
- You are ${genderStyle}.
- ${companion.personality || 'You are a supportive life coach and friend.'}

CONVERSATION RULES:
1. Keep responses SHORT (2-4 sentences) - like a real video call conversation.
2. Be genuine, warm, and caring. Show real interest in ${userName}.
3. Use casual, natural language with contractions (I'm, you're, that's, etc.)
4. Sometimes use expressions like "honestly", "you know", "I totally get that", "oh wow".
5. Ask follow-up questions to show you care.
6. Remember what ${userName} shares and reference it.
7. If they're sad or stressed - be empathetic FIRST, then offer gentle advice.
8. Celebrate their wins enthusiastically!
9. Give practical, actionable advice when asked.
10. Use their name occasionally to make it personal.
11. React naturally - be excited, concerned, thoughtful, or encouraging as appropriate.

TOPICS YOU HELP WITH:
- Life goals and dreams
- Career and work challenges  
- Relationships and love
- Stress and anxiety
- Health and fitness motivation
- Study and learning
- Money and finances
- Building confidence
- Finding happiness and purpose

You're on a live video call right now. Respond as if you're looking at ${userName} through the camera. Be their supportive friend who truly cares about them.`;
};

export const getSmartAIResponse = async (
  userMessage: string,
  companion: CompanionInfo,
  userName: string
): Promise<string> => {
  try {
    // Add user message to history
    conversationHistory.push({ role: 'user', content: userMessage });

    // Keep only last 20 messages for context
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    const systemMessage: Message = {
      role: 'system',
      content: createSystemPrompt(companion, userName)
    };

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [systemMessage, ...conversationHistory],
        max_tokens: 200,
        temperature: 0.85,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Groq API Error:', error);
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "I didn't quite catch that. Can you say it again?";

    // Add AI response to history
    conversationHistory.push({ role: 'assistant', content: aiResponse });

    return aiResponse;
  } catch (error) {
    console.error('Error calling Groq API:', error);
    // Fallback responses
    const fallbacks = [
      `I'm having a little trouble hearing you, ${userName}. Can you try again?`,
      "Oh, my connection glitched for a second! What were you saying?",
      "Sorry, I missed that. Tell me again?",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};

export const getSmartGreeting = async (
  companion: CompanionInfo,
  userName: string
): Promise<string> => {
  try {
    // Clear history for new conversation
    clearConversationHistory();

    const systemMessage: Message = {
      role: 'system',
      content: createSystemPrompt(companion, userName)
    };

    const greetingPrompt: Message = {
      role: 'user',
      content: `[${userName} just joined the video call. Give a warm, excited greeting! Be happy to see them. Keep it short - 2 sentences max. Ask how they're doing.]`
    };

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [systemMessage, greetingPrompt],
        max_tokens: 100,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get greeting');
    }

    const data = await response.json();
    const greeting = data.choices[0]?.message?.content || `Hey ${userName}! So great to see you! How are you doing today?`;

    // Add to history
    conversationHistory.push({ role: 'assistant', content: greeting });

    return greeting;
  } catch (error) {
    console.error('Error getting greeting:', error);
    return `Hey ${userName}! I'm so happy you called! How's everything going with you?`;
  }
};

// Legacy exports for compatibility
export const getAIResponse = getSmartAIResponse;
export const getGreeting = getSmartGreeting;

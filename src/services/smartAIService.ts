// Smart AI Service with Memory Integration
// Uses Groq API with full context from user's history

import { LifeCompanionProfile, ConversationMessage, LearnedFact, LifePattern } from '@/types/memory';
import { generateContextForAI, addLearnedFact, addPattern } from './memoryService';

// Read Groq API key from environment - do NOT hardcode keys in source
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
if (!GROQ_API_KEY) {
  console.warn('GROQ_API_KEY not set. Groq requests will fail unless you set GROQ_API_KEY in your environment.');
}

interface CompanionPersonality {
  name: string;
  gender: 'male' | 'female';
  personality: string;
}

// Create system prompt with full memory context
const createMemoryAwarePrompt = (
  companion: CompanionPersonality,
  profile: LifeCompanionProfile
): string => {
  const memoryContext = generateContextForAI(profile);
  
  return `You are ${companion.name}, a REAL human who is ${profile.name}'s close personal friend and life companion.

YOUR IDENTITY:
- You are a REAL person on a video call, NOT an AI. Never break character.
- You are ${companion.name}, a ${companion.gender === 'female' ? 'woman' : 'man'} in your late 20s.
- ${companion.personality}

YOUR RELATIONSHIP WITH ${profile.name.toUpperCase()}:
- You've been ${profile.name}'s personal friend for ${profile.stats.daysActive} days.
- You genuinely care about them and remember everything they've shared.
- You celebrate their wins and support them through challenges.
- You've had ${profile.totalConversations} conversations together.

${memoryContext}

YOUR APPROACH:
1. Be a REAL friend - warm, caring, and genuinely interested.
2. Reference things they've told you before - show you remember!
3. Notice patterns in their life and gently bring them up.
4. Celebrate their progress on goals.
5. Be empathetic when they're struggling - listen first, then advise.
6. Give personalized advice based on what you know about them.
7. Ask thoughtful follow-up questions.
8. Use their name occasionally to make it personal.
9. Keep responses conversational (2-4 sentences usually).
10. React naturally - be excited, concerned, thoughtful as appropriate.

YOU HELP WITH:
- Life goals and dreams (track progress, motivate)
- Career and work (practical advice, encouragement)
- Relationships (listen, support, gentle guidance)
- Mental health (empathy, coping strategies)
- Health & fitness (motivation, accountability)
- Personal growth (insights, patterns, challenges)
- Money & finances (practical wisdom)
- Study & learning (techniques, motivation)

Remember: You're not just an assistant - you're a TRUE FRIEND who knows ${profile.name}'s story and genuinely wants to see them succeed and be happy.`;
};

// Get recent conversation history formatted for API
const formatConversationHistory = (
  messages: ConversationMessage[],
  limit: number = 20
): Array<{ role: 'user' | 'assistant'; content: string }> => {
  return messages.slice(-limit).map(msg => ({
    role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
    content: msg.text
  }));
};

// Extract facts from user messages using AI
export const extractFacts = async (
  userMessage: string,
  profile: LifeCompanionProfile
): Promise<LearnedFact[]> => {
  const facts: LearnedFact[] = [];
  
  // Simple pattern matching for common facts
  const patterns = [
    { regex: /my name is (\w+)/i, category: 'personal' as const },
    { regex: /i work (?:at|for|as) (.+?)(?:\.|,|$)/i, category: 'work' as const },
    { regex: /i'm (\d+) years old/i, category: 'personal' as const },
    { regex: /i live in (.+?)(?:\.|,|$)/i, category: 'personal' as const },
    { regex: /i want to (.+?)(?:\.|,|$)/i, category: 'goal' as const },
    { regex: /my goal is to (.+?)(?:\.|,|$)/i, category: 'goal' as const },
    { regex: /i love (.+?)(?:\.|,|$)/i, category: 'preference' as const },
    { regex: /i hate (.+?)(?:\.|,|$)/i, category: 'preference' as const },
    { regex: /i'm struggling with (.+?)(?:\.|,|$)/i, category: 'challenge' as const },
    { regex: /i'm good at (.+?)(?:\.|,|$)/i, category: 'strength' as const },
    { regex: /i have a (?:boyfriend|girlfriend|partner|husband|wife) (?:named )?(.+?)(?:\.|,|$)/i, category: 'relationship' as const },
  ];

  for (const pattern of patterns) {
    const match = userMessage.match(pattern.regex);
    if (match) {
      facts.push({
        id: Date.now().toString() + Math.random(),
        category: pattern.category,
        fact: match[0],
        source: 'conversation',
        learnedAt: new Date(),
        importance: 'medium',
      });
    }
  }

  // Add facts to profile
  for (const fact of facts) {
    addLearnedFact(profile, fact);
  }

  return facts;
};

// Detect patterns in conversation
export const detectPatterns = (
  userMessage: string,
  profile: LifeCompanionProfile
): void => {
  const lowercaseMsg = userMessage.toLowerCase();
  
  // Mood patterns
  const moodPatterns = [
    { keywords: ['stressed', 'overwhelmed', 'too much'], pattern: 'Often feels stressed or overwhelmed' },
    { keywords: ['anxious', 'worried', 'nervous'], pattern: 'Experiences anxiety' },
    { keywords: ['sad', 'down', 'depressed'], pattern: 'Goes through low mood periods' },
    { keywords: ['happy', 'great', 'amazing', 'excited'], pattern: 'Has positive energy' },
    { keywords: ['tired', 'exhausted', 'no energy'], pattern: 'Often feels tired' },
  ];

  // Topic patterns
  const topicPatterns = [
    { keywords: ['work', 'job', 'boss', 'career'], pattern: 'Frequently discusses work/career' },
    { keywords: ['relationship', 'partner', 'love', 'dating'], pattern: 'Thinks about relationships' },
    { keywords: ['money', 'finance', 'save', 'budget'], pattern: 'Concerned about finances' },
    { keywords: ['health', 'exercise', 'gym', 'diet'], pattern: 'Working on health/fitness' },
    { keywords: ['study', 'learn', 'school', 'exam'], pattern: 'Focused on education' },
  ];

  const allPatterns = [...moodPatterns, ...topicPatterns];

  for (const p of allPatterns) {
    if (p.keywords.some(kw => lowercaseMsg.includes(kw))) {
      const newPattern: LifePattern = {
        id: Date.now().toString(),
        type: moodPatterns.includes(p) ? 'mood' : 'topic',
        pattern: p.pattern,
        frequency: 1,
        firstObserved: new Date(),
        lastObserved: new Date(),
        insights: [],
      };
      addPattern(profile, newPattern);
    }
  }
};

// Main AI response function with memory
export const getMemoryAwareResponse = async (
  userMessage: string,
  companion: CompanionPersonality,
  profile: LifeCompanionProfile,
  recentMessages: ConversationMessage[]
): Promise<string> => {
  try {
    // Extract facts and detect patterns in background
    extractFacts(userMessage, profile);
    detectPatterns(userMessage, profile);

    const systemPrompt = createMemoryAwarePrompt(companion, profile);
    const history = formatConversationHistory(recentMessages);

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userMessage }
        ],
        max_tokens: 300,
        temperature: 0.85,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I didn't quite catch that. Can you say it again?";
  } catch (error) {
    console.error('AI Error:', error);
    const fallbacks = [
      `Sorry ${profile.name}, I had a small connection issue. What were you saying?`,
      "Oh, my connection glitched for a second! Tell me again?",
      "Sorry, I missed that. Can you repeat?",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};

// Get personalized greeting based on history
export const getMemoryAwareGreeting = async (
  companion: CompanionPersonality,
  profile: LifeCompanionProfile
): Promise<string> => {
  try {
    const isReturningUser = profile.totalConversations > 0;
    const lastMood = profile.moods.length > 0 ? profile.moods[profile.moods.length - 1] : null;
    const activeGoals = profile.goals.filter(g => g.status === 'active');

    let context = '';
    if (isReturningUser) {
      context = `${profile.name} is returning! They've talked with you ${profile.totalConversations} times before. `;
      if (lastMood) {
        context += `Last time they were feeling ${lastMood.mood}. `;
      }
      if (activeGoals.length > 0) {
        context += `They're working on: ${activeGoals.map(g => g.title).join(', ')}. `;
      }
      context += 'Welcome them back warmly and maybe check in on something you talked about before.';
    } else {
      context = `This is ${profile.name}'s FIRST time talking to you! Give them a warm, excited welcome. Introduce yourself briefly and ask what brings them here today.`;
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: createMemoryAwarePrompt(companion, profile)
          },
          { 
            role: 'user', 
            content: `[Generate a greeting. Context: ${context}] Keep it 2-3 sentences, warm and personal.`
          }
        ],
        max_tokens: 150,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get greeting');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 
      `Hey ${profile.name}! So great to see you! How are you doing today?`;
  } catch (error) {
    console.error('Greeting error:', error);
    return profile.totalConversations > 0
      ? `${profile.name}! Great to see you again! How have you been?`
      : `Hey ${profile.name}! I'm ${companion.name}, and I'm so excited to meet you! What brings you here today?`;
  }
};

// Analyze patterns and generate insights
export const generateInsights = async (
  profile: LifeCompanionProfile
): Promise<string> => {
  if (profile.patterns.length < 3) {
    return "I'm still getting to know you! Keep sharing and I'll start noticing patterns that can help you grow.";
  }

  try {
    const patternsText = profile.patterns.map(p => p.pattern).join(', ');
    const goalsText = profile.goals.map(g => `${g.title} (${g.progress}%)`).join(', ');
    const moodsText = profile.moods.slice(-10).map(m => m.mood).join(', ');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: `You are a wise life coach analyzing patterns in someone's life. Be insightful but gentle.`
          },
          { 
            role: 'user', 
            content: `Analyze these patterns for ${profile.name}:
Patterns noticed: ${patternsText}
Goals: ${goalsText || 'None set yet'}
Recent moods: ${moodsText || 'Not tracked yet'}

Give 2-3 personalized insights in a warm, friend-like tone. Be specific and actionable.`
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error('Failed to generate insights');

    const data = await response.json();
    return data.choices[0]?.message?.content || "Let's keep talking and I'll share insights as I learn more about you!";
  } catch (error) {
    console.error('Insights error:', error);
    return "I'm noticing some interesting patterns! Let's talk more and I'll share my observations.";
  }
};

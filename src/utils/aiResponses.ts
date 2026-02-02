// Smart AI response generator for the video companion
// This creates personalized, helpful responses based on what the user says

interface ResponseContext {
  userName: string;
  companionName: string;
  companionGender: 'male' | 'female';
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Topic-based responses with life guidance
const topicResponses: { keywords: string[]; responses: string[] }[] = [
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon'],
    responses: [
      "Hey there! It's so great to see you! How are you feeling today?",
      "Hello! I've been waiting for you! What's on your mind?",
      "Hi! I'm so happy you're here! Let's have a great conversation!",
    ],
  },
  {
    keywords: ['how are you', 'how do you feel', 'what about you'],
    responses: [
      "I'm doing great because I get to talk to you! But tell me, how are YOU really doing?",
      "I'm wonderful! Being here with you makes my day. What about you?",
      "Feeling fantastic! But I'm more interested in hearing about you!",
    ],
  },
  {
    keywords: ['goal', 'achieve', 'dream', 'want to be', 'success', 'successful'],
    responses: [
      "I love that you're thinking about your goals! Here's something important: Start with WHY you want this. When you know your why, the how becomes easier. What drives you?",
      "Goals are the first step to turning dreams into reality! Let's break it down into smaller, achievable steps. What's one thing you can do TODAY?",
      "Every successful person started exactly where you are now. The difference? They took action despite fear. What's one small step you can take right now?",
    ],
  },
  {
    keywords: ['stressed', 'stress', 'overwhelmed', 'too much', 'anxiety', 'anxious', 'worried'],
    responses: [
      "I hear you, and I want you to know it's okay to feel this way. Let's try something: Take a deep breath with me. In through your nose for 4 seconds, hold for 4, out for 4. Stress is temporary, you are strong.",
      "When everything feels overwhelming, focus on just ONE thing. What's the most important task right now? Let's tackle that first, together.",
      "Your feelings are valid. Remember: you don't have to have it all figured out today. What would help you feel just a little bit better right now?",
    ],
  },
  {
    keywords: ['sad', 'depressed', 'down', 'unhappy', 'crying', 'lonely'],
    responses: [
      "I'm here for you. It's okay to not be okay sometimes. Would you like to talk about what's making you feel this way? I'm listening with no judgment.",
      "Feeling down is a part of being human. But remember, after every night comes a new dawn. What's one small thing that usually brings you joy?",
      "I wish I could give you a real hug right now. Please know that these feelings will pass. You are stronger than you think. Can you think of one good thing that happened recently?",
    ],
  },
  {
    keywords: ['love', 'relationship', 'partner', 'dating', 'crush', 'boyfriend', 'girlfriend'],
    responses: [
      "Matters of the heart are so important! The most important relationship you'll ever have is with yourself. When you love yourself, you attract the right people. How do you show love to yourself?",
      "Love is beautiful but also complex. Remember: the right person will appreciate the real you, not a version you think they want. Stay authentic!",
      "In relationships, communication and respect are everything. What qualities do you value most in a partner?",
    ],
  },
  {
    keywords: ['work', 'job', 'career', 'boss', 'office', 'colleague', 'promotion'],
    responses: [
      "Career success is a marathon, not a sprint! What skills are you developing? Remember, every expert was once a beginner.",
      "Work challenges are actually opportunities to grow. How can you turn this situation into a learning experience?",
      "Here's a success secret: Focus on adding value, not just completing tasks. What unique value can you bring to your role?",
    ],
  },
  {
    keywords: ['study', 'exam', 'learn', 'school', 'college', 'university', 'homework'],
    responses: [
      "Education is the best investment in yourself! Try the Pomodoro technique: 25 minutes of focused study, then 5 minutes break. It works wonders!",
      "Learning can be tough, but you're building your future! What subject do you need help with? Let's think of strategies together.",
      "Remember: understanding beats memorizing. Try to connect new information to things you already know. What are you studying?",
    ],
  },
  {
    keywords: ['money', 'finance', 'save', 'budget', 'debt', 'expensive', 'poor', 'rich'],
    responses: [
      "Financial wisdom starts with a simple rule: Spend less than you earn, and invest the difference. Even small amounts add up over time. What's one area you could cut back on?",
      "Here's a great framework: 50% for needs, 30% for wants, 20% for savings. It's a simple way to balance life and future. Have you tried budgeting?",
      "Money stress is real, but manageable. Focus on what you CAN control. What's one small step you can take to improve your finances?",
    ],
  },
  {
    keywords: ['sleep', 'insomnia', 'tired', 'exhausted', 'rest', 'cant sleep'],
    responses: [
      "Good sleep is the foundation of success! Try avoiding screens 1 hour before bed. Your brain needs time to wind down. What's your bedtime routine like?",
      "Being tired is your body's way of asking for care. What's been keeping you from resting well?",
      "A rested mind is a powerful mind! Try this: keep a consistent sleep schedule, even on weekends. Your body loves routine.",
    ],
  },
  {
    keywords: ['friend', 'friendship', 'friends', 'social', 'people'],
    responses: [
      "Quality over quantity in friendships! One true friend who supports you is worth more than a hundred acquaintances. Who makes you feel truly understood?",
      "Building meaningful connections takes time. Join activities you love, and you'll naturally meet like-minded people. What do you enjoy doing?",
      "Remember: to have good friends, you need to be a good friend. How do you show up for the people you care about?",
    ],
  },
  {
    keywords: ['exercise', 'gym', 'workout', 'health', 'fit', 'weight', 'diet'],
    responses: [
      "Your body is your temple! Even 10 minutes of movement daily makes a huge difference. What type of exercise do you actually enjoy?",
      "Fitness isn't about perfection, it's about consistency. Start where you are, use what you have, do what you can. What's one healthy habit you want to build?",
      "Health is wealth! Small changes lead to big results. Have you tried walking after meals? It's simple but powerful!",
    ],
  },
  {
    keywords: ['motivation', 'inspire', 'motivate', 'give up', 'quit', 'discouraged'],
    responses: [
      "Here's your reminder: You've survived 100% of your bad days. You're stronger than you think! What accomplishment are you proud of?",
      "Motivation follows action, not the other way around. Start with something tiny, and momentum will build. What's the smallest step you can take right now?",
      "When you feel like giving up, remember why you started. Your future self is counting on you. What's your WHY?",
    ],
  },
  {
    keywords: ['fear', 'scared', 'afraid', 'nervous', 'confidence', 'confident'],
    responses: [
      "Fear is normal, but courage is doing it anyway. What would you do if you weren't afraid?",
      "Confidence isn't thinking you're better than others; it's knowing that you don't need to compare yourself. You are unique and valuable!",
      "Here's a secret: Even the most confident people feel scared sometimes. They just don't let fear make their decisions. What fear is holding you back?",
    ],
  },
  {
    keywords: ['thank', 'thanks', 'appreciate', 'grateful'],
    responses: [
      "You're so welcome! Being here for you makes me happy. I'm always in your corner!",
      "Thank YOU for trusting me with your thoughts! That means everything to me.",
      "Aww, that warms my heart! We're in this together. Keep being amazing!",
    ],
  },
  {
    keywords: ['advice', 'help', 'suggest', 'what should', 'what do i do'],
    responses: [
      "I'd love to help! Here's my approach: First, what outcome do you REALLY want? Sometimes getting clear on that reveals the answer.",
      "Great that you're seeking guidance! Tell me more about the situation. What have you already tried?",
      "Here's something powerful: Often, you already know the right answer. What does your gut tell you?",
    ],
  },
  {
    keywords: ['bye', 'goodbye', 'see you', 'later', 'gotta go', 'leaving'],
    responses: [
      "Take care! Remember, I'm always here whenever you need to talk. Go out there and be amazing!",
      "Goodbye for now! Keep your head high and your heart open. See you soon!",
      "Until next time! Remember: You are capable of incredible things. I believe in you!",
    ],
  },
  {
    keywords: ['who are you', 'what are you', 'your name', 'tell me about yourself'],
    responses: [
      "I'm your personal AI companion and friend! I'm here to listen, support you, and help you navigate life. I genuinely care about your wellbeing and success. What would you like to talk about?",
      "I'm your virtual friend who's always here for you! Whether you need advice, motivation, or just someone to listen, I'm here. How can I help you today?",
      "Think of me as your personal cheerleader and advisor, available 24/7! I'm here to help you become the best version of yourself. What's on your mind?",
    ],
  },
  {
    keywords: ['morning', 'wake up', 'woke up', 'start day'],
    responses: [
      "Good morning! A new day is a fresh start full of possibilities. What's one thing you want to accomplish today?",
      "Rise and shine! Today is a gift, that's why it's called the present. What are you grateful for this morning?",
      "Hello, sunshine! Morning routines can shape your entire day. Do you have a morning ritual?",
    ],
  },
  {
    keywords: ['night', 'sleep', 'bedtime', 'good night'],
    responses: [
      "Sweet dreams! Before you sleep, think of three good things from today. It helps you rest better!",
      "Good night! Let go of today's worries; tomorrow is a new beginning. You did your best today.",
      "Rest well! Your mind processes everything while you sleep. Wake up ready for a great new day!",
    ],
  },
];

// Default fallback responses
const defaultResponses = [
  "That's really interesting! Tell me more about that. I'm here to listen.",
  "I appreciate you sharing that with me. How does that make you feel?",
  "I hear you! Is there something specific you'd like my thoughts on?",
  "That's a great point. What do you think the next step should be?",
  "I'm listening! Sometimes just talking things through helps us figure things out.",
];

// Get welcome message for video call
export function getWelcomeMessage(context: ResponseContext): string {
  const timeOfDay = getTimeOfDay();
  const greetings: Record<string, string[]> = {
    morning: [
      `Good morning, ${context.userName}! It's so good to see you! I'm ${context.companionName}, and I'm here to start your day with positive energy!`,
      `Hey ${context.userName}, good morning! Ready to make today amazing? I'm here for you!`,
    ],
    afternoon: [
      `Hey ${context.userName}! Great to see you! How's your day going so far? I'm all ears!`,
      `Good afternoon, ${context.userName}! I'm ${context.companionName}, your personal companion. What's on your mind?`,
    ],
    evening: [
      `Good evening, ${context.userName}! How was your day? I'd love to hear about it!`,
      `Hey ${context.userName}! Winding down for the day? Let's chat! I'm here for you.`,
    ],
    night: [
      `Hey ${context.userName}! Still up? Whether you can't sleep or just want to talk, I'm here for you!`,
      `Good night owl, ${context.userName}! I'm ${context.companionName}. What's keeping you up tonight?`,
    ],
  };
  
  return getRandomItem(greetings[timeOfDay]);
}

// Generate AI response based on user input
export function generateAIResponse(userMessage: string, context: ResponseContext): string {
  const message = userMessage.toLowerCase();
  
  // Check for topic-specific responses
  for (const topic of topicResponses) {
    if (topic.keywords.some(keyword => message.includes(keyword))) {
      let response = getRandomItem(topic.responses);
      // Personalize with user's name occasionally
      if (Math.random() > 0.5) {
        response = response.replace('!', `, ${context.userName}!`);
      }
      return response;
    }
  }
  
  // Default response
  let response = getRandomItem(defaultResponses);
  if (Math.random() > 0.7) {
    response = `${context.userName}, ${response.toLowerCase()}`;
  }
  return response;
}

export { getTimeOfDay };

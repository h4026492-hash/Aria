// Persistent Memory Service
// Stores and retrieves all user data from localStorage

import { 
  LifeCompanionProfile, 
  ConversationMessage,
  MoodEntry,
  Goal,
  JournalEntry,
  LearnedFact,
  Insight,
  LifePattern,
  createEmptyProfile
} from '@/types/memory';

const STORAGE_KEY = 'life-companion-memory';

// Get full profile from storage
export const getProfile = (): LifeCompanionProfile | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const profile = JSON.parse(data);
      // Convert date strings back to Date objects
      profile.createdAt = new Date(profile.createdAt);
      profile.lastActiveAt = new Date(profile.lastActiveAt);
      return profile;
    }
    return null;
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
};

// Save full profile to storage
export const saveProfile = (profile: LifeCompanionProfile): void => {
  try {
    profile.lastActiveAt = new Date();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile:', error);
  }
};

// Create new profile
export const createProfile = (
  name: string, 
  companionId: string, 
  companionName: string, 
  companionGender: 'male' | 'female'
): LifeCompanionProfile => {
  const profile = createEmptyProfile(name, companionId, companionName, companionGender);
  saveProfile(profile);
  return profile;
};

// Update user name
export const updateUserName = (profile: LifeCompanionProfile, name: string): LifeCompanionProfile => {
  const updated = { ...profile, name };
  saveProfile(updated);
  return updated;
};

// Add message to current conversation
export const addMessage = (
  profile: LifeCompanionProfile, 
  message: ConversationMessage
): LifeCompanionProfile => {
  const today = new Date().toDateString();
  let currentConversation = profile.conversations.find(
    c => new Date(c.date).toDateString() === today
  );

  if (!currentConversation) {
    currentConversation = {
      id: Date.now().toString(),
      date: new Date(),
      messages: [],
    };
    profile.conversations.push(currentConversation);
    profile.totalConversations++;
  }

  currentConversation.messages.push(message);
  profile.totalMessages++;
  
  saveProfile(profile);
  return profile;
};

// Get all messages for context (last N messages across all conversations)
export const getRecentMessages = (profile: LifeCompanionProfile, limit: number = 50): ConversationMessage[] => {
  const allMessages: ConversationMessage[] = [];
  
  // Get messages from recent conversations (newest first)
  const sortedConversations = [...profile.conversations].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (const conversation of sortedConversations) {
    allMessages.push(...conversation.messages);
    if (allMessages.length >= limit) break;
  }

  return allMessages.slice(0, limit);
};

// Add mood entry
export const addMood = (
  profile: LifeCompanionProfile, 
  mood: MoodEntry
): LifeCompanionProfile => {
  profile.moods.push(mood);
  
  // Update average mood
  const recentMoods = profile.moods.slice(-30);
  const moodValues = { amazing: 10, good: 8, okay: 6, low: 4, stressed: 3, anxious: 2, sad: 1 };
  const avg = recentMoods.reduce((sum, m) => sum + (moodValues[m.mood] || 5), 0) / recentMoods.length;
  profile.stats.averageMood = Math.round(avg * 10) / 10;
  
  saveProfile(profile);
  return profile;
};

// Add goal
export const addGoal = (
  profile: LifeCompanionProfile, 
  goal: Goal
): LifeCompanionProfile => {
  profile.goals.push(goal);
  saveProfile(profile);
  return profile;
};

// Update goal
export const updateGoal = (
  profile: LifeCompanionProfile, 
  goalId: string, 
  updates: Partial<Goal>
): LifeCompanionProfile => {
  const goalIndex = profile.goals.findIndex(g => g.id === goalId);
  if (goalIndex !== -1) {
    profile.goals[goalIndex] = { ...profile.goals[goalIndex], ...updates };
    
    // If completed, update stats
    if (updates.status === 'completed') {
      profile.stats.goalsCompleted++;
    }
  }
  saveProfile(profile);
  return profile;
};

// Add journal entry
export const addJournalEntry = (
  profile: LifeCompanionProfile, 
  entry: JournalEntry
): LifeCompanionProfile => {
  profile.journal.push(entry);
  profile.stats.journalEntries++;
  saveProfile(profile);
  return profile;
};

// Add learned fact
export const addLearnedFact = (
  profile: LifeCompanionProfile, 
  fact: LearnedFact
): LifeCompanionProfile => {
  // Don't add duplicate facts
  const exists = profile.learnedFacts.some(f => 
    f.fact.toLowerCase() === fact.fact.toLowerCase()
  );
  
  if (!exists) {
    profile.learnedFacts.push(fact);
    saveProfile(profile);
  }
  return profile;
};

// Add insight
export const addInsight = (
  profile: LifeCompanionProfile, 
  insight: Insight
): LifeCompanionProfile => {
  profile.insights.push(insight);
  saveProfile(profile);
  return profile;
};

// Add pattern
export const addPattern = (
  profile: LifeCompanionProfile, 
  pattern: LifePattern
): LifeCompanionProfile => {
  // Update if pattern exists, otherwise add
  const existingIndex = profile.patterns.findIndex(p => p.pattern === pattern.pattern);
  if (existingIndex !== -1) {
    profile.patterns[existingIndex] = {
      ...profile.patterns[existingIndex],
      frequency: profile.patterns[existingIndex].frequency + 1,
      lastObserved: new Date(),
    };
  } else {
    profile.patterns.push(pattern);
  }
  saveProfile(profile);
  return profile;
};

// Update streak
export const updateStreak = (profile: LifeCompanionProfile): LifeCompanionProfile => {
  const today = new Date().toDateString();
  const lastActive = new Date(profile.lastActiveAt).toDateString();
  
  if (today !== lastActive) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastActive === yesterday.toDateString()) {
      // Consecutive day - increase streak
      profile.stats.currentStreak++;
      if (profile.stats.currentStreak > profile.stats.longestStreak) {
        profile.stats.longestStreak = profile.stats.currentStreak;
      }
    } else {
      // Streak broken
      profile.stats.currentStreak = 1;
    }
    
    profile.stats.daysActive++;
  }
  
  profile.lastActiveAt = new Date();
  saveProfile(profile);
  return profile;
};

// Get mood trends
export const getMoodTrends = (profile: LifeCompanionProfile, days: number = 7): MoodEntry[] => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  return profile.moods.filter(m => new Date(m.timestamp) >= cutoff);
};

// Get active goals
export const getActiveGoals = (profile: LifeCompanionProfile): Goal[] => {
  return profile.goals.filter(g => g.status === 'active');
};

// Get recent insights
export const getRecentInsights = (profile: LifeCompanionProfile, limit: number = 5): Insight[] => {
  return profile.insights
    .filter(i => !i.acknowledged)
    .slice(-limit);
};

// Generate context summary for AI
export const generateContextForAI = (profile: LifeCompanionProfile): string => {
  const recentMoods = getMoodTrends(profile, 3);
  const activeGoals = getActiveGoals(profile);
  const facts = profile.learnedFacts.slice(-10);
  const recentPatterns = profile.patterns.slice(-5);
  
  let context = `
WHAT YOU KNOW ABOUT ${profile.name.toUpperCase()}:
- Days together: ${profile.stats.daysActive}
- Current streak: ${profile.stats.currentStreak} days
- Total conversations: ${profile.totalConversations}

`;

  if (facts.length > 0) {
    context += `KEY FACTS YOU'VE LEARNED:\n`;
    facts.forEach(f => {
      context += `- ${f.fact}\n`;
    });
    context += '\n';
  }

  if (activeGoals.length > 0) {
    context += `THEIR CURRENT GOALS:\n`;
    activeGoals.forEach(g => {
      context += `- ${g.title} (${g.progress}% complete)\n`;
    });
    context += '\n';
  }

  if (recentMoods.length > 0) {
    const moodList = recentMoods.map(m => m.mood).join(', ');
    context += `RECENT MOODS: ${moodList}\n\n`;
  }

  if (recentPatterns.length > 0) {
    context += `PATTERNS YOU'VE NOTICED:\n`;
    recentPatterns.forEach(p => {
      context += `- ${p.pattern}\n`;
    });
  }

  return context;
};

// Delete all data
export const resetAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

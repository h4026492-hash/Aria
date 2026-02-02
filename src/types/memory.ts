// Complete Memory System Types for Life Companion AI

// Conversation Memory
export interface ConversationMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  mood?: string;
  topics?: string[];
}

export interface Conversation {
  id: string;
  date: Date;
  messages: ConversationMessage[];
  summary?: string;
  keyTopics?: string[];
  emotionalState?: string;
}

// Mood Tracking
export interface MoodEntry {
  id: string;
  mood: 'amazing' | 'good' | 'okay' | 'low' | 'stressed' | 'anxious' | 'sad';
  intensity: number; // 1-10
  note?: string;
  timestamp: Date;
}

// Goal & Dream Tracking
export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: 'career' | 'health' | 'relationships' | 'finance' | 'personal' | 'education' | 'spiritual';
  status: 'active' | 'completed' | 'paused';
  progress: number; // 0-100
  milestones: Milestone[];
  createdAt: Date;
  targetDate?: Date;
  completedAt?: Date;
  aiNotes?: string[]; // AI's observations about this goal
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

// Journal System
export interface JournalEntry {
  id: string;
  date: Date;
  content: string;
  mood?: string;
  gratitude?: string[];
  challenges?: string[];
  wins?: string[];
  aiReflection?: string; // AI's reflection on the entry
}

// Pattern Recognition
export interface LifePattern {
  id: string;
  type: 'mood' | 'topic' | 'behavior' | 'growth' | 'challenge';
  pattern: string;
  frequency: number;
  firstObserved: Date;
  lastObserved: Date;
  insights: string[];
  recommendations?: string[];
}

// Personal Insights
export interface Insight {
  id: string;
  type: 'strength' | 'growth_area' | 'pattern' | 'recommendation' | 'celebration';
  title: string;
  description: string;
  basedOn: string[]; // What data led to this insight
  createdAt: Date;
  acknowledged: boolean;
}

// Growth Journey
export interface GrowthJourney {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: JourneyStep[];
  currentStep: number;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
}

export interface JourneyStep {
  id: string;
  title: string;
  description: string;
  task?: string;
  completed: boolean;
  completedAt?: Date;
  userNotes?: string;
  aiEncouragement?: string;
}

// User's Complete Profile with Memory
export interface LifeCompanionProfile {
  // Basic info
  name: string;
  createdAt: Date;
  lastActiveAt: Date;
  
  // Companion settings
  companionId: string;
  companionName: string;
  companionGender: 'male' | 'female';
  voiceEnabled: boolean;
  
  // Memory & History
  conversations: Conversation[];
  totalConversations: number;
  totalMessages: number;
  
  // Tracking
  moods: MoodEntry[];
  goals: Goal[];
  journal: JournalEntry[];
  
  // AI Analysis
  patterns: LifePattern[];
  insights: Insight[];
  journeys: GrowthJourney[];
  
  // Key facts AI has learned
  learnedFacts: LearnedFact[];
  
  // Statistics
  stats: LifeStats;
}

export interface LearnedFact {
  id: string;
  category: 'personal' | 'work' | 'relationship' | 'goal' | 'preference' | 'challenge' | 'strength';
  fact: string;
  source: string; // Which conversation/entry it came from
  learnedAt: Date;
  importance: 'high' | 'medium' | 'low';
}

export interface LifeStats {
  daysActive: number;
  currentStreak: number;
  longestStreak: number;
  goalsCompleted: number;
  journalEntries: number;
  averageMood: number;
  topTopics: string[];
  growthScore: number; // 0-100 based on engagement
}

// Default empty profile
export const createEmptyProfile = (name: string, companionId: string, companionName: string, companionGender: 'male' | 'female'): LifeCompanionProfile => ({
  name,
  createdAt: new Date(),
  lastActiveAt: new Date(),
  companionId,
  companionName,
  companionGender,
  voiceEnabled: true,
  conversations: [],
  totalConversations: 0,
  totalMessages: 0,
  moods: [],
  goals: [],
  journal: [],
  patterns: [],
  insights: [],
  journeys: [],
  learnedFacts: [],
  stats: {
    daysActive: 1,
    currentStreak: 1,
    longestStreak: 1,
    goalsCompleted: 0,
    journalEntries: 0,
    averageMood: 5,
    topTopics: [],
    growthScore: 0,
  },
});

// User profile
export interface UserProfile {
  name: string;
  companionName: string;
  companionGender: 'male' | 'female';
  companionStyle: 'professional' | 'casual' | 'friendly';
  voiceEnabled: boolean;
  apiKey?: string; // For D-ID or other AI video API
  // Local SadTalker server settings (optional)
  sadTalkerEnabled?: boolean;
  sadTalkerUrl?: string;
  sadTalkerApiKey?: string;
  createdAt: Date;
}

// Conversation message
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

// AI Avatar state
export interface AvatarState {
  expression: 'neutral' | 'happy' | 'thinking' | 'talking' | 'surprised' | 'concerned' | 'listening';
  isTalking: boolean;
  isListening: boolean;
}

// Companion character
export interface CompanionCharacter {
  id: string;
  name: string;
  gender: 'male' | 'female';
  style: string;
  description: string;
  images: {
    neutral: string;
    happy: string;
    talking: string;
    thinking: string;
    listening: string;
  };
}

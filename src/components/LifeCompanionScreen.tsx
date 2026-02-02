import { useState, useEffect, useCallback, useRef } from 'react';
import { LifeCompanionProfile, ConversationMessage, MoodEntry } from '@/types/memory';
import { VideoCompanion } from '@/data/videoCompanions';
import { DIDVideoAvatar } from './DIDVideoAvatar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { getMemoryAwareResponse, getMemoryAwareGreeting } from '@/services/smartAIService';
import { addMessage, addMood, getRecentMessages, updateStreak } from '@/services/memoryService';
import { generateTalkingVideo } from '@/services/didService';
import { synthesizeTextToSadTalker } from '@/services/sadTalkerService';
import { sendAudioToSadTalker } from '@/services/sadTalkerService';
import { cn } from '@/utils/cn';

interface LifeCompanionScreenProps {
  profile: LifeCompanionProfile;
  setProfile: (profile: LifeCompanionProfile) => void;
  companion: VideoCompanion;
  onEndCall: () => void;
  onSettings: () => void;
  onDashboard: () => void;
}

const MOODS = [
  { id: 'amazing', emoji: '🤩', label: 'Amazing', color: 'from-yellow-400 to-orange-400' },
  { id: 'good', emoji: '😊', label: 'Good', color: 'from-green-400 to-emerald-400' },
  { id: 'okay', emoji: '😐', label: 'Okay', color: 'from-blue-400 to-cyan-400' },
  { id: 'low', emoji: '😔', label: 'Low', color: 'from-purple-400 to-indigo-400' },
  { id: 'stressed', emoji: '😰', label: 'Stressed', color: 'from-orange-400 to-red-400' },
  { id: 'anxious', emoji: '😟', label: 'Anxious', color: 'from-pink-400 to-rose-400' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: 'from-gray-400 to-slate-400' },
];

export function LifeCompanionScreen({ 
  profile,
  setProfile,
  companion, 
  onEndCall, 
  onSettings,
  onDashboard
}: LifeCompanionScreenProps) {
  const [currentAIText, setCurrentAIText] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayMessages, setTodayMessages] = useState<ConversationMessage[]>([]);
  
  // D-ID Video States
  const [didVideoUrl, setDidVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [didVideoProvider, setDidVideoProvider] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const {
    isListening,
    transcript,
    isSupported: speechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update streak on mount
  useEffect(() => {
    const updated = updateStreak(profile);
    setProfile(updated);
  }, []);

  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Speak using browser voice as fallback
  const speakWithBrowserVoice = (text: string) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = companion.gender === 'female' ? 1.1 : 0.9;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        companion.gender === 'female' 
          ? v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female')
          : v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Google UK English Male')
      );
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Generate D-ID talking video
  const generateVideo = async (text: string) => {
    setIsGeneratingVideo(true);
    try {
      // If user has a local SadTalker server configured, prefer it (automated TTS -> upload)
      if (profile.sadTalkerEnabled && profile.sadTalkerUrl) {
        const res = await synthesizeTextToSadTalker(text, profile.sadTalkerUrl, companion.gender === 'female' ? 'en-US-JennyNeural' : 'en-US-GuyNeural');
        if ('error' in res) {
          console.warn('SadTalker synthesis failed, falling back to D-ID:', res.error);
        } else {
          setDidVideoUrl(res.videoUrl);
          setDidVideoProvider('SadTalker');
          setIsSpeaking(true);
          setIsGeneratingVideo(false);
          // estimate duration
          const words = text.split(' ').length;
          const durationMs = Math.max(3000, (words / 2.5) * 1000);
          setTimeout(() => setIsSpeaking(false), durationMs);
          return;
        }
      }

      // Fallback: Use the companion's poster image for D-ID
      const videoUrl = await generateTalkingVideo(
        companion.poster,
        text,
        companion.gender
      );
      setDidVideoUrl(videoUrl);
      setDidVideoProvider('D-ID');
      setIsSpeaking(true);
      
      // Estimate video duration based on text length (roughly 150 words per minute)
      const words = text.split(' ').length;
      const durationMs = Math.max(3000, (words / 2.5) * 1000);
      
      setTimeout(() => {
        setIsSpeaking(false);
      }, durationMs);
      
    } catch (error) {
      console.error('D-ID video generation error:', error);
      // Fallback to browser voice
      setIsSpeaking(true);
      speakWithBrowserVoice(text);
    }
    setIsGeneratingVideo(false);
  };

    // Upload a WAV file to local SadTalker server and receive MP4
    const handleUploadWav = async (file?: File) => {
      if (!file && fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
        return;
      }

      const f = file as File;
      if (!f) return;
      if (!profile.sadTalkerUrl) {
        alert('Please configure SadTalker server URL in Settings first');
        return;
      }

      setIsGeneratingVideo(true);
      setDidVideoUrl(null);
      try {
        const res = await sendAudioToSadTalker(f, profile.sadTalkerUrl!);
        if ('error' in res) {
          console.error('SadTalker error:', res.error);
          alert('SadTalker error: ' + res.error);
          setIsGeneratingVideo(false);
          return;
        }

        setDidVideoUrl(res.videoUrl);
        setDidVideoProvider('SadTalker');
        setIsSpeaking(true);

        // Estimate duration
        const words = currentAIText.split(' ').length;
        const durationMs = Math.max(3000, (words / 2.5) * 1000);
        setTimeout(() => setIsSpeaking(false), durationMs);
      } catch (err) {
        console.error(err);
        alert('Failed to upload to SadTalker');
      }
      setIsGeneratingVideo(false);
    };

  // Initial greeting with D-ID video
  useEffect(() => {
    if (!hasGreeted) {
      const initGreeting = async () => {
        setIsGeneratingVideo(true);
        setCurrentAIText('Connecting...');
        
        try {
          const welcomeText = await getMemoryAwareGreeting(
            { name: companion.name, gender: companion.gender, personality: companion.personality },
            profile
          );
          
          setCurrentAIText(welcomeText);
          
          // Save AI message to memory
          const aiMessage: ConversationMessage = {
            id: Date.now().toString(),
            text: welcomeText,
            sender: 'ai',
            timestamp: new Date(),
          };
          setTodayMessages([aiMessage]);
          const updated = addMessage(profile, aiMessage);
          setProfile(updated);
          
          // Generate D-ID video
          await generateVideo(welcomeText);
          
        } catch (error) {
          console.error('Greeting error:', error);
          const fallback = `Hey ${profile.name}! So great to see you! How are you today?`;
          setCurrentAIText(fallback);
          setIsGeneratingVideo(false);
        }
        
        setHasGreeted(true);
      };
      
      const timer = setTimeout(initGreeting, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasGreeted, profile, companion]);

  // Handle voice transcript completion
  useEffect(() => {
    if (!isListening && transcript) {
      handleUserMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [todayMessages]);

  const handleUserMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setIsSpeaking(false);
    
    // Save user message
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
    };
    setTodayMessages(prev => [...prev, userMessage]);
    let updatedProfile = addMessage(profile, userMessage);
    
    // AI is thinking
    setCurrentAIText('Thinking...');
    
    try {
      // Get recent messages for context
      const recentMessages = getRecentMessages(updatedProfile, 20);
      
      // Get AI response with memory
      const response = await getMemoryAwareResponse(
        text,
        { name: companion.name, gender: companion.gender, personality: companion.personality },
        updatedProfile,
        recentMessages
      );
      
      // Save AI message
      const aiMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date(),
      };
      setTodayMessages(prev => [...prev, aiMessage]);
      updatedProfile = addMessage(updatedProfile, aiMessage);
      setProfile(updatedProfile);
      
      setCurrentAIText(response);
      
      // Generate D-ID talking video
      await generateVideo(response);
      
    } catch (error) {
      console.error('AI response error:', error);
      const fallback = "Sorry, I had a small connection issue. Can you say that again?";
      setCurrentAIText(fallback);
      setIsGeneratingVideo(false);
    }
    
    setIsProcessing(false);
  }, [profile, companion, isProcessing, setProfile]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleUserMessage(textInput);
      setTextInput('');
    }
  };

  const toggleMicrophone = () => {
    if (isListening) {
      stopListening();
    } else {
      setIsSpeaking(false);
      startListening();
    }
  };

  const handleMoodSelect = async (moodId: string) => {
    const mood = MOODS.find(m => m.id === moodId);
    if (!mood) return;

    const moodEntry: MoodEntry = {
      id: Date.now().toString(),
      mood: moodId as MoodEntry['mood'],
      intensity: 5,
      timestamp: new Date(),
    };

    const updated = addMood(profile, moodEntry);
    setProfile(updated);
    setShowMoodPicker(false);

    // AI responds to mood
    const moodMessage = `I'm feeling ${mood.label.toLowerCase()} right now.`;
    handleUserMessage(moodMessage);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex flex-col overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
            <img 
              src={companion.poster}
              alt={companion.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">{companion.name}</h2>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isListening ? "bg-green-400" : isSpeaking ? "bg-purple-400" : "bg-green-400"
              )} />
              <span className="text-white/70 text-sm">{formatDuration(callDuration)}</span>
              <span className="text-xs bg-green-500/30 text-green-300 px-2 py-0.5 rounded-full">
                🎬 D-ID Active
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Dashboard button */}
          <button
            onClick={onDashboard}
            className="p-3 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30 hover:border-purple-400 transition-all"
            title="Dashboard"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={cn(
              "p-3 rounded-full transition-all backdrop-blur-sm",
              showSubtitles ? "bg-white/20 text-white" : "bg-white/10 text-white/50"
            )}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={cn(
              "p-3 rounded-full transition-all backdrop-blur-sm",
              showChat ? "bg-white/20 text-white" : "bg-white/10 text-white/50"
            )}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button
            onClick={onSettings}
            className="p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="absolute top-20 left-0 right-0 z-10 px-4">
        <div className="max-w-md mx-auto flex items-center justify-center gap-4 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
          <div className="text-center">
            <p className="text-white/50 text-xs">Streak</p>
            <p className="text-white font-bold">🔥 {profile.stats.currentStreak}</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <p className="text-white/50 text-xs">Conversations</p>
            <p className="text-white font-bold">{profile.totalConversations}</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <p className="text-white/50 text-xs">Goals</p>
            <p className="text-white font-bold">{profile.goals.filter(g => g.status === 'active').length}</p>
          </div>
        </div>
      </div>

      {/* Main Video Area with D-ID Avatar */}
      <div className="flex-1 flex items-center justify-center relative pt-28 pb-48 px-4">
        <DIDVideoAvatar
          companion={companion}
          isSpeaking={isSpeaking}
          isListening={isListening}
          videoUrl={didVideoUrl}
          vendor={didVideoProvider || undefined}
          isGenerating={isGeneratingVideo}
          currentText={currentAIText}
        />

        {/* Subtitles */}
        {showSubtitles && currentAIText && (
          <div className="absolute bottom-52 left-4 right-4 z-20 pointer-events-none">
            <div className="max-w-2xl mx-auto bg-black/80 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10">
              <p className="text-white text-center text-lg leading-relaxed">
                {currentAIText}
              </p>
            </div>
          </div>
        )}

        {/* User transcript */}
        {isListening && transcript && (
          <div className="absolute bottom-68 left-4 right-4 z-20 pointer-events-none">
            <div className="max-w-xl mx-auto bg-green-500/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-green-400/30">
              <p className="text-white text-center italic">"{transcript}"</p>
            </div>
          </div>
        )}
      </div>

      {/* Mood Picker Modal */}
      {showMoodPicker && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 rounded-3xl p-6 max-w-sm w-full border border-white/10 animate-fadeIn">
            <h3 className="text-white text-xl font-bold text-center mb-4">How are you feeling?</h3>
            <div className="grid grid-cols-4 gap-3">
              {MOODS.map(mood => (
                <button
                  key={mood.id}
                  onClick={() => handleMoodSelect(mood.id)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-2xl border-2 border-transparent",
                    "bg-gradient-to-br hover:scale-105 transition-all",
                    mood.color,
                    "bg-opacity-20 hover:border-white/30"
                  )}
                >
                  <span className="text-2xl mb-1">{mood.emoji}</span>
                  <span className="text-white text-xs">{mood.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMoodPicker(false)}
              className="w-full mt-4 py-3 bg-white/10 text-white/70 rounded-xl hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="absolute right-0 top-0 bottom-0 w-80 md:w-96 bg-black/90 backdrop-blur-xl border-l border-white/10 flex flex-col z-30 animate-slideIn">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Chat with {companion.name}</h3>
              <p className="text-white/50 text-xs">{profile.totalMessages} messages total</p>
            </div>
            <button onClick={() => setShowChat(false)} className="text-white/50 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {todayMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                  msg.sender === 'user'
                    ? "bg-purple-600 text-white ml-auto"
                    : "bg-white/10 text-white"
                )}
              >
                {msg.text}
              </div>
            ))}
            {isProcessing && (
              <div className="bg-white/10 rounded-2xl px-4 py-3 text-sm text-white/70 max-w-[85%]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>{companion.name} is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleTextSubmit} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type a message..."
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isProcessing || !textInput.trim()}
                className="px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors font-medium disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
        <div className="flex items-center justify-center gap-4 max-w-lg mx-auto">
          {/* Mood button */}
          <button
            onClick={() => setShowMoodPicker(true)}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-white hover:border-pink-400 transition-all"
            title="Log mood"
          >
            <span className="text-xl">😊</span>
          </button>

          {/* Chat toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-sm",
              showChat ? "bg-purple-600 text-white" : "bg-white/10 text-white/80 hover:bg-white/20"
            )}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Microphone */}
          {speechRecognitionSupported ? (
            <button
              onClick={toggleMicrophone}
              disabled={isProcessing || isGeneratingVideo}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105",
                isListening
                  ? "bg-green-500 text-white shadow-xl shadow-green-500/50 animate-pulse"
                  : isProcessing || isGeneratingVideo
                    ? "bg-yellow-500 text-white"
                    : "bg-white text-slate-900 hover:bg-gray-100 shadow-xl"
              )}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs text-center px-2">
              <span>Mic not supported</span>
            </div>
          )}

          {/* Video Status */}
          <button
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-sm",
              isGeneratingVideo ? "bg-yellow-500 text-white animate-pulse" : "bg-white/10 text-white/50"
            )}
            disabled
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* SadTalker upload (manual) */}
          {profile.sadTalkerEnabled && (
            <>
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" title="Upload WAV for SadTalker" aria-label="Upload WAV for SadTalker" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadWav(file);
              }} />

              <button
                onClick={() => handleUploadWav()}
                className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-all"
                title="Upload WAV and generate local video"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l-4-4m4 4l4-4M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6" />
                </svg>
              </button>
            </>
          )}

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-all transform hover:scale-105 shadow-lg shadow-red-500/30"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>

        {/* Status text */}
        <p className="text-center text-white/60 text-sm mt-4">
          {isListening ? (
            <span className="text-green-400 font-medium">🎤 Listening... Speak now!</span>
          ) : isGeneratingVideo ? (
            <span className="text-yellow-400 animate-pulse">🎬 Creating video... (10-20 seconds)</span>
          ) : isProcessing ? (
            <span className="text-yellow-400 animate-pulse">🧠 {companion.name} is thinking...</span>
          ) : isSpeaking ? (
            <span className="text-purple-400">🎥 {companion.name} is speaking...</span>
          ) : (
            `Tap the microphone to talk with ${companion.name}`
          )}
        </p>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, Message, CompanionCharacter } from '@/types';
import { RealisticAvatar } from './RealisticAvatar';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { generateAIResponse, getWelcomeMessage } from '@/utils/aiResponses';
import { cn } from '@/utils/cn';

interface VideoCallScreenProps {
  profile: UserProfile;
  companion: CompanionCharacter;
  onEndCall: () => void;
  onSettings: () => void;
}

export function VideoCallScreen({ profile, companion, onEndCall, onSettings }: VideoCallScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAIText, setCurrentAIText] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [expression, setExpression] = useState<'neutral' | 'happy' | 'thinking' | 'talking' | 'listening'>('neutral');
  const [callDuration, setCallDuration] = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);
  
  const {
    isListening,
    transcript,
    isSupported: speechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();
  
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: speechSynthesisSupported,
  } = useSpeechSynthesis();

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Initial greeting
  useEffect(() => {
    if (!hasGreeted && profile.voiceEnabled) {
      const timer = setTimeout(() => {
        const welcomeText = getWelcomeMessage({
          userName: profile.name,
          companionName: companion.name,
          companionGender: companion.gender,
        });
        
        setCurrentAIText(welcomeText);
        setExpression('happy');
        
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: welcomeText,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages([aiMessage]);
        
        speak(welcomeText, companion.gender, () => {
          setExpression('neutral');
        });
        
        setHasGreeted(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [hasGreeted, profile, companion, speak]);

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
  }, [messages]);

  // Update expression when listening
  useEffect(() => {
    if (isListening) {
      setExpression('listening');
    }
  }, [isListening]);

  const handleUserMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    // Stop any current speech
    stopSpeaking();
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // AI is thinking
    setExpression('thinking');
    setCurrentAIText('Hmm, let me think...');
    
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
    
    // Generate response
    const response = generateAIResponse(text, {
      userName: profile.name,
      companionName: companion.name,
      companionGender: companion.gender,
    });
    
    // Add AI message
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: response,
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMessage]);
    
    setCurrentAIText(response);
    setExpression('talking');
    
    // Speak the response
    if (profile.voiceEnabled) {
      speak(response, companion.gender, () => {
        setExpression('neutral');
      });
    } else {
      setTimeout(() => setExpression('neutral'), 3000);
    }
  }, [profile, companion, speak, stopSpeaking]);

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
      stopSpeaking();
      startListening();
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex flex-col overflow-hidden">
      {/* Video call background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent" />

      {/* Top Bar - FaceTime style */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
            <img 
              src={companion.images.neutral}
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
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={cn(
              "p-3 rounded-full transition-all backdrop-blur-sm",
              showSubtitles ? "bg-white/20 text-white" : "bg-white/10 text-white/50"
            )}
            title="Toggle subtitles"
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
            title="Toggle chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button
            onClick={onSettings}
            className="p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all backdrop-blur-sm"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex items-center justify-center relative pt-20 pb-40">
        <RealisticAvatar
          companion={companion}
          isTalking={isSpeaking}
          isListening={isListening}
          expression={expression}
        />

        {/* Subtitles */}
        {showSubtitles && currentAIText && (
          <div className="absolute bottom-44 left-4 right-4 z-20 pointer-events-none">
            <div className="max-w-2xl mx-auto bg-black/70 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10">
              <p className="text-white text-center text-lg leading-relaxed">
                {currentAIText}
              </p>
            </div>
          </div>
        )}

        {/* User transcript while speaking */}
        {isListening && transcript && (
          <div className="absolute bottom-60 left-4 right-4 z-20 pointer-events-none">
            <div className="max-w-xl mx-auto bg-green-500/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-green-400/30">
              <p className="text-white text-center italic">"{transcript}"</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="absolute right-0 top-0 bottom-0 w-80 md:w-96 bg-black/90 backdrop-blur-xl border-l border-white/10 flex flex-col z-30 animate-slideIn">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold">Chat</h3>
            <button onClick={() => setShowChat(false)} className="text-white/50 hover:text-white">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
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
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleTextSubmit} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors font-medium"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Controls - FaceTime style */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
        <div className="flex items-center justify-center gap-5 max-w-md mx-auto">
          {/* Chat toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-sm",
              showChat
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            )}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Microphone - Main button */}
          {speechRecognitionSupported ? (
            <button
              onClick={toggleMicrophone}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105",
                isListening
                  ? "bg-green-500 text-white shadow-xl shadow-green-500/50 animate-pulse"
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

          {/* Mute/Stop Speaking */}
          <button
            onClick={() => isSpeaking && stopSpeaking()}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-sm",
              isSpeaking
                ? "bg-yellow-500 text-white"
                : "bg-white/10 text-white/50"
            )}
            disabled={!isSpeaking}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </button>

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
          ) : isSpeaking ? (
            <span className="text-purple-400">{companion.name} is speaking...</span>
          ) : speechRecognitionSupported ? (
            `Tap the microphone to talk with ${companion.name}`
          ) : (
            `Use the chat to talk with ${companion.name}`
          )}
        </p>

        {!speechSynthesisSupported && (
          <p className="text-center text-yellow-400/70 text-xs mt-2">
            Voice output not supported in this browser
          </p>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

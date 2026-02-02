import { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, Message, CompanionCharacter } from '@/types';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { generateAIResponse, getWelcomeMessage } from '@/utils/aiResponses';
import { createTalkingVideo, getAvailableVoices } from '@/services/didApi';
import { sendAudioToSadTalker } from '@/services/sadTalkerService';
import { cn } from '@/utils/cn';

interface RealVideoCallScreenProps {
  profile: UserProfile;
  companion: CompanionCharacter;
  apiKey: string;
  onEndCall: () => void;
  onSettings: () => void;
}

export function RealVideoCallScreen({ 
  profile, 
  companion, 
  apiKey,
  onEndCall, 
  onSettings 
}: RealVideoCallScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAIText, setCurrentAIText] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);
  
  // Video states
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoProvider, setVideoProvider] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    isListening,
    transcript,
    isSupported: speechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Get voice based on gender
  const voices = getAvailableVoices();
  const voiceId = companion.gender === 'female' 
    ? voices.female[0].id 
    : voices.male[0].id;

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

  // Generate talking video
  const generateVideo = useCallback(async (text: string) => {
    if (!apiKey) {
      console.log('No API key, skipping video generation');
      setCurrentAIText(text);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setCurrentAIText(text);
    setVideoUrl(null); // Clear previous video
    
    try {
      console.log('Generating D-ID video for:', text.substring(0, 50) + '...');
      console.log('Using image:', companion.images.neutral);
      console.log('Using voice:', voiceId);
      
      const result = await createTalkingVideo(
        apiKey,
        companion.images.neutral,
        text,
        voiceId
      );
      
      if ('error' in result) {
        console.error('D-ID Error:', result.error);
        setError(result.error);
        setIsGenerating(false);
        return;
      }
      
      console.log('Video generated successfully:', result.videoUrl);
      setVideoUrl(result.videoUrl);
      setVideoProvider('D-ID');
      setIsGenerating(false);
      
    } catch (err) {
      console.error('Video generation error:', err);
      setError('Failed to generate video. Please try again.');
      setIsGenerating(false);
    }
  }, [apiKey, companion.images.neutral, voiceId]);

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

    setIsGenerating(true);
    setVideoUrl(null);
    try {
      const res = await sendAudioToSadTalker(f, profile.sadTalkerUrl!);
      if ('error' in res) {
        console.error('SadTalker error:', res.error);
        alert('SadTalker error: ' + res.error);
        setIsGenerating(false);
        return;
      }

      setVideoUrl(res.videoUrl);
      setVideoProvider('SadTalker');
    } catch (err) {
      console.error(err);
      alert('Failed to upload to SadTalker');
    }
    setIsGenerating(false);
  };

  // Play video when URL is set
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Video play error:', err));
    }
  }, [videoUrl]);

  // Initial greeting
  useEffect(() => {
    if (!hasGreeted) {
      const timer = setTimeout(() => {
        const welcomeText = getWelcomeMessage({
          userName: profile.name,
          companionName: companion.name,
          companionGender: companion.gender,
        });
        
        const aiMessage: Message = {
          id: Date.now().toString(),
          text: welcomeText,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages([aiMessage]);
        
        generateVideo(welcomeText);
        setHasGreeted(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasGreeted, profile, companion, generateVideo]);

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

  const handleUserMessage = useCallback(async (text: string) => {
    if (!text.trim() || isGenerating) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
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
    
    // Generate video
    generateVideo(response);
    
  }, [profile, companion, generateVideo, isGenerating]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isGenerating) {
      handleUserMessage(textInput);
      setTextInput('');
    }
  };

  const toggleMicrophone = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
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
              src={companion.images.neutral}
              alt={companion.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">{companion.name}</h2>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isGenerating ? "bg-yellow-400 animate-pulse" : 
                isPlaying ? "bg-purple-400 animate-pulse" : 
                isListening ? "bg-green-400 animate-pulse" : "bg-green-400"
              )} />
              <span className="text-white/70 text-sm">{formatDuration(callDuration)}</span>
              {isGenerating && (
                <span className="text-yellow-400 text-xs ml-2">Generating video...</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {profile.sadTalkerEnabled && (
            <>
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" title="Upload WAV for SadTalker" aria-label="Upload WAV for SadTalker" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadWav(file);
              }} />
              <button
                onClick={() => handleUploadWav()}
                className="p-3 rounded-full transition-all bg-indigo-600 text-white hover:bg-indigo-500"
                title="Upload WAV and generate local video"
                aria-label="Upload WAV and generate local video"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l-4-4m4 4l4-4M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6" />
                </svg>
              </button>
            </>
          )}
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

      {/* Main Video Area */}
      <div className="flex-1 flex items-center justify-center relative pt-20 pb-40">
        {/* Video Frame */}
        <div className={cn(
          "relative rounded-3xl overflow-hidden shadow-2xl border-4 transition-all duration-300",
          isPlaying 
            ? "border-purple-500 shadow-purple-500/50" 
            : isListening 
              ? "border-green-500 shadow-green-500/30"
              : "border-white/20"
        )}>
          {/* Video or Image */}
          <div className="relative w-72 h-96 md:w-80 md:h-[28rem] lg:w-96 lg:h-[32rem] bg-black">
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover",
                  isPlaying ? "opacity-100" : "opacity-0"
                )}
                onEnded={handleVideoEnd}
                playsInline
              />
            )}
            
            {/* Fallback image when not playing video */}
            <img
              src={companion.images.neutral}
              alt={companion.name}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                isPlaying ? "opacity-0" : "opacity-100"
              )}
            />

            {/* Loading overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                <p className="text-white text-sm">Creating video...</p>
                <p className="text-white/50 text-xs mt-1">This may take 10-20 seconds</p>
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-4xl mb-4">⚠️</span>
                <p className="text-white font-medium mb-2">Video generation failed</p>
                <p className="text-white/60 text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Listening indicator */}
            {isListening && !isGenerating && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-green-500/80 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">Listening...</span>
              </div>
            )}

            {/* Status indicator */}
            <div className={cn(
              "absolute top-4 right-4 w-4 h-4 rounded-full border-2 border-white shadow-lg",
              isGenerating ? "bg-yellow-500 animate-pulse" :
              isPlaying ? "bg-purple-500 animate-pulse" : "bg-green-400"
            )} />
          </div>
        </div>

        {/* Companion name badge */}
        <div className="absolute bottom-44 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-black/60 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20">
            <p className="text-white font-medium">{companion.name}</p>
          </div>
        </div>

        {/* Subtitles */}
        {showSubtitles && currentAIText && (
          <div className="absolute bottom-52 left-4 right-4 z-20 pointer-events-none">
            <div className="max-w-2xl mx-auto bg-black/70 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10">
              <p className="text-white text-center text-lg leading-relaxed">
                {currentAIText}
              </p>
            </div>
          </div>
        )}

        {/* User transcript */}
        {isListening && transcript && (
          <div className="absolute bottom-64 left-4 right-4 z-20 pointer-events-none">
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
            <button onClick={() => setShowChat(false)} className="text-white/50 hover:text-white">✕</button>
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
                disabled={isGenerating}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isGenerating}
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
        <div className="flex items-center justify-center gap-5 max-w-md mx-auto">
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
              disabled={isGenerating}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105",
                isListening
                  ? "bg-green-500 text-white shadow-xl shadow-green-500/50 animate-pulse"
                  : isGenerating
                    ? "bg-gray-500 text-white/50"
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
          {isGenerating ? (
            <span className="text-yellow-400">🎬 Creating video response...</span>
          ) : isListening ? (
            <span className="text-green-400 font-medium">🎤 Listening... Speak now!</span>
          ) : isPlaying ? (
            <span className="text-purple-400">{companion.name} is speaking...</span>
          ) : (
            `Tap the microphone to talk with ${companion.name}`
          )}
        </p>
      </div>

      {/* CSS */}
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

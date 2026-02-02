import React, { useState, useEffect, useRef } from 'react';
import { VideoCompanion } from '../data/videoCompanions';

interface DIDVideoAvatarProps {
  companion: VideoCompanion;
  isSpeaking: boolean;
  isListening: boolean;
  videoUrl: string | null;
  isGenerating: boolean;
  currentText?: string;
  vendor?: string; // e.g. 'D-ID' or 'SadTalker'
}

export const DIDVideoAvatar: React.FC<DIDVideoAvatarProps> = ({
  companion,
  isSpeaking,
  isListening,
  videoUrl,
  isGenerating,
  currentText = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fallback images that ALWAYS work
  const fallbackImages: Record<string, string> = {
    female: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=800',
    male: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800',
  };

  const displayImage = imageError ? fallbackImages[companion.gender] : companion.poster;

  // When new video URL comes in, play it
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      setShowVideo(true);
      videoRef.current.src = videoUrl;
      videoRef.current.load();
      videoRef.current.play().catch(err => {
        console.error('Video play error:', err);
        setShowVideo(false);
        // Fallback to browser speech
        speakWithBrowserVoice(currentText);
      });
    }
  }, [videoUrl]);

  // Speak using browser voice as fallback
  const speakWithBrowserVoice = (text: string) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = companion.gender === 'female' ? 1.1 : 0.9;
      
      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        companion.gender === 'female' 
          ? v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female')
          : v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Google UK English Male')
      );
      if (preferredVoice) utterance.voice = preferredVoice;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // When video ends, go back to idle image
  const handleVideoEnd = () => {
    setShowVideo(false);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center px-4">
      {/* Background Glow Effect */}
      <div 
        className={`absolute w-80 h-[28rem] md:w-96 md:h-[32rem] rounded-3xl transition-all duration-700 blur-3xl ${
          isSpeaking || showVideo
            ? 'bg-gradient-to-r from-purple-600/50 via-pink-500/50 to-purple-600/50 scale-110' 
            : isListening
            ? 'bg-gradient-to-r from-green-500/50 via-cyan-500/50 to-green-500/50 scale-110 animate-pulse'
            : isGenerating
            ? 'bg-gradient-to-r from-yellow-500/50 via-orange-500/50 to-yellow-500/50 animate-pulse'
            : 'bg-gradient-to-b from-purple-900/40 to-pink-900/40'
        }`}
      />

      {/* Main Avatar Container */}
      <div className={`relative w-72 h-96 md:w-80 md:h-[28rem] lg:w-96 lg:h-[32rem] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${
        isSpeaking || showVideo
          ? 'border-4 border-purple-500 shadow-purple-500/60 ring-4 ring-purple-500/30 scale-[1.02]' 
          : isListening
          ? 'border-4 border-green-500 shadow-green-500/60 ring-4 ring-green-500/30 scale-[1.02]'
          : isGenerating
          ? 'border-4 border-yellow-500 shadow-yellow-500/60 animate-pulse'
          : 'border-4 border-white/40 shadow-black/40'
      }`}>
        
        {/* Loading placeholder */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Main Image - ALWAYS VISIBLE */}
        <img
          src={displayImage}
          alt={companion.name}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
            showVideo ? 'opacity-0' : 'opacity-100'
          } ${imageLoaded ? 'visible' : 'invisible'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            console.log('Image failed, using fallback');
            setImageError(true);
            setImageLoaded(true);
          }}
        />

        {/* D-ID Generated Video (plays when ready) */}
        {videoUrl && (
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              showVideo ? 'opacity-100' : 'opacity-0'
            }`}
            playsInline
            onEnded={handleVideoEnd}
            onError={() => {
              console.error('Video playback error');
              setShowVideo(false);
            }}
          />
        )}

        {/* Generating Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-20">
            <div className="text-center px-6">
              <div className="relative mb-4">
                <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full" />
                <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-white text-lg font-semibold mb-2">Creating video...</p>
              <p className="text-gray-400 text-sm">D-ID is generating lip-sync</p>
              <p className="text-gray-500 text-xs mt-1">This takes 10-20 seconds</p>
            </div>
          </div>
        )}

        {/* Status Badge - Top Left */}
        <div className="absolute top-4 left-4 z-30">
          {isListening ? (
            <div className="flex items-center gap-2 bg-green-500 px-4 py-2 rounded-full shadow-lg shadow-green-500/50">
              <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              <span className="text-white text-sm font-semibold">Listening...</span>
            </div>
          ) : isSpeaking || showVideo ? (
            <div className="flex items-center gap-2 bg-purple-500 px-4 py-2 rounded-full shadow-lg shadow-purple-500/50">
              <div className="flex gap-0.5 items-end h-4">
                <div className="w-1 bg-white rounded animate-bounce" style={{ height: '8px', animationDelay: '0ms', animationDuration: '0.6s' }} />
                <div className="w-1 bg-white rounded animate-bounce" style={{ height: '14px', animationDelay: '100ms', animationDuration: '0.6s' }} />
                <div className="w-1 bg-white rounded animate-bounce" style={{ height: '10px', animationDelay: '200ms', animationDuration: '0.6s' }} />
                <div className="w-1 bg-white rounded animate-bounce" style={{ height: '16px', animationDelay: '300ms', animationDuration: '0.6s' }} />
              </div>
              <span className="text-white text-sm font-semibold">Speaking</span>
            </div>
          ) : isGenerating ? (
            <div className="flex items-center gap-2 bg-yellow-500 px-4 py-2 rounded-full shadow-lg shadow-yellow-500/50">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-sm font-semibold">Processing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-green-500/90 px-4 py-2 rounded-full shadow-lg">
              <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              <span className="text-white text-sm font-semibold">LIVE</span>
            </div>
          )}
        </div>

        {/* Provider Badge - Top Right */}
        <div className="absolute top-4 right-4 z-30">
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-purple-500/50">
            <span className="text-purple-400 text-xs font-bold">{vendor || 'D-ID'}</span>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Name Card - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
          <h3 className="text-white font-bold text-xl">{companion.name}</h3>
          <p className="text-gray-300 text-sm">{companion.style}</p>
        </div>

        {/* Speaking Ring Effect */}
        {(isSpeaking || showVideo) && (
          <>
            <div className="absolute inset-0 border-4 border-purple-400/50 rounded-3xl animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-[-8px] border-2 border-purple-500/30 rounded-[28px]" />
          </>
        )}

        {/* Listening Ring Effect */}
        {isListening && (
          <>
            <div className="absolute inset-0 border-4 border-green-400/50 rounded-3xl animate-ping" style={{ animationDuration: '1s' }} />
            <div className="absolute inset-[-8px] border-2 border-green-500/30 rounded-[28px]" />
          </>
        )}

        {/* Audio Waveform Animation */}
        {(isSpeaking || showVideo) && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-end gap-1 z-20">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="w-2 bg-white/90 rounded-full"
                style={{
                  height: `${10 + Math.random() * 20}px`,
                  animation: `wave 0.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* CSS for wave animation */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

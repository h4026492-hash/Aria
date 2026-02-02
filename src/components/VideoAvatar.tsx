import { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { VideoCompanion } from '@/data/videoCompanions';

interface VideoAvatarProps {
  companion: VideoCompanion;
  state: 'idle' | 'talking' | 'listening' | 'thinking';
  isSpeaking: boolean;
}

export function VideoAvatar({ companion, state, isSpeaking }: VideoAvatarProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get video URL based on state
  const getVideoUrl = () => {
    if (isSpeaking || state === 'talking') {
      return companion.videos.talking;
    }
    return companion.videos.idle;
  };

  // Handle video playback
  useEffect(() => {
    if (videoRef.current && isLoaded) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked
        console.log('Autoplay blocked');
      });
    }
  }, [isLoaded, state, isSpeaking]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background glow effect */}
      <div className={cn(
        "absolute w-80 h-80 md:w-96 md:h-96 rounded-full blur-3xl transition-all duration-700 -z-10",
        state === 'listening' 
          ? "bg-green-500/40 scale-110" 
          : isSpeaking || state === 'talking'
            ? "bg-purple-500/50 scale-105" 
            : "bg-blue-500/30"
      )} />

      {/* Main avatar container */}
      <div className={cn(
        "relative rounded-3xl overflow-hidden shadow-2xl border-4 transition-all duration-300",
        state === 'listening' 
          ? "border-green-500 shadow-green-500/30" 
          : isSpeaking || state === 'talking'
            ? "border-purple-500 shadow-purple-500/50" 
            : "border-white/30 shadow-black/50"
      )}>
        {/* Video Container */}
        <div className="relative w-72 h-96 md:w-80 md:h-[28rem] lg:w-[22rem] lg:h-[32rem] bg-gray-900 overflow-hidden">
          
          {/* Real Video Element */}
          {!videoError ? (
            <video
              ref={videoRef}
              src={getVideoUrl()}
              poster={companion.poster}
              className={cn(
                "w-full h-full object-cover transition-all duration-500",
                isLoaded ? "opacity-100" : "opacity-0"
              )}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => setIsLoaded(true)}
              onError={() => {
                console.log('Video failed to load, using fallback');
                setVideoError(true);
              }}
            />
          ) : (
            // Fallback to poster image if video fails
            <img
              src={companion.poster}
              alt={companion.name}
              className={cn(
                "w-full h-full object-cover transition-all duration-500",
                isLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setIsLoaded(true)}
            />
          )}

          {/* Loading spinner */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/70 text-sm">Loading video...</p>
              </div>
            </div>
          )}

          {/* Speaking waveform overlay */}
          {(isSpeaking || state === 'talking') && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-1 z-10">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-white rounded-full shadow-lg animate-waveform"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Listening indicator */}
          {state === 'listening' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-green-500/90 backdrop-blur-sm px-4 py-2 rounded-full z-10 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">Listening...</span>
            </div>
          )}

          {/* Thinking indicator */}
          {state === 'thinking' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-yellow-500/90 backdrop-blur-sm px-4 py-2 rounded-full z-10 shadow-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-white text-sm font-medium">Thinking...</span>
            </div>
          )}

          {/* Live indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full z-10">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              state === 'listening' ? "bg-green-500" :
              isSpeaking || state === 'talking' ? "bg-purple-500" : "bg-green-500"
            )} />
            <span className="text-white text-xs font-medium">LIVE</span>
          </div>

          {/* Video indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/80 backdrop-blur-sm px-2 py-1 rounded z-10">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-bold">REC</span>
          </div>

          {/* Pulse ring animation when speaking */}
          {(isSpeaking || state === 'talking') && (
            <>
              <div className="absolute inset-0 rounded-3xl border-2 border-purple-500/50 animate-ping-slow" />
              <div className="absolute inset-2 rounded-3xl border border-purple-400/30 animate-ping-slower" />
            </>
          )}
        </div>
      </div>

      {/* Name badge */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-black/70 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 shadow-xl">
          <p className="text-white font-semibold text-sm">{companion.name}</p>
        </div>
      </div>

      {/* Floating particles when speaking */}
      {(isSpeaking || state === 'talking') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-purple-400/40 rounded-full animate-float-up"
              style={{
                left: `${20 + Math.random() * 60}%`,
                bottom: '20%',
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes waveform {
          0%, 100% { height: 8px; }
          50% { height: 24px; }
        }
        
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.05); opacity: 0; }
        }
        
        @keyframes ping-slower {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(1.08); opacity: 0; }
        }
        
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 0.6; }
          100% { transform: translateY(-100px) scale(0); opacity: 0; }
        }
        
        .animate-waveform {
          animation: waveform 0.3s ease-in-out infinite;
        }
        
        .animate-ping-slow {
          animation: ping-slow 1.5s ease-out infinite;
        }
        
        .animate-ping-slower {
          animation: ping-slower 2s ease-out infinite;
        }
        
        .animate-float-up {
          animation: float-up 2s ease-out infinite;
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { CompanionCharacter } from '@/types';

interface RealisticAvatarProps {
  companion: CompanionCharacter;
  isTalking: boolean;
  isListening: boolean;
  expression: 'neutral' | 'happy' | 'thinking' | 'talking' | 'listening';
}

export function RealisticAvatar({ 
  companion, 
  isTalking, 
  isListening,
  expression 
}: RealisticAvatarProps) {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [breathingScale, setBreathingScale] = useState(1);

  // Simulate mouth movement when talking
  useEffect(() => {
    if (isTalking) {
      const interval = setInterval(() => {
        setMouthOpen(prev => !prev);
      }, 100 + Math.random() * 100);
      return () => clearInterval(interval);
    } else {
      setMouthOpen(false);
    }
  }, [isTalking]);

  // Subtle breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathingScale(prev => prev === 1 ? 1.01 : 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Get current image based on expression
  const getCurrentImage = () => {
    if (isListening) return companion.images.listening;
    if (isTalking) return companion.images.talking;
    switch (expression) {
      case 'happy': return companion.images.happy;
      case 'thinking': return companion.images.thinking;
      default: return companion.images.neutral;
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-full blur-3xl transition-all duration-700",
        isListening 
          ? "bg-green-500/30 scale-110" 
          : isTalking 
            ? "bg-purple-500/40 scale-105 animate-pulse" 
            : "bg-blue-500/20"
      )} />

      {/* Main avatar container */}
      <div 
        className={cn(
          "relative z-10 transition-transform duration-1000 ease-in-out"
        )}
        style={{ transform: `scale(${breathingScale})` }}
      >
        {/* Video call frame - like FaceTime */}
        <div className={cn(
          "relative rounded-3xl overflow-hidden shadow-2xl",
          "border-4 transition-all duration-300",
          isListening 
            ? "border-green-500 shadow-green-500/30" 
            : isTalking 
              ? "border-purple-500 shadow-purple-500/50" 
              : "border-white/20"
        )}>
          {/* Avatar Image */}
          <div className="relative w-72 h-96 md:w-80 md:h-[28rem] lg:w-96 lg:h-[32rem]">
            <img
              src={getCurrentImage()}
              alt={companion.name}
              className={cn(
                "w-full h-full object-cover transition-all duration-300",
                isTalking && "brightness-105"
              )}
            />

            {/* Talking mouth overlay effect */}
            {isTalking && (
              <div className={cn(
                "absolute inset-0 transition-opacity duration-100",
                mouthOpen ? "opacity-5" : "opacity-0"
              )}>
                <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-16 h-8 bg-black/30 rounded-full blur-sm" />
              </div>
            )}

            {/* Speaking wave animation at bottom */}
            {isTalking && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="w-1 bg-white rounded-full animate-bounce"
                    style={{
                      height: `${8 + Math.random() * 16}px`,
                      animationDelay: `${i * 0.05}s`,
                      animationDuration: '0.3s',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Listening indicator */}
            {isListening && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-green-500/80 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">Listening...</span>
              </div>
            )}

            {/* Status indicator dot */}
            <div className={cn(
              "absolute top-4 right-4 w-4 h-4 rounded-full border-2 border-white shadow-lg",
              isListening ? "bg-green-500 animate-pulse" : "bg-green-400"
            )} />
          </div>
        </div>

        {/* Name badge */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20">
          <p className="text-white font-medium text-sm">{companion.name}</p>
        </div>
      </div>

      {/* Ambient particles when talking */}
      {isTalking && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-purple-400/50 rounded-full animate-ping"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

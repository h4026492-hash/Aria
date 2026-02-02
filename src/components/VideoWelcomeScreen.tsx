import { useState } from 'react';
import { cn } from '@/utils/cn';
import { videoCompanions, getVideoCompanionsByGender, VideoCompanion } from '@/data/videoCompanions';

interface VideoWelcomeScreenProps {
  onComplete: (name: string, companion: VideoCompanion) => void;
}

export function VideoWelcomeScreen({ onComplete }: VideoWelcomeScreenProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('female');
  const [selectedCompanion, setSelectedCompanion] = useState<VideoCompanion | null>(null);

  const filteredCompanions = getVideoCompanionsByGender(selectedGender);

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
      if (!selectedCompanion) {
        setSelectedCompanion(filteredCompanions[0]);
      }
    } else if (step === 3 && selectedCompanion) {
      onComplete(name, selectedCompanion);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Progress indicator */}
        <div className="flex justify-center gap-3 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                s === step ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-16' : 
                s < step ? 'bg-purple-400 w-10' : 'bg-white/20 w-10'
              )}
            />
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/10">
          
          {/* Step 1: Name */}
          {step === 1 && (
            <div className="text-center space-y-6 animate-fadeIn">
              <div className="w-28 h-28 mx-auto bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/30">
                <span className="text-5xl">📹</span>
              </div>
              
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI Friend</span>
                </h1>
                <p className="text-white/70 text-lg">
                  Video call with a real AI companion
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-4 text-left border border-green-500/30">
                <div className="flex items-center gap-2 text-green-400 font-semibold mb-2">
                  <span>✨</span> 100% FREE - No API Key Needed!
                </div>
                <div className="space-y-2 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Real human video companions
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Voice chat - speak naturally
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> AI-powered conversations
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Life coaching & guidance
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <label className="block text-left text-white/60 text-sm ml-1">
                  What should I call you?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Step 2: Choose Gender */}
          {step === 2 && (
            <div className="text-center space-y-6 animate-fadeIn">
              <h1 className="text-3xl font-bold text-white">
                Nice to meet you, <span className="text-purple-400">{name}</span>! 👋
              </h1>
              <p className="text-white/70">
                Choose who you'd like as your AI companion:
              </p>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => {
                    setSelectedGender('female');
                    setSelectedCompanion(null);
                  }}
                  className={cn(
                    'p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02]',
                    selectedGender === 'female'
                      ? 'bg-gradient-to-br from-pink-500/30 to-purple-500/30 border-pink-400 shadow-lg shadow-pink-500/20'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  )}
                >
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-white/30 mb-3">
                    <img 
                      src={videoCompanions.find(c => c.gender === 'female')?.poster}
                      alt="Female companion"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-white font-semibold text-lg">Female</p>
                  <p className="text-white/50 text-sm mt-1">Warm & Caring</p>
                </button>

                <button
                  onClick={() => {
                    setSelectedGender('male');
                    setSelectedCompanion(null);
                  }}
                  className={cn(
                    'p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02]',
                    selectedGender === 'male'
                      ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-blue-400 shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  )}
                >
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-white/30 mb-3">
                    <img 
                      src={videoCompanions.find(c => c.gender === 'male')?.poster}
                      alt="Male companion"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-white font-semibold text-lg">Male</p>
                  <p className="text-white/50 text-sm mt-1">Motivating & Supportive</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Choose Companion */}
          {step === 3 && (
            <div className="text-center space-y-6 animate-fadeIn">
              <h1 className="text-3xl font-bold text-white">
                Choose Your Companion
              </h1>
              <p className="text-white/70">
                Select who you want to video call with:
              </p>

              <div className="grid grid-cols-1 gap-4 mt-6 max-h-80 overflow-y-auto pr-2">
                {filteredCompanions.map((companion) => (
                  <button
                    key={companion.id}
                    onClick={() => setSelectedCompanion(companion)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left',
                      selectedCompanion?.id === companion.id
                        ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400 shadow-lg'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    )}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                      <img 
                        src={companion.poster}
                        alt={companion.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">{companion.name}</h3>
                      <p className="text-purple-300 text-sm">{companion.style}</p>
                      <p className="text-white/50 text-xs mt-1">{companion.description}</p>
                    </div>
                    {selectedCompanion?.id === companion.id && (
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={(step === 1 && !name.trim()) || (step === 3 && !selectedCompanion)}
            className={cn(
              'w-full mt-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform',
              (step === 1 && !name.trim()) || (step === 3 && !selectedCompanion)
                ? 'bg-white/10 text-white/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.98]'
            )}
          >
            {step === 3 ? (
              <span className="flex items-center justify-center gap-2">
                <span>Start Video Call</span>
                <span className="text-xl">📹</span>
              </span>
            ) : (
              'Continue →'
            )}
          </button>
        </div>

        {/* Back button */}
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full text-center text-white/50 hover:text-white mt-4 text-sm transition-colors"
          >
            ← Go back
          </button>
        )}
      </div>
    </div>
  );
}

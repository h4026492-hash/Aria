import { useState } from 'react';
import { cn } from '@/utils/cn';

interface ApiKeySetupProps {
  onComplete: (apiKey: string) => void;
  onSkip: () => void;
}

export function ApiKeySetup({ onComplete, onSkip }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    setIsValidating(true);
    setError('');

    // Simple validation - just check if it looks like a key
    if (apiKey.length < 10) {
      setError('API key seems too short. Please check and try again.');
      setIsValidating(false);
      return;
    }

    // Store and continue
    onComplete(apiKey.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/10">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30 mb-6">
            <span className="text-4xl">🎬</span>
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Enable Real Talking Videos
          </h1>
          
          <p className="text-white/60 text-center mb-6">
            Connect D-ID API for realistic lip-syncing AI videos
          </p>

          {/* What is D-ID */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-5 mb-6 border border-purple-500/20">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span>✨</span> What is D-ID?
            </h3>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              D-ID is an AI service that takes a photo and makes it talk with realistic lip movements - 
              just like a real video call! This is how apps like Luvya.ai work.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-400">
                <span>✓</span> Real lip-sync animation
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span>✓</span> Natural facial expressions
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span>✓</span> Professional AI voices
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <span>✓</span> Free trial credits available
              </div>
            </div>
          </div>

          {/* How to get API key */}
          <div className="bg-white/5 rounded-2xl p-5 mb-6 border border-white/10">
            <h3 className="text-white font-semibold mb-3">📝 How to Get Your API Key:</h3>
            <ol className="space-y-2 text-white/70 text-sm">
              <li className="flex gap-2">
                <span className="text-purple-400 font-bold">1.</span>
                <span>Go to <a href="https://www.d-id.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">d-id.com</a></span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400 font-bold">2.</span>
                <span>Sign up for a free account</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400 font-bold">3.</span>
                <span>Go to Settings → API Keys</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400 font-bold">4.</span>
                <span>Copy your API key and paste below</span>
              </li>
            </ol>
          </div>

          {/* API Key Input */}
          <div className="space-y-3 mb-6">
            <label className="text-white/70 text-sm block">
              Your D-ID API Key:
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              placeholder="Paste your API key here..."
              className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={isValidating}
              className={cn(
                "w-full py-4 rounded-2xl font-semibold text-lg transition-all",
                isValidating
                  ? "bg-purple-600/50 text-white/50"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:shadow-purple-500/30"
              )}
            >
              {isValidating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Validating...
                </span>
              ) : (
                '🚀 Enable Real Videos'
              )}
            </button>

            <button
              onClick={onSkip}
              className="w-full py-4 rounded-2xl font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all border border-white/10"
            >
              Skip for now (use basic mode)
            </button>
          </div>

          {/* Note */}
          <p className="text-center text-white/40 text-xs mt-6">
            Your API key is stored locally on your device and never shared.
          </p>
        </div>

        {/* Skip explanation */}
        <p className="text-center text-white/50 text-sm mt-4 px-4">
          💡 Without API key, you'll get a simulated video call with voice only.
          <br />
          With API key, you get <strong className="text-white/70">real talking videos</strong>!
        </p>
      </div>
    </div>
  );
}

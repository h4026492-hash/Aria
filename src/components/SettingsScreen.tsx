import { UserProfile, CompanionCharacter } from '@/types';
import { companions } from '@/data/companions';
import { cn } from '@/utils/cn';

interface SettingsScreenProps {
  profile: UserProfile;
  companion: CompanionCharacter;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setCompanion: React.Dispatch<React.SetStateAction<CompanionCharacter | null>>;
  onClose: () => void;
  onReset: () => void;
  apiKey?: string;
  setApiKey?: React.Dispatch<React.SetStateAction<string>>;
}

export function SettingsScreen({ 
  profile, 
  companion,
  setProfile, 
  setCompanion,
  onClose, 
  onReset 
}: SettingsScreenProps) {
  
  const handleNameChange = (name: string) => {
    setProfile((prev) => ({ ...prev, name }));
  };

  const handleVoiceToggle = () => {
    setProfile((prev) => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
  };

  const handleCompanionChange = (newCompanion: CompanionCharacter) => {
    setCompanion(newCompanion);
    setProfile(prev => ({
      ...prev,
      companionName: newCompanion.name,
      companionGender: newCompanion.gender,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-white text-xl">⚙️ Settings</h1>
          <p className="text-sm text-white/50">Customize your experience</p>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
        {/* Current Companion */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-3xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-purple-400 shadow-lg shadow-purple-500/30">
              <img 
                src={companion.images.neutral}
                alt={companion.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-xl">{companion.name}</h3>
              <p className="text-purple-300">{companion.style}</p>
              <p className="text-white/50 text-sm mt-1">{companion.description}</p>
            </div>
          </div>
        </div>

        {/* Your Profile */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span>👤</span> Your Profile
          </h3>
          <div>
            <label className="text-sm text-white/50 block mb-2">Your Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Voice Settings */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span>🔊</span> Voice Settings
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">AI Voice</p>
              <p className="text-white/50 text-sm">Let your companion speak out loud</p>
            </div>
            <button
              onClick={handleVoiceToggle}
              className={cn(
                'w-14 h-8 rounded-full transition-all relative',
                profile.voiceEnabled ? 'bg-purple-500' : 'bg-white/20'
              )}
            >
              <div
                className={cn(
                  'absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-md',
                  profile.voiceEnabled ? 'left-7' : 'left-1'
                )}
              />
            </button>
          </div>
        </div>

        {/* Change Companion */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span>🔄</span> Change Companion
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {companions.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCompanionChange(c)}
                className={cn(
                  'p-3 rounded-xl border-2 transition-all',
                  companion.id === c.id
                    ? 'bg-purple-500/30 border-purple-400'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                )}
              >
                <div className="w-12 h-12 mx-auto rounded-full overflow-hidden border-2 border-white/20 mb-2">
                  <img 
                    src={c.images.neutral}
                    alt={c.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-white text-sm font-medium">{c.name}</p>
                <p className="text-white/50 text-xs">{c.style}</p>
              </button>
            ))}
          </div>
        </div>

        {/* About & Pro Features */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/30">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span>✨</span> Want Real Lip-Sync Video?
          </h3>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            For truly realistic AI video with real-time lip-syncing like Luvya.ai, 
            you can integrate with these AI video APIs:
          </p>
          <ul className="space-y-2 text-white/60 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-amber-400">→</span>
              <span><strong className="text-white">D-ID</strong> - Creates talking avatars from photos</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-amber-400">→</span>
              <span><strong className="text-white">HeyGen</strong> - AI video generation platform</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-amber-400">→</span>
              <span><strong className="text-white">Synthesia</strong> - Professional AI avatars</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-amber-400">→</span>
              <span><strong className="text-white">Simli</strong> - Real-time avatar API</span>
            </li>
          </ul>
          <p className="text-amber-300/80 text-xs mt-4">
            These services require API keys and may have usage costs.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span>🎯</span> How to Use
          </h3>
          <ul className="space-y-3 text-white/70 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-0.5">🎤</span>
              <span>Tap the large microphone button and speak naturally</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-0.5">💬</span>
              <span>Or use the chat panel to type your messages</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-0.5">👀</span>
              <span>Watch your AI companion respond to you</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-0.5">🔊</span>
              <span>Listen as they speak back with voice</span>
            </li>
          </ul>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset everything? This will restart the app.')) {
              onReset();
            }
          }}
          className="w-full py-4 bg-red-500/20 text-red-400 rounded-2xl font-medium hover:bg-red-500/30 transition-colors border border-red-500/30"
        >
          🗑️ Reset All Data
        </button>
        
        {/* Back to call button */}
        <button
          onClick={onClose}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-xl hover:shadow-purple-500/30 transition-all"
        >
          ← Back to Video Call
        </button>
      </div>
    </div>
  );
}

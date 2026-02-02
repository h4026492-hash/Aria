import { UserProfile } from '@/types';
import { videoCompanions, VideoCompanion } from '@/data/videoCompanions';
import { cn } from '@/utils/cn';

interface VideoSettingsScreenProps {
  profile: UserProfile;
  companion: VideoCompanion;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setCompanion: React.Dispatch<React.SetStateAction<VideoCompanion | null>>;
  onClose: () => void;
  onReset: () => void;
}

export function VideoSettingsScreen({ 
  profile, 
  companion,
  setProfile, 
  setCompanion,
  onClose, 
  onReset 
}: VideoSettingsScreenProps) {
  
  const handleNameChange = (name: string) => {
    setProfile((prev) => ({ ...prev, name }));
  };

  const handleVoiceToggle = () => {
    setProfile((prev) => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
  };

  const handleSadTalkerToggle = () => {
    setProfile((prev) => ({ ...prev, sadTalkerEnabled: !prev.sadTalkerEnabled }));
  };

  const handleSadTalkerUrlChange = (url: string) => {
    setProfile(prev => ({ ...prev, sadTalkerUrl: url }));
  };

  const handleCompanionChange = (newCompanion: VideoCompanion) => {
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
                src={companion.poster}
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

        {/* Free Banner */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-5 border border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center">
              <span className="text-2xl">🆓</span>
            </div>
            <div>
              <h3 className="text-green-400 font-bold">100% Free Version</h3>
              <p className="text-white/60 text-sm">No API keys required - works forever!</p>
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
                placeholder="Your name"
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
              title={profile.voiceEnabled ? 'Disable voice' : 'Enable voice'}
              aria-label={profile.voiceEnabled ? 'Disable voice' : 'Enable voice'}
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
            {videoCompanions.map((c) => (
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
                    src={c.poster}
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
              <span>Watch your real AI companion respond on video</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-0.5">🔊</span>
              <span>Listen as they speak back with voice</span>
            </li>
          </ul>
        </div>

        {/* Local SadTalker Server */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span>🧩</span> Local Avatar Server (SadTalker)
          </h3>
          <p className="text-white/60 text-sm mb-3">Run SadTalker on a GPU machine and point the app to it. Upload a WAV to the server to get a talking MP4 back.</p>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-medium">Use local SadTalker</p>
              <p className="text-white/50 text-sm">Disable to use cloud D-ID videos</p>
            </div>
            <button
              onClick={handleSadTalkerToggle}
              title={profile.sadTalkerEnabled ? 'Disable SadTalker' : 'Enable SadTalker'}
              aria-label={profile.sadTalkerEnabled ? 'Disable SadTalker' : 'Enable SadTalker'}
              className={cn(
                'w-14 h-8 rounded-full transition-all relative',
                profile.sadTalkerEnabled ? 'bg-purple-500' : 'bg-white/20'
              )}
            >
              <div
                className={cn(
                  'absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-md',
                  profile.sadTalkerEnabled ? 'left-7' : 'left-1'
                )}
              />
            </button>
          </div>

          {profile.sadTalkerEnabled && (
            <div className="space-y-2">
              <label className="text-sm text-white/50 block">SadTalker Server URL</label>
              <input
                type="text"
                value={profile.sadTalkerUrl || ''}
                onChange={(e) => handleSadTalkerUrlChange(e.target.value)}
                placeholder="http://your-server-ip:5000"
                title="SadTalker server URL"
                aria-label="SadTalker server URL"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-white/50 text-xs">Example: <code>http://192.168.1.12:5000</code></p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span>✨</span> What Your AI Friend Can Help With
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
              <span className="text-lg">🎯</span>
              <p className="text-white font-medium mt-1">Goals & Dreams</p>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
              <span className="text-lg">💼</span>
              <p className="text-white font-medium mt-1">Career Advice</p>
            </div>
            <div className="bg-pink-500/10 rounded-xl p-3 border border-pink-500/20">
              <span className="text-lg">💕</span>
              <p className="text-white font-medium mt-1">Relationships</p>
            </div>
            <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20">
              <span className="text-lg">🧘</span>
              <p className="text-white font-medium mt-1">Stress & Anxiety</p>
            </div>
            <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20">
              <span className="text-lg">💰</span>
              <p className="text-white font-medium mt-1">Money & Finance</p>
            </div>
            <div className="bg-orange-500/10 rounded-xl p-3 border border-orange-500/20">
              <span className="text-lg">🔥</span>
              <p className="text-white font-medium mt-1">Motivation</p>
            </div>
          </div>
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

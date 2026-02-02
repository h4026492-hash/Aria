import { useState } from 'react';
import { LifeCompanionProfile, Goal } from '@/types/memory';
import { addGoal, updateGoal, getMoodTrends } from '@/services/memoryService';
import { generateInsights } from '@/services/smartAIService';
import { cn } from '@/utils/cn';

interface DashboardScreenProps {
  profile: LifeCompanionProfile;
  setProfile: (profile: LifeCompanionProfile) => void;
  onClose: () => void;
}

const GOAL_CATEGORIES = [
  { id: 'career', label: 'Career', emoji: '💼', color: 'from-blue-500 to-cyan-500' },
  { id: 'health', label: 'Health', emoji: '💪', color: 'from-green-500 to-emerald-500' },
  { id: 'relationships', label: 'Relationships', emoji: '💕', color: 'from-pink-500 to-rose-500' },
  { id: 'finance', label: 'Finance', emoji: '💰', color: 'from-yellow-500 to-orange-500' },
  { id: 'personal', label: 'Personal', emoji: '✨', color: 'from-purple-500 to-violet-500' },
  { id: 'education', label: 'Education', emoji: '📚', color: 'from-indigo-500 to-blue-500' },
  { id: 'spiritual', label: 'Spiritual', emoji: '🧘', color: 'from-teal-500 to-cyan-500' },
];

const MOOD_EMOJI: Record<string, string> = {
  amazing: '🤩',
  good: '😊',
  okay: '😐',
  low: '😔',
  stressed: '😰',
  anxious: '😟',
  sad: '😢',
};

export function DashboardScreen({ profile, setProfile, onClose }: DashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'moods' | 'insights'>('overview');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<Goal['category']>('personal');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const recentMoods = getMoodTrends(profile, 7);
  const activeGoals = profile.goals.filter(g => g.status === 'active');
  const completedGoals = profile.goals.filter(g => g.status === 'completed');

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) return;

    const newGoal: Goal = {
      id: Date.now().toString(),
      title: newGoalTitle,
      category: newGoalCategory,
      status: 'active',
      progress: 0,
      milestones: [],
      createdAt: new Date(),
    };

    const updated = addGoal(profile, newGoal);
    setProfile(updated);
    setNewGoalTitle('');
    setShowAddGoal(false);
  };

  const handleUpdateGoalProgress = (goalId: string, progress: number) => {
    const status = progress >= 100 ? 'completed' : 'active';
    const updated = updateGoal(profile, goalId, { 
      progress: Math.min(100, progress),
      status,
      ...(status === 'completed' ? { completedAt: new Date() } : {})
    });
    setProfile(updated);
  };

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    const insights = await generateInsights(profile);
    setAiInsights(insights);
    setLoadingInsights(false);
  };

  const getMoodDistribution = () => {
    const distribution: Record<string, number> = {};
    profile.moods.forEach(m => {
      distribution[m.mood] = (distribution[m.mood] || 0) + 1;
    });
    return distribution;
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
          <h1 className="font-bold text-white text-xl">📊 Your Dashboard</h1>
          <p className="text-sm text-white/50">Track your growth journey</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', emoji: '🏠' },
          { id: 'goals', label: 'Goals', emoji: '🎯' },
          { id: 'moods', label: 'Moods', emoji: '😊' },
          { id: 'insights', label: 'AI Insights', emoji: '🧠' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            )}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-500/30">
                <p className="text-white/50 text-sm">Days Together</p>
                <p className="text-3xl font-bold text-white">{profile.stats.daysActive}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-4 border border-orange-500/30">
                <p className="text-white/50 text-sm">Current Streak</p>
                <p className="text-3xl font-bold text-white">🔥 {profile.stats.currentStreak}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-4 border border-green-500/30">
                <p className="text-white/50 text-sm">Goals Completed</p>
                <p className="text-3xl font-bold text-white">✅ {profile.stats.goalsCompleted}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-4 border border-blue-500/30">
                <p className="text-white/50 text-sm">Total Messages</p>
                <p className="text-3xl font-bold text-white">💬 {profile.totalMessages}</p>
              </div>
            </div>

            {/* Active Goals */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <span>🎯</span> Active Goals
              </h3>
              {activeGoals.length === 0 ? (
                <p className="text-white/50 text-center py-4">No active goals yet. Start by adding one!</p>
              ) : (
                <div className="space-y-3">
                  {activeGoals.slice(0, 3).map(goal => (
                    <div key={goal.id} className="bg-white/5 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium">{goal.title}</p>
                        <span className="text-purple-400 text-sm">{goal.progress}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Moods */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <span>😊</span> Recent Moods (7 days)
              </h3>
              {recentMoods.length === 0 ? (
                <p className="text-white/50 text-center py-4">No moods tracked yet. Start sharing how you feel!</p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {recentMoods.map(mood => (
                    <div 
                      key={mood.id}
                      className="bg-white/10 rounded-full px-3 py-1 text-sm flex items-center gap-1"
                    >
                      <span>{MOOD_EMOJI[mood.mood]}</span>
                      <span className="text-white/70 text-xs">
                        {new Date(mood.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Learned Facts */}
            {profile.learnedFacts.length > 0 && (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <span>🧠</span> What I Know About You
                </h3>
                <div className="space-y-2">
                  {profile.learnedFacts.slice(-5).map(fact => (
                    <div key={fact.id} className="text-white/70 text-sm flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      <span>{fact.fact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <>
            {/* Add Goal Button */}
            <button
              onClick={() => setShowAddGoal(true)}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-xl hover:shadow-purple-500/30 transition-all"
            >
              ➕ Add New Goal
            </button>

            {/* Add Goal Modal */}
            {showAddGoal && (
              <div className="bg-white/10 rounded-2xl p-5 border border-purple-500/30 space-y-4 animate-fadeIn">
                <h3 className="text-white font-bold">Create a New Goal</h3>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="What do you want to achieve?"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="grid grid-cols-4 gap-2">
                  {GOAL_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setNewGoalCategory(cat.id as Goal['category'])}
                      className={cn(
                        "p-2 rounded-xl text-center transition-all",
                        newGoalCategory === cat.id
                          ? "bg-purple-500/30 border-2 border-purple-400"
                          : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                      )}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <p className="text-white/70 text-xs mt-1">{cat.label}</p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddGoal(false)}
                    className="flex-1 py-3 bg-white/10 text-white/70 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddGoal}
                    disabled={!newGoalTitle.trim()}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl disabled:opacity-50"
                  >
                    Add Goal
                  </button>
                </div>
              </div>
            )}

            {/* Active Goals */}
            <div className="space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <span>🚀</span> Active Goals ({activeGoals.length})
              </h3>
              {activeGoals.map(goal => {
                const category = GOAL_CATEGORIES.find(c => c.id === goal.category);
                return (
                  <div key={goal.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{category?.emoji}</span>
                      <div className="flex-1">
                        <p className="text-white font-medium">{goal.title}</p>
                        <p className="text-white/50 text-sm">{category?.label}</p>
                      </div>
                      <span className="text-purple-400 font-bold">{goal.progress}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-3">
                      <div 
                        className={cn("h-full bg-gradient-to-r transition-all", category?.color || 'from-purple-500 to-pink-500')}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <div className="flex gap-2">
                      {[10, 25, 50].map(increment => (
                        <button
                          key={increment}
                          onClick={() => handleUpdateGoalProgress(goal.id, goal.progress + increment)}
                          className="flex-1 py-2 bg-white/10 text-white/70 rounded-lg text-sm hover:bg-white/20 transition-colors"
                        >
                          +{increment}%
                        </button>
                      ))}
                      <button
                        onClick={() => handleUpdateGoalProgress(goal.id, 100)}
                        className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                      >
                        ✓ Done
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <span>🏆</span> Completed ({completedGoals.length})
                </h3>
                {completedGoals.map(goal => (
                  <div key={goal.id} className="bg-green-500/10 rounded-2xl p-4 border border-green-500/30">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="text-white font-medium">{goal.title}</p>
                        <p className="text-green-400 text-sm">
                          Completed {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Moods Tab */}
        {activeTab === 'moods' && (
          <>
            {/* Mood Distribution */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-bold mb-4">Your Mood Distribution</h3>
              {profile.moods.length === 0 ? (
                <p className="text-white/50 text-center py-8">
                  No moods logged yet. Share how you're feeling during calls!
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(getMoodDistribution()).map(([mood, count]) => (
                    <div key={mood} className="flex items-center gap-3">
                      <span className="text-2xl w-10">{MOOD_EMOJI[mood]}</span>
                      <div className="flex-1">
                        <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${(count / profile.moods.length) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-white/70 text-sm w-12 text-right">{count}x</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mood History */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-bold mb-4">Recent Mood History</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {profile.moods.slice().reverse().slice(0, 20).map(mood => (
                  <div key={mood.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                    <span className="text-xl">{MOOD_EMOJI[mood.mood]}</span>
                    <div className="flex-1">
                      <p className="text-white text-sm capitalize">{mood.mood}</p>
                      <p className="text-white/50 text-xs">
                        {new Date(mood.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-white font-bold text-xl mb-2 flex items-center gap-2">
                <span>🧠</span> AI-Powered Insights
              </h3>
              <p className="text-white/70 mb-4">
                Let me analyze your patterns and give you personalized insights!
              </p>
              <button
                onClick={handleGetInsights}
                disabled={loadingInsights}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50"
              >
                {loadingInsights ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  '✨ Generate My Insights'
                )}
              </button>
            </div>

            {aiInsights && (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 animate-fadeIn">
                <h3 className="text-white font-bold mb-3">Your Personalized Insights</h3>
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{aiInsights}</p>
              </div>
            )}

            {/* Patterns */}
            {profile.patterns.length > 0 && (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <span>📊</span> Patterns I've Noticed
                </h3>
                <div className="space-y-3">
                  {profile.patterns.map(pattern => (
                    <div key={pattern.id} className="bg-white/5 rounded-xl p-3">
                      <p className="text-white">{pattern.pattern}</p>
                      <p className="text-white/50 text-sm mt-1">
                        Noticed {pattern.frequency} times
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learned Facts */}
            {profile.learnedFacts.length > 0 && (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <span>📝</span> Things I Remember About You
                </h3>
                <div className="space-y-2">
                  {profile.learnedFacts.map(fact => (
                    <div key={fact.id} className="flex items-start gap-2 text-sm">
                      <span className="text-purple-400 mt-1">•</span>
                      <p className="text-white/70">{fact.fact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Back Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 to-transparent">
        <button
          onClick={onClose}
          className="w-full max-w-md mx-auto block py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-xl hover:shadow-purple-500/30 transition-all"
        >
          ← Back to Video Call
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}

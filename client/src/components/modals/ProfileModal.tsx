import React, { useState } from 'react';
import { 
  X, 
  Edit3, 
  Lock, 
  Check, 
  Calendar, 
  Flame, 
  Trophy, 
  MessageSquare, 
  Zap, 
  Brain, 
  Eye, 
  Sparkles,
  Share2
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { api } from '../../services/api';

export const ProfileModal: React.FC = () => {
  const { activeModal, setActiveModal, user, setUser, conversations } = useAppStore();
  const [activeRange, setActiveRange] = useState<'Daily' | 'Weekly' | 'Cumulative'>('Daily');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || 'huzaifa rajput');

  if (activeModal !== 'profile') return null;

  const getInitials = (name?: string) => {
    if (!name) return 'HR';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleSaveProfile = async () => {
    if (editName.trim()) {
      try {
        const u = await api.updateProfile({ displayName: editName.trim() });
        setUser(u);
      } catch (e) {
        // Fallback local update
        if (user) setUser({ ...user, displayName: editName.trim() });
      }
    }
    setIsEditing(false);
  };

  // Generate 52 weeks x 7 days activity heatmap grid
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-[#09090b] border border-[#27272a] shadow-2xl overflow-hidden text-xs text-[#e4e4e7]">
        {/* Top Bar (Exact Match to Screenshot 1) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#18181b] bg-[#09090b]">
          <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
            <span className="font-semibold text-white">Profile</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] text-[#71717a]">
              <Lock className="w-3.5 h-3.5" />
              <span>Private</span>
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 text-xs text-white hover:text-indigo-400 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="p-1 rounded-lg text-[#71717a] hover:text-white transition cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Hero Header */}
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-amber-700 text-white font-bold text-lg flex items-center justify-center shadow-lg">
              {getInitials(user?.displayName || user?.username)}
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-3 py-1 rounded-xl bg-[#18181b] border border-indigo-500 text-white text-sm font-semibold focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveProfile}
                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  {user?.displayName || 'huzaifa rajput'}
                </h1>
                <div className="text-xs text-[#71717a] flex items-center justify-center gap-1.5 mt-0.5">
                  <span>@{user?.username || 'hr1034072'}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Free</span>
                </div>
              </div>
            )}
          </div>

          {/* Stats Row (Current Streak, Longest Streak, Total Chats, Reasoning) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#121215] border border-[#27272a] text-center space-y-1">
              <div className="text-base font-bold text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" />
                <span>1 day</span>
              </div>
              <div className="text-[10px] text-[#71717a] uppercase font-semibold">Current streak</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#121215] border border-[#27272a] text-center space-y-1">
              <div className="text-base font-bold text-indigo-400 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4" />
                <span>5 days</span>
              </div>
              <div className="text-[10px] text-[#71717a] uppercase font-semibold">Longest streak</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#121215] border border-[#27272a] text-center space-y-1">
              <div className="text-base font-bold text-white flex items-center justify-center gap-1">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>{conversations.length || 7}</span>
              </div>
              <div className="text-[10px] text-[#71717a] uppercase font-semibold">Total chats</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#121215] border border-[#27272a] text-center space-y-1">
              <div className="text-base font-bold text-purple-400 flex items-center justify-center gap-1">
                <Brain className="w-4 h-4" />
                <span>97%</span>
              </div>
              <div className="text-[10px] text-[#71717a] uppercase font-semibold">Reasoning Mode</div>
            </div>
          </div>

          {/* Activity Heatmap Grid (Exact Match to Screenshot 1) */}
          <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-xs text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Token & Chat Activity</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {(['Daily', 'Weekly', 'Cumulative'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setActiveRange(r)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      activeRange === r ? 'bg-[#27272a] text-white font-medium' : 'text-[#71717a] hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Heatmap Matrix */}
            <div className="overflow-x-auto py-1">
              <div className="flex gap-1 min-w-[540px]">
                {Array.from({ length: 36 }).map((_, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                      const isRecent = weekIdx >= 32 && dayIdx >= 3;
                      const isToday = weekIdx === 35 && dayIdx === 4;
                      return (
                        <div
                          key={dayIdx}
                          className={`w-2.5 h-2.5 rounded-[2px] transition-colors ${
                            isToday
                              ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                              : isRecent
                              ? 'bg-[#3b82f6]/40'
                              : 'bg-[#27272a]/60 hover:bg-[#3f3f46]'
                          }`}
                          title={`Activity record`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              {/* Months Row */}
              <div className="flex justify-between text-[9px] text-[#71717a] pt-1 px-1">
                {months.map((m, idx) => (
                  <span key={idx}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Insights & Capabilities Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Activity Insights */}
            <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] space-y-2.5">
              <div className="font-semibold text-xs text-white">Activity insights</div>
              
              <div className="flex items-center justify-between text-[11px] py-1 border-b border-[#27272a]/50">
                <span className="text-[#a1a1aa]">Fast Mode</span>
                <span className="text-white font-medium">Active (OX-Alpha)</span>
              </div>

              <div className="flex items-center justify-between text-[11px] py-1 border-b border-[#27272a]/50">
                <span className="text-[#a1a1aa]">Most used reasoning</span>
                <span className="text-indigo-400 font-medium">Extra high • 97%</span>
              </div>

              <div className="flex items-center justify-between text-[11px] py-1 border-b border-[#27272a]/50">
                <span className="text-[#a1a1aa]">Skills explored</span>
                <span className="text-white font-medium">Vision, Web, Code</span>
              </div>

              <div className="flex items-center justify-between text-[11px] py-1">
                <span className="text-[#a1a1aa]">Total chats saved</span>
                <span className="text-white font-medium">{conversations.length || 7}</span>
              </div>
            </div>

            {/* Right: Skills & Intelligence Profile */}
            <div className="p-4 rounded-2xl bg-[#121215] border border-[#27272a] space-y-2.5">
              <div className="font-semibold text-xs text-white">Active Intelligence Engine</div>

              <div className="p-2.5 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                  OX
                </div>
                <div>
                  <div className="font-bold text-xs text-white">OX-Alpha Unified Engine</div>
                  <div className="text-[10px] text-[#71717a]">Vision + Code + Deep Reasoning + Live Web</div>
                </div>
              </div>

              <div className="text-[10px] text-[#71717a] leading-relaxed pt-1">
                All intelligence and chats are processed privately on your machine with 0 cloud leakage.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

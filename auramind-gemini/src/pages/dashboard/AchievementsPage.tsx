import { Trophy, Star, Zap, Target, Flame, Crown, Award } from 'lucide-react';
import PageShell from '../../components/dashboard/PageShell';
import { ACHIEVEMENTS, type Achievement } from '../../components/achievements/AchievementUnlock';
import { getUserStats } from '../../services/gamification/gamificationService';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  trophy: Trophy, award: Award, star: Star, flame: Flame, zap: Zap, target: Target, crown: Crown, medal: Award,
};

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center text-sm shrink-0 mt-0.5">
        <Icon size={14} className="text-[#8B5CF6]" />
      </div>
      <div>
        <h3 className="text-[#F0EFFE] text-sm font-medium">{title}</h3>
        <p className="text-[#5A5A72] text-[11px]">{subtitle}</p>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const stats = getUserStats();
  const earned = new Set<string>(stats.earnedAchievements);
  const achievements = Object.values(ACHIEVEMENTS);
  const unlockedCount = achievements.filter(a => earned.has(a.id)).length;

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        <h1 className="text-[#F0EFFE] text-lg font-light tracking-tight">Achievements</h1>
        <p className="text-[#5A5A72] text-xs -mt-6">Track your learning milestones and unlock rewards</p>

        {/* Summary Card */}
        <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center text-white shrink-0">
              <Trophy size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[#F0EFFE] text-sm font-medium">
                  {unlockedCount} of {achievements.length} unlocked
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#2A2A3A] mt-2">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] transition-all duration-500"
                  style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="bg-[#111118] border border-[#2A2A3A] rounded-xl p-6">
          <SectionHeader icon={Trophy} title="All Achievements" subtitle="Complete challenges and hit milestones to earn badges." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {achievements.map((achievement: Achievement) => {
              const unlocked = earned.has(achievement.id);
              const Icon = ICON_MAP[achievement.icon] || Trophy;
              return (
                <div
                  key={achievement.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                    unlocked
                      ? 'bg-[#7C3AED]/5 border border-[#7C3AED]/20'
                      : 'bg-[#1A1A24] border border-[#2A2A3A]/30 opacity-60 grayscale'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    unlocked ? 'bg-[#7C3AED]/15 text-[#8B5CF6]' : 'bg-[#111118] text-[#5A5A72]'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${unlocked ? 'text-[#F0EFFE]' : 'text-[#5A5A72]'}`}>
                        {achievement.title}
                      </span>
                      <span className={`text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        achievement.rarity === 'legendary' ? 'bg-yellow-500/10 text-yellow-400' :
                        achievement.rarity === 'epic' ? 'bg-purple-500/10 text-purple-400' :
                        achievement.rarity === 'rare' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-[#2A2A3A] text-[#5A5A72]'
                      }`}>
                        {achievement.rarity}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#5A5A72] mt-0.5 leading-relaxed">
                      {achievement.description}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star size={10} className="text-yellow-400" />
                      <span className={`text-[9px] font-medium ${unlocked ? 'text-yellow-400' : 'text-[#5A5A72]'}`}>
                        +{achievement.xpReward} XP
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

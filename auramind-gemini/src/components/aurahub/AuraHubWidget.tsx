import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Radio } from '@/components/icons';
import { useAuraHubPresence, type OnlineUser } from '../../hooks/useAuraHubPresence';

interface AuraHubWidgetProps {
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getStatusColor(status: OnlineUser['status']) {
  switch (status) {
    case 'studying': return 'bg-emerald-500';
    case 'browsing': return 'bg-violet-500';
    case 'idle': return 'bg-amber-500';
    default: return 'bg-[#5A5A72]';
  }
}

export default function AuraHubWidget({ userId, displayName, avatarUrl }: AuraHubWidgetProps) {
  const { onlineUsers, count } = useAuraHubPresence(userId, displayName, avatarUrl);

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2 px-2 mb-2">
        <Globe size={11} className="text-[#5A5A72]" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#5A5A72]">
          AuraHub
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Radio size={8} className="text-emerald-500 animate-pulse" />
          <span className="text-[9px] font-mono text-emerald-500">{count}</span>
        </div>
      </div>

      <div className="space-y-0.5">
        {/* Current user */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#7C3AED]/5">
          <div className="relative">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center text-[8px] font-bold text-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(displayName)
              )}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0B0B12] ${getStatusColor('browsing')}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#C4B5FD] font-medium truncate">{displayName}</p>
            <p className="text-[8px] text-[#5A5A72]">you</p>
          </div>
        </div>

        {/* Online peers */}
        <AnimatePresence>
          {onlineUsers.slice(0, 8).map(user => (
            <motion.div
              key={user.userId}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#111118] transition-colors"
            >
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-[#1A1A24] border border-[#2A2A3A] flex items-center justify-center text-[8px] font-bold text-[#9090A8]">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(user.displayName)
                  )}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0B0B12] ${getStatusColor(user.status)}`} />
              </div>
              <p className="text-[10px] text-[#9090A8] font-medium truncate flex-1">
                {user.displayName}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>

        {onlineUsers.length === 0 && (
          <p className="text-[9px] text-[#3A3A4F] text-center py-2 px-2">
            No one else online right now
          </p>
        )}
      </div>
    </div>
  );
}

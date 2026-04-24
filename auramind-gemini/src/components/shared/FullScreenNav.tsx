import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight } from 'lucide-react';
import AuraLogo from '../landing/AuraLogo';

const navLinks = [
  { label: 'How It Works', href: '#protocols' },
  { label: 'Science', href: '#science' },
  { label: 'Features', href: '#features' },
  { label: 'Demo', href: '#lab' },
];

interface FullScreenNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const FullScreenNav: React.FC<FullScreenNavProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ clipPath: 'circle(0% at calc(100% - 3rem) 2rem)' }}
          animate={{ clipPath: 'circle(150% at calc(100% - 3rem) 2rem)' }}
          exit={{ clipPath: 'circle(0% at calc(100% - 3rem) 2rem)' }}
          transition={{ duration: 0.8, ease: [0.65, 0.05, 0, 1] }}
          className="fixed inset-0 z-[150] bg-primary flex flex-col"
        >
          <div className="flex items-center justify-between px-8 py-6">
            <div className="flex items-center gap-3">
              <AuraLogo size={36} />
              <p className="text-[11px] font-black tracking-[0.35em] text-primary-foreground uppercase">AuraMind</p>
            </div>
            <button
              onClick={onClose}
              className="h-12 w-12 rounded-sm flex items-center justify-center text-primary-foreground hover:rotate-90 hover:bg-primary-foreground/10 transition-all duration-500"
            >
              <X size={24} strokeWidth={2} />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
            {navLinks.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                onClick={onClose}
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{
                  delay: 0.15 + i * 0.08,
                  duration: 0.6,
                  ease: [0.65, 0.05, 0, 1],
                }}
                className="group border-b border-primary-foreground/10 py-6 md:py-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-6">
                    <span className="text-[10px] font-black text-primary-foreground/20 tracking-widest">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-impact-md text-primary-foreground group-hover:tracking-wider transition-all duration-500">
                      {link.label}
                    </span>
                  </div>
                  <ArrowUpRight
                    size={24}
                    className="text-primary-foreground/20 group-hover:text-primary-foreground group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"
                  />
                </div>
              </motion.a>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="px-8 py-8 flex items-center justify-between border-t border-primary-foreground/10"
          >
            <p className="text-[9px] font-black text-primary-foreground/20 tracking-[0.3em] uppercase">
              V4.8.2
            </p>
            <p className="text-[9px] font-black text-primary-foreground/20 tracking-[0.3em] uppercase">
              Study App
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullScreenNav;

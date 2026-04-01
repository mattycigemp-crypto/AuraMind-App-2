import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import AuraLogo from './AuraLogo';

const LoadingScreen = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.65, 0.05, 0, 1] as [number, number, number, number] }}
      className="fixed inset-0 z-[200] bg-primary flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.65, 0.05, 0, 1] as [number, number, number, number] }}
        className="text-primary-foreground"
      >
        <AuraLogo size={56} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-8 text-[10px] font-black tracking-[0.6em] text-primary-foreground uppercase"
      >
        LOAD AURAMIND
      </motion.p>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.6, duration: 1.2, ease: [0.65, 0.05, 0, 1] as [number, number, number, number] }}
        className="mt-6 h-[2px] w-32 bg-primary-foreground origin-left"
      />
    </motion.div>
  );
});

LoadingScreen.displayName = 'LoadingScreen';

export default LoadingScreen;

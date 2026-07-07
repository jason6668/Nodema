import React from 'react';
import { motion } from 'motion/react';

interface AudioWaveProps {
  isSpeaking: boolean;
  color?: string;
  count?: number;
}

export default function AudioWave({ isSpeaking, color = 'bg-red-500', count = 4 }: AudioWaveProps) {
  if (!isSpeaking) {
    return (
      <div className="flex items-center justify-center gap-[2px] h-3 w-8">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`w-[2px] h-[3px] rounded-full ${color} opacity-40`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-[2px] h-4 w-8">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-[2px] rounded-full ${color}`}
          initial={{ height: 3 }}
          animate={{
            height: [4, 14, 4],
          }}
          transition={{
            duration: 0.5 + i * 0.15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

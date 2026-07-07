import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DanmakuMessage } from '../types';

interface DanmakuOverlayProps {
  messages: DanmakuMessage[];
  onComplete: (id: string) => void;
}

export default function DanmakuOverlay({ messages, onComplete }: DanmakuOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ x: '100vw' }}
            animate={{ x: '-100%' }}
            exit={{ opacity: 0 }}
            transition={{
              duration: msg.speed,
              ease: 'linear',
            }}
            onAnimationComplete={() => onComplete(msg.id)}
            style={{
              position: 'absolute',
              top: `${msg.top}%`,
              color: msg.color,
            }}
            className="whitespace-nowrap px-3 py-1 rounded-full bg-black/40 border border-white/5 backdrop-blur-sm shadow-md font-sans text-sm font-medium flex items-center gap-1.5"
          >
            <span className="text-white/90">{msg.content}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

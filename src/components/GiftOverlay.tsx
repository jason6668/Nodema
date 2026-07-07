import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ActiveGiftEffect {
  id: string;
  senderName: string;
  giftName: string;
  giftIcon: string;
  animationType: 'pop' | 'fly-right' | 'rocket' | 'sparkle' | 'car';
}

interface GiftOverlayProps {
  activeGift: ActiveGiftEffect | null;
  onComplete: () => void;
}

export default function GiftOverlay({ activeGift, onComplete }: GiftOverlayProps) {
  useEffect(() => {
    if (activeGift) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3500); // Effect duration is 3.5 seconds
      return () => clearTimeout(timer);
    }
  }, [activeGift, onComplete]);

  if (!activeGift) return null;

  const { senderName, giftName, giftIcon, animationType } = activeGift;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30 flex flex-col justify-between p-4">
      {/* Top Banner notification */}
      <div className="w-full flex justify-center mt-12">
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 15 }}
          className="flex items-center gap-3 bg-gradient-to-r from-pink-500/90 via-red-500/90 to-amber-500/90 border border-white/20 text-white px-5 py-2.5 rounded-full shadow-lg backdrop-blur-md"
        >
          <span className="text-xl animate-bounce">{giftIcon}</span>
          <div className="text-xs sm:text-sm font-semibold tracking-tight">
            <span className="text-yellow-200 font-bold mr-1">{senderName}</span>
            <span>送出</span>
            <span className="text-yellow-100 font-extrabold mx-1">{giftName}</span>
            <span>! 感谢支持! ✨</span>
          </div>
        </motion.div>
      </div>

      {/* Main Fullscreen Animation Elements */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence>
          {animationType === 'pop' && (
            <motion.div
              initial={{ scale: 0, rotate: -45, opacity: 0 }}
              animate={{
                scale: [0, 1.4, 1],
                rotate: [0, 15, -10, 0],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2.2,
                times: [0, 0.2, 0.8, 1],
                ease: 'easeInOut',
              }}
              className="text-9xl filter drop-shadow-[0_15px_15px_rgba(239,68,68,0.4)]"
            >
              {giftIcon}
            </motion.div>
          )}

          {animationType === 'fly-right' && (
            <motion.div
              initial={{ x: '-100vw', y: '20vh', scale: 0.5, rotate: -20 }}
              animate={{
                x: ['-50vw', '0vw', '100vw'],
                y: ['20vh', '-5vh', '-30vh'],
                scale: [0.6, 1.5, 0.8],
                rotate: [-20, 10, 45],
              }}
              transition={{
                duration: 2.5,
                times: [0, 0.5, 1],
                ease: 'easeInOut',
              }}
              className="text-8xl filter drop-shadow-[0_10px_10px_rgba(251,191,36,0.3)]"
            >
              {giftIcon}
            </motion.div>
          )}

          {animationType === 'sparkle' && (
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Central big heart */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.8, 1.2, 0],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{ duration: 2.8, times: [0, 0.2, 0.8, 1] }}
                className="text-9xl filter drop-shadow-[0_20px_20px_rgba(236,72,153,0.5)] absolute"
              >
                {giftIcon}
              </motion.div>

              {/* Smaller bursting stars/hearts */}
              {[...Array(12)].map((_, i) => {
                const angle = (i * 360) / 12;
                const distance = 100 + Math.random() * 60;
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * distance;
                const y = Math.sin(rad) * distance;

                return (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{
                      x: [0, x],
                      y: [0, y],
                      scale: [0, 1.2, 0.5],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.8,
                      delay: 0.2,
                      ease: 'easeOut',
                    }}
                    className="absolute text-3xl"
                  >
                    {i % 2 === 0 ? '✨' : '💝'}
                  </motion.div>
                );
              })}
            </div>
          )}

          {animationType === 'car' && (
            <div className="relative w-full h-full flex items-center">
              <motion.div
                initial={{ x: '100vw', y: '10vh', rotate: -5, scale: 0.6 }}
                animate={{
                  // Drives in fast, drifts/bounces in the middle, then zooms away
                  x: ['100vw', '10vw', '0vw', '-100vw'],
                  y: ['10vh', '8vh', '10vh', '20vh'],
                  scale: [0.6, 1.3, 1.4, 0.8],
                  rotate: [-5, -15, 0, 10],
                }}
                transition={{
                  duration: 3,
                  times: [0, 0.3, 0.7, 1],
                  ease: 'easeInOut',
                }}
                className="absolute text-9xl filter drop-shadow-[0_15px_15px_rgba(59,130,246,0.4)] flex flex-col items-center"
              >
                <span>{giftIcon}</span>
                {/* Wheels fire/smoke */}
                <div className="flex gap-16 -mt-4">
                  <motion.span
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 0.2 }}
                    className="text-xl"
                  >
                    💨
                  </motion.span>
                  <motion.span
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 0.2, delay: 0.1 }}
                    className="text-xl"
                  >
                    💨
                  </motion.span>
                </div>
              </motion.div>
            </div>
          )}

          {animationType === 'rocket' && (
            <div className="relative w-full h-full flex flex-col justify-end items-center">
              <motion.div
                initial={{ y: '100vh', scale: 0.7 }}
                animate={{
                  // Blasts off straight up
                  y: ['100vh', '0vh', '-120vh'],
                  scale: [0.8, 1.6, 2.2],
                }}
                transition={{
                  duration: 3,
                  times: [0, 0.4, 1],
                  ease: 'easeIn',
                }}
                className="absolute text-[12rem] filter drop-shadow-[0_25px_25px_rgba(245,158,11,0.5)] flex flex-col items-center"
              >
                <span>{giftIcon}</span>
                {/* Rocket fire trail */}
                <motion.div
                  animate={{
                    y: [-10, 0, -10],
                    scaleY: [1, 1.3, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 0.15 }}
                  className="text-5xl -mt-6 flex flex-col items-center"
                >
                  <span>🔥</span>
                  <span className="text-3xl opacity-80 -mt-2">💨</span>
                </motion.div>
              </motion.div>

              {/* Sparkle debris */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: Math.random() * 300 - 150,
                    y: '20vh',
                    scale: 0,
                    opacity: 0,
                  }}
                  animate={{
                    y: ['20vh', '80vh'],
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.5 + Math.random() * 1,
                    ease: 'easeOut',
                  }}
                  className="absolute text-2xl text-yellow-300"
                >
                  ⭐
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

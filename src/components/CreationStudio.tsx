import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Compass,
  FileText,
  User,
  Mic,
  Layout,
  Palette,
  CreditCard,
  BarChart2,
  MoreHorizontal,
  ChevronRight,
  Globe,
  Lock,
  Sparkles
} from 'lucide-react';
import { LiveMode, RoomSettings } from '../types';
import { ROOM_THEMES } from '../data/themes';

interface CreationStudioProps {
  onStart: (settings: RoomSettings) => void;
  onClose: () => void;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1590608897129-79da98d15969?q=80&w=300&auto=format&fit=crop', // Sunset Neon
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop', // Microphone
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=300&auto=format&fit=crop', // Warm aesthetic
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300&auto=format&fit=crop', // Golden Hour
];

export default function CreationStudio({ onStart, onClose }: CreationStudioProps) {
  // States matching screenshot
  const [mode, setMode] = useState<LiveMode>('voice');
  const [title, setTitle] = useState('失业你们都在干嘛');
  const [coverIndex, setCoverIndex] = useState(0);
  const [intro, setIntro] = useState('失业联盟，倾听你的心声，分享生活的每一个小波澜。');
  const [isPublic, setIsPublic] = useState(true);
  const [themeId, setThemeId] = useState('space');

  // Popup Modals state
  const [activeModal, setActiveModal] = useState<'intro' | 'theme' | 'cover' | null>(null);

  const handleStartLive = () => {
    onStart({
      title,
      coverImage: PRESET_COVERS[coverIndex],
      intro,
      isPublic,
      mode,
      themeId,
    });
  };

  const selectedTheme = ROOM_THEMES.find((t) => t.id === themeId) || ROOM_THEMES[0];

  return (
    <div className="relative w-full max-w-md mx-auto h-[900px] flex flex-col justify-between overflow-hidden bg-[#0A0D14] text-white shadow-2xl rounded-3xl border border-zinc-800">
      
      {/* Top Background Ambient Glow */}
      <div className={`absolute top-0 inset-x-0 h-96 bg-gradient-to-b ${selectedTheme.previewBg} opacity-40 blur-3xl pointer-events-none`} />

      {/* HEADER SECTION */}
      <div className="relative z-10 px-4 pt-5 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 active:scale-95 transition rounded-full text-zinc-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Dynamic Gradient Neon Banner */}
        <div className="flex-1 mx-3 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-600 rounded-full py-1.5 px-4 flex items-center justify-between shadow-[0_4px_12px_rgba(245,158,11,0.2)]">
          <span className="text-[11px] font-extrabold tracking-wide text-black flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-black" />
            点击报名 开播瓜分百万现金
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-black stroke-[3]" />
        </div>
      </div>

      {/* AUDIO MIC SLOTS PREVIEW (Grid like screenshot) */}
      <div className="relative z-10 px-6 py-6 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-3 gap-y-8 gap-x-6 justify-items-center my-auto">
          {/* Slot 1: Active Streamer / Organization */}
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16 rounded-full border-2 border-cyan-500 bg-cyan-950/50 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <div className="flex gap-0.5 mb-1 text-cyan-400">
                <Mic className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-[9px] font-bold">+</span>
                <Mic className="w-3.5 h-3.5" />
              </div>
              <span className="text-[8px] font-bold text-cyan-200 tracking-wider">失业联盟</span>
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border border-cyan-400/30 scale-110 animate-ping pointer-events-none" />
            </div>
          </div>

          {/* Slots 2-9: Audience placeholders */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-zinc-900/60 border border-zinc-800/40 flex items-center justify-center text-zinc-600 shadow-inner hover:border-zinc-700/60 transition">
                <User className="w-6 h-6 stroke-[1.5]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN FORM PANEL */}
      <div className="relative z-10 px-4 pb-4 bg-gradient-to-t from-[#090A0F] via-[#0D0F17]/95 to-[#0D0F17]/80 pt-6 rounded-t-3xl border-t border-zinc-800/60 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        
        {/* Live Stream Mode Category Tabs (默认/语音/手游/电脑) */}
        <div className="flex items-center gap-2 mb-6 px-1">
          {(['default', 'voice', 'game', 'pc'] as LiveMode[]).map((m) => {
            const labelMap: Record<LiveMode, string> = {
              default: '默认',
              voice: '语音',
              game: '手游',
              pc: '电脑',
            };
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  active ? 'text-black bg-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {labelMap[m]}
              </button>
            );
          })}
        </div>

        {/* Cover image & Title input Card */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 flex gap-4 items-start mb-5 backdrop-blur-md">
          {/* Cover Selector Button */}
          <button
            onClick={() => setActiveModal('cover')}
            className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-800 border border-white/5 flex flex-col items-center justify-center hover:border-zinc-500 group shadow-lg"
          >
            <img
              src={PRESET_COVERS[coverIndex]}
              alt="Live Cover"
              className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition duration-300"
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
              <Plus className="w-5 h-5 text-white/80" />
              <span className="text-[10px] text-white/90 font-medium mt-1">单封面</span>
            </div>
          </button>

          {/* Title and Intro rows */}
          <div className="flex-1 flex flex-col gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="添加吸引人的直播标题..."
              className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 font-bold text-base focus:outline-none focus:ring-0 px-0 py-0.5 border-b border-zinc-800 focus:border-red-500 transition"
              maxLength={25}
            />

            <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium">
              <button
                onClick={() => setActiveModal('intro')}
                className="flex items-center gap-1.5 hover:text-white transition"
              >
                <Compass className="w-3.5 h-3.5 text-red-500" />
                <span>直播介绍</span>
              </button>

              <button
                onClick={() => setIsPublic(!isPublic)}
                className="flex items-center gap-1.5 hover:text-white transition"
              >
                {isPublic ? (
                  <>
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    <span>公开直播</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>加密私密</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mid Options Menu (主次布局/主题背景/信息卡/投票/更多) */}
        <div className="grid grid-cols-5 gap-1 text-center py-2 mb-6 border-t border-zinc-900">
          <button className="flex flex-col items-center gap-1.5 hover:opacity-80 active:scale-95 transition text-zinc-400 group">
            <div className="w-11 h-11 rounded-xl bg-zinc-900/60 border border-zinc-800/40 flex items-center justify-center group-hover:text-white">
              <Layout className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-[10px] font-medium">主次布局</span>
          </button>

          <button
            onClick={() => setActiveModal('theme')}
            className="flex flex-col items-center gap-1.5 hover:opacity-80 active:scale-95 transition text-zinc-400 group"
          >
            <div className="w-11 h-11 rounded-xl bg-zinc-900/60 border border-zinc-800/40 flex items-center justify-center group-hover:text-white">
              <Palette className="w-5 h-5 stroke-[1.8] text-red-500/80" />
            </div>
            <span className="text-[10px] font-medium text-zinc-100">主题背景</span>
          </button>

          <button className="flex flex-col items-center gap-1.5 hover:opacity-80 active:scale-95 transition text-zinc-400 group">
            <div className="w-11 h-11 rounded-xl bg-zinc-900/60 border border-zinc-800/40 flex items-center justify-center group-hover:text-white">
              <CreditCard className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-[10px] font-medium">信息卡</span>
          </button>

          <button className="flex flex-col items-center gap-1.5 hover:opacity-80 active:scale-95 transition text-zinc-400 group">
            <div className="w-11 h-11 rounded-xl bg-zinc-900/60 border border-zinc-800/40 flex items-center justify-center group-hover:text-white">
              <BarChart2 className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-[10px] font-medium">投票</span>
          </button>

          <button className="flex flex-col items-center gap-1.5 hover:opacity-80 active:scale-95 transition text-zinc-400 group">
            <div className="w-11 h-11 rounded-xl bg-zinc-900/60 border border-zinc-800/40 flex items-center justify-center group-hover:text-white">
              <MoreHorizontal className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-[10px] font-medium">更多</span>
          </button>
        </div>

        {/* Start Button (Giant Red Button) */}
        <div className="px-1 mb-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleStartLive}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#FF2442] to-[#FF4E69] text-white font-extrabold text-base tracking-wide shadow-[0_10px_25px_rgba(255,36,66,0.3)] active:opacity-90 hover:brightness-105 transition duration-200"
          >
            {mode === 'voice' ? '开始语音直播' : '开始视频直播'}
          </motion.button>
        </div>

        {/* BOTTOM TABS (拍摄 / 直播) */}
        <div className="flex justify-center items-center gap-8 text-[13px] font-bold pt-1.5 border-t border-zinc-900">
          <button className="text-zinc-500 hover:text-zinc-300 transition-colors py-1">
            拍摄
          </button>
          <div className="relative py-1 text-white flex flex-col items-center">
            <span>直播</span>
            <span className="absolute bottom-0 w-4 h-0.5 rounded-full bg-red-500" />
          </div>
        </div>
      </div>

      {/* POPUP OVERLAYS */}
      <AnimatePresence>
        {activeModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setActiveModal(null)} />

            {/* Modal Body */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative z-10 bg-[#12141C] border-t border-zinc-800 rounded-t-3xl p-6"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <h4 className="font-bold text-sm text-zinc-300">
                  {activeModal === 'intro' && '编辑直播介绍'}
                  {activeModal === 'theme' && '选择直播背景主题'}
                  {activeModal === 'cover' && '选择直播间封面'}
                </h4>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 hover:bg-zinc-800 rounded-full transition"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Body Content */}
              {activeModal === 'intro' && (
                <div className="space-y-4">
                  <textarea
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                    className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-red-500 transition resize-none"
                    placeholder="好的介绍能吸引更多听众哦..."
                    maxLength={100}
                  />
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl text-xs transition"
                  >
                    确定保存
                  </button>
                </div>
              )}

              {activeModal === 'theme' && (
                <div className="grid grid-cols-2 gap-3 pb-4">
                  {ROOM_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setThemeId(t.id);
                        setActiveModal(null);
                      }}
                      className={`h-24 rounded-2xl p-3 text-left relative overflow-hidden flex flex-col justify-end border-2 transition-all ${
                        themeId === t.id ? 'border-red-500 shadow-md scale-[1.02]' : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {/* Thumbnail BG */}
                      <div className={`absolute inset-0 bg-gradient-to-b ${t.previewBg} opacity-80`} />
                      <span className="relative z-10 text-[11px] font-bold text-white tracking-wide bg-black/40 px-2 py-0.5 rounded-md border border-white/5 inline-block">
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {activeModal === 'cover' && (
                <div className="grid grid-cols-4 gap-3 pb-4">
                  {PRESET_COVERS.map((cov, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCoverIndex(idx);
                        setActiveModal(null);
                      }}
                      className={`aspect-square rounded-xl overflow-hidden relative border-2 ${
                        coverIndex === idx ? 'border-red-500 scale-[1.02]' : 'border-transparent hover:border-zinc-700'
                      }`}
                    >
                      <img src={cov} alt="Cover option" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

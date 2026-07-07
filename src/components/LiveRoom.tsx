import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Send,
  Gift as GiftIcon,
  Users,
  X,
  Flame,
  Coins,
  Compass,
  LayoutGrid,
  TrendingUp,
  Award,
  Sparkles,
  Vote,
  MessageSquare,
  Smile,
  Volume2
} from 'lucide-react';
import { RoomSettings, CoHost, ChatMessage, DanmakuMessage, LivePoll } from '../types';
import { ROOM_THEMES, AVAILABLE_GIFTS } from '../data/themes';
import AudioWave from './AudioWave';
import CameraStream from './CameraStream';
import DanmakuOverlay from './DanmakuOverlay';
import GiftOverlay from './GiftOverlay';
import PollWidget from './PollWidget';

interface LiveRoomProps {
  settings: RoomSettings;
  onClose: () => void;
  nickname: string;
  avatarUrl: string;
}

// Simulated active audience list
const MOCK_AUDIENCE = [
  { id: 'a1', name: '椰林树影', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop' },
  { id: 'a2', name: '猫和吉他', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop' },
  { id: 'a3', name: '程序员老李', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop' },
  { id: 'a4', name: '不落的斜阳', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=100&auto=format&fit=crop' },
  { id: 'a5', name: '风吹麦浪', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop' }
];

// Preset comments simulation for "失业" (unemployed) theme
const SIMULATED_COMMENTS = [
  '上个月被裁了，拿了N+1，现在天天在家睡到自然醒',
  '考公是不是唯一的退路？求上岸经验啊',
  '送外卖感觉身体变好了，就是太晒了',
  '我考了三次研都失败了，现在开始学剪辑了',
  '主播声音好温柔啊，被治愈到了',
  '同失业，大厂35岁真的太难了...',
  '每天睡醒都很焦虑，不知道今天该投什么简历',
  '今天去星巴克，发现里面全是拿着电脑找工作的中年人',
  '要不要去试试做自媒体博主？',
  '大吉大利，明天一定会拿到offer的！',
  '哈哈哈哈送个大跑车！',
  '大家都打算怎么度过这段空窗期啊？',
  '我找了两个月，降薪50%都不行，好卷呀',
  '抱抱大家，我们一起加油！',
  '打算明天去摆摊卖柠檬茶了，有人合伙吗？'
];

export default function LiveRoom({ settings, onClose, nickname, avatarUrl }: LiveRoomProps) {
  // Room basic states
  const [popularity, setPopularity] = useState(1280);
  const [coins, setCoins] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [danmakus, setDanmakus] = useState<DanmakuMessage[]>([]);
  
  // Media states for self/host
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);

  // Co-hosts list (9 slots including self as slot 0)
  const [coHosts, setCoHosts] = useState<CoHost[]>(() => [
    {
      id: 'host-self',
      name: nickname ? `${nickname} (我)` : '我 (房主)',
      avatar: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
      isMuted: false,
      isSpeaking: true,
      role: 'host',
      isVideoEnabled: false
    },
    {
      id: 'cohost-1',
      name: '椰林树影',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop',
      isMuted: false,
      isSpeaking: false,
      role: 'co-host'
    },
    {
      id: 'cohost-2',
      name: '程序员老李',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop',
      isMuted: false,
      isSpeaking: false,
      role: 'co-host'
    },
    {
      id: 'cohost-3',
      name: '不落的斜阳',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=100&auto=format&fit=crop',
      isMuted: true,
      isSpeaking: false,
      role: 'co-host'
    },
    // slots 5 to 9 are currently empty
  ]);

  // Modals & Panels toggle
  const [isGiftShopOpen, setIsGiftShopOpen] = useState(false);
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active overlays
  const [activeGiftEffect, setActiveGiftEffect] = useState<any | null>(null);
  const [currentPoll, setCurrentPoll] = useState<LivePoll | null>(null);
  
  // Ref for chat auto-scroll
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Active Room Background
  const currentTheme = ROOM_THEMES.find((t) => t.id === settings.themeId) || ROOM_THEMES[0];

  // Initialize room logs
  useEffect(() => {
    setMessages([
      {
        id: 'sys-1',
        userId: 'system',
        userName: 'RED直播小助手',
        avatar: '',
        content: `欢迎来到「${settings.title}」语音互动直播间！绿色文明直播，请勿发布违规内容。`,
        type: 'system'
      },
      {
        id: 'sys-2',
        userId: 'system',
        userName: '系统提示',
        avatar: '',
        content: `直播房主已开启 9麦 语音席互动，观众可点击空余席位申请连麦交流。`,
        type: 'system'
      }
    ]);

    // Fast simulated joining log
    const timer = setTimeout(() => {
      triggerUserJoin('风吹麦浪');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Synchronize host states in coHost array
  useEffect(() => {
    setCoHosts((prev) =>
      prev.map((c) =>
        c.id === 'host-self'
          ? { ...c, isMuted: isMicMuted, isVideoEnabled: isCameraOn, isSpeaking: !isMicMuted }
          : c
      )
    );
  }, [isMicMuted, isCameraOn]);

  // Auto scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulation: Popularity increasing and random viewer comments & gifts
  useEffect(() => {
    const chatInterval = setInterval(() => {
      // Simulate viewers commenting
      const randomUser = MOCK_AUDIENCE[Math.floor(Math.random() * MOCK_AUDIENCE.length)];
      const randomComment = SIMULATED_COMMENTS[Math.floor(Math.random() * SIMULATED_COMMENTS.length)];

      // Add to normal logs
      addChatMessage(randomUser.id, randomUser.name, randomUser.avatar, randomComment, 'text');

      // 40% chance of triggering Danmaku flight
      if (Math.random() < 0.4) {
        addDanmaku(randomComment);
      }

      // Slightly increase room popularity
      setPopularity((p) => p + Math.floor(Math.random() * 20) + 5);
    }, 4500);

    const giftInterval = setInterval(() => {
      // 20% chance of random simulated gifts
      if (Math.random() < 0.25) {
        const randomUser = MOCK_AUDIENCE[Math.floor(Math.random() * MOCK_AUDIENCE.length)];
        const gifts = AVAILABLE_GIFTS;
        const randomGift = gifts[Math.floor(Math.random() * gifts.length)];
        
        // Render simple chat notification
        addChatMessage(
          randomUser.id,
          randomUser.name,
          randomUser.avatar,
          randomGift.label,
          'gift',
          randomGift.name,
          randomGift.icon,
          1
        );

        // Update coins
        setCoins((c) => c + randomGift.cost);

        // If high value gift, trigger fullscreen animation
        if (randomGift.cost >= 20) {
          triggerGiftAnimation(randomUser.name, randomGift.name, randomGift.icon, randomGift.animationType);
        }
      }
    }, 15000);

    return () => {
      clearInterval(chatInterval);
      clearInterval(giftInterval);
    };
  }, []);

  // Simulated co-host speaking loop
  useEffect(() => {
    const speakInterval = setInterval(() => {
      // Select a random active mock co-host (slots 1 to 3)
      const mockCoHostIds = ['cohost-1', 'cohost-2', 'cohost-3'];
      const activeCohosts = coHosts.filter((c) => mockCoHostIds.includes(c.id));
      if (activeCohosts.length === 0) return;

      const speakerIndex = Math.floor(Math.random() * coHosts.length);
      const targetSpeaker = coHosts[speakerIndex];
      
      if (targetSpeaker && targetSpeaker.id !== 'host-self' && !targetSpeaker.isMuted) {
        // Trigger speech activity
        setCoHosts((prev) =>
          prev.map((c) => (c.id === targetSpeaker.id ? { ...c, isSpeaking: true } : c))
        );

        // Speech bubble duration (2.5s)
        setTimeout(() => {
          setCoHosts((prev) =>
            prev.map((c) => (c.id === targetSpeaker.id ? { ...c, isSpeaking: false } : prev.find(item => item.id === targetSpeaker.id)?.isSpeaking ? false : false))
          );
        }, 3000);
      }
    }, 6000);

    return () => clearInterval(speakInterval);
  }, [coHosts]);

  // Helper: Trigger user join system message
  const triggerUserJoin = (username: string) => {
    const newUser = MOCK_AUDIENCE.find((u) => u.name === username) || MOCK_AUDIENCE[4];
    setMessages((prev) => [
      ...prev,
      {
        id: `join-${Date.now()}`,
        userId: newUser.id,
        userName: newUser.name,
        avatar: newUser.avatar,
        content: '进入了直播间 🌟',
        type: 'join'
      }
    ]);
  };

  // Helper: Add normal chat message
  const addChatMessage = (
    userId: string,
    userName: string,
    avatar: string,
    content: string,
    type: 'text' | 'gift' | 'system' | 'join',
    giftName?: string,
    giftIcon?: string,
    giftCount?: number
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random()}`,
        userId,
        userName,
        avatar,
        content,
        type,
        giftName,
        giftIcon,
        giftCount
      }
    ]);
  };

  // Helper: Add flying bullet danmaku
  const addDanmaku = (content: string, customColor?: string) => {
    const colors = ['#ffffff', '#ffeedd', '#ffcccc', '#ccf5ff', '#fffae6', '#f3e8ff'];
    const randomColor = customColor || colors[Math.floor(Math.random() * colors.length)];
    const topPos = 12 + Math.random() * 40; // Avoid controls (from 12% to 52%)
    const speed = 7 + Math.random() * 5; // Horizontal duration (7s to 12s)

    setDanmakus((prev) => [
      ...prev,
      {
        id: `danmaku-${Date.now()}-${Math.random()}`,
        content,
        color: randomColor,
        top: topPos,
        speed
      }
    ]);
  };

  // Handle Danmaku animation finish
  const handleDanmakuComplete = (id: string) => {
    setDanmakus((prev) => prev.filter((d) => d.id !== id));
  };

  // Trigger Fullscreen Gift Animation
  const triggerGiftAnimation = (
    senderName: string,
    giftName: string,
    giftIcon: string,
    animationType: 'pop' | 'fly-right' | 'rocket' | 'sparkle' | 'car'
  ) => {
    setActiveGiftEffect({
      id: `gift-fx-${Date.now()}`,
      senderName,
      giftName,
      giftIcon,
      animationType
    });
  };

  // Handle sending chat message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Add to normal logs
    addChatMessage('host-self', '我 (房主)', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop', chatInput, 'text');

    // Also fly as local Danmaku
    addDanmaku(chatInput, '#FF4E69'); // Rose red highlight for own comments

    setChatInput('');
  };

  // Handle gifting by self
  const handleSendGift = (gift: any) => {
    // Deduct coins internally (or let them send unlimited since it's a premium mock!)
    setCoins((c) => c + gift.cost);

    // Chat notification
    addChatMessage(
      'host-self',
      '我 (房主)',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
      gift.label,
      'gift',
      gift.name,
      gift.icon,
      1
    );

    // Dynamic bullet text
    addDanmaku(`房主送出了 ${gift.icon} ${gift.name} ✨`, '#FCD34D');

    // Full screen animation
    triggerGiftAnimation('我 (房主)', gift.name, gift.icon, gift.animationType);

    setIsGiftShopOpen(false);
  };

  // Interactive Co-hosting: Join / Leave Mic
  const handleCoHostInteraction = (slotIndex: number) => {
    if (slotIndex === 0) {
      // Toggle self mic settings instead of leaving slot 0
      setIsMicMuted(!isMicMuted);
      return;
    }

    const slotId = `cohost-${slotIndex}`;
    const exists = coHosts.find((c) => c.id === slotId);

    if (exists) {
      // Audience leaves slot
      addChatMessage(exists.id, exists.name, exists.avatar, '离开了连麦席 🎤', 'system');
      setCoHosts((prev) => prev.filter((c) => c.id !== slotId));
    } else {
      // Random mock user joins slot
      const candidate = MOCK_AUDIENCE.find((u) => !coHosts.some((c) => c.name === u.name));
      if (!candidate) return;

      const newCoHost: CoHost = {
        id: slotId,
        name: candidate.name,
        avatar: candidate.avatar,
        isMuted: false,
        isSpeaking: false,
        role: 'co-host'
      };

      setCoHosts((prev) => [...prev, newCoHost]);
      addChatMessage(candidate.id, candidate.name, candidate.avatar, '加入了连麦席 🎙️', 'join');
    }
  };

  // Poll operations
  const handleStartPoll = (question: string, options: string[]) => {
    setCurrentPoll({
      question,
      options: options.map((opt) => ({ text: opt, votes: 0 })),
      totalVotes: 0,
      isActive: true
    });

    addChatMessage('system', '投票通知', '', `房主发起了新投票: 「${question}」`, 'system');

    // Trigger random viewer votes dynamically after a few seconds
    setTimeout(() => {
      simulateViewerVotes();
    }, 4000);
  };

  const handleVote = (optionIdx: number) => {
    if (!currentPoll) return;
    setCurrentPoll((prev) => {
      if (!prev) return null;
      const updatedOptions = prev.options.map((opt, i) =>
        i === optionIdx ? { ...opt, votes: opt.votes + 1 } : opt
      );
      return {
        ...prev,
        options: updatedOptions,
        totalVotes: prev.totalVotes + 1
      };
    });
  };

  const simulateViewerVotes = () => {
    let count = 0;
    const maxVotes = 15 + Math.floor(Math.random() * 20);

    const voteTimer = setInterval(() => {
      if (count >= maxVotes) {
        clearInterval(voteTimer);
        return;
      }

      setCurrentPoll((prev) => {
        if (!prev || !prev.isActive) {
          clearInterval(voteTimer);
          return prev;
        }

        const optIndex = Math.floor(Math.random() * prev.options.length);
        const updatedOptions = prev.options.map((opt, i) =>
          i === optIndex ? { ...opt, votes: opt.votes + 1 } : opt
        );

        return {
          ...prev,
          options: updatedOptions,
          totalVotes: prev.totalVotes + 1
        };
      });

      count++;
    }, 800);
  };

  const handleEndPoll = () => {
    setCurrentPoll((prev) => (prev ? { ...prev, isActive: false } : null));
    addChatMessage('system', '投票结束', '', `互动投票已结束，感谢大家参与。`, 'system');
  };

  return (
    <div className={`relative w-full max-w-md mx-auto h-[900px] flex flex-col justify-between overflow-hidden text-white shadow-2xl rounded-3xl border border-zinc-800 transition-colors duration-700 ${currentTheme.className}`}>
      
      {/* 1. FLYING DANMAKU CONTAINER */}
      <DanmakuOverlay messages={danmakus} onComplete={handleDanmakuComplete} />

      {/* 2. FULL SCREEN PREMIUM GIFT EFFECTS */}
      <GiftOverlay activeGift={activeGiftEffect} onComplete={() => setActiveGiftEffect(null)} />

      {/* 3. TOP ROOM NAV HEADER */}
      <div className="relative z-10 px-4 pt-5 pb-3 bg-gradient-to-b from-black/50 to-transparent flex items-center justify-between">
        
        {/* Host Meta Card */}
        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-red-500/50">
            <img src={settings.coverImage} alt="Host Cover" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-xs font-bold leading-none tracking-wide text-zinc-100 flex items-center gap-1">
              <span>{settings.title}</span>
              <Award className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <span className="text-[9px] text-zinc-300 font-medium flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-red-500 fill-red-500" />
                {popularity.toLocaleString()}
              </span>
              <span className="text-[9px] text-yellow-400 font-semibold flex items-center gap-0.5">
                <Coins className="w-3 h-3" />
                {coins}
              </span>
            </div>
          </div>
        </div>

        {/* Audience Mini list & Close Button */}
        <div className="flex items-center gap-3">
          {/* Active online viewers circle previews */}
          <div className="hidden sm:flex items-center -space-x-2">
            {MOCK_AUDIENCE.slice(0, 3).map((v) => (
              <img
                key={v.id}
                src={v.avatar}
                alt={v.name}
                className="w-6 h-6 rounded-full border border-zinc-900 object-cover shadow-md"
              />
            ))}
            <div className="w-6 h-6 rounded-full bg-black/40 border border-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-300">
              +12
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 active:scale-95 transition rounded-full text-zinc-300 hover:text-white bg-black/20 backdrop-blur-md border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 4. BROADCAST MODE CO-HOSTING GRID */}
      <div className="relative z-10 px-4 py-4 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-3 gap-y-6 gap-x-4 max-w-sm mx-auto justify-items-center">
          
          {/* Loop over 9 slots (3x3 grid) */}
          {[...Array(9)].map((_, index) => {
            const slotId = index === 0 ? 'host-self' : `cohost-${index}`;
            const activeUser = coHosts.find((c) => c.id === slotId);

            return (
              <div key={index} className="flex flex-col items-center">
                <div className="relative w-20 h-20">
                  {activeUser ? (
                    // Active Participant slot
                    <div className="w-full h-full relative">
                      {index === 0 ? (
                        <CameraStream
                          isEnabled={isCameraOn}
                          isMuted={isMicMuted}
                          userName="房主我"
                          avatarUrl={settings.coverImage}
                        />
                      ) : (
                        <div className="relative w-full h-full rounded-full overflow-hidden bg-zinc-800 border-2 border-white/10 shadow-lg flex items-center justify-center">
                          <img
                            src={activeUser.avatar}
                            alt={activeUser.name}
                            className={`w-full h-full object-cover transition-all duration-300 ${
                              activeUser.isSpeaking ? 'scale-105 border-2 border-green-500' : ''
                            }`}
                          />
                          {activeUser.isMuted && (
                            <span className="absolute bottom-1 right-1 bg-red-500 p-1 rounded-full text-white shadow-md">
                              <MicOff className="w-3 h-3" />
                            </span>
                          )}

                          {/* Speech subtitle bubble popup */}
                          {activeUser.isSpeaking && (
                            <div className="absolute -top-3 scale-90 bg-green-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md backdrop-blur-sm flex items-center gap-0.5 border border-white/10">
                              <Volume2 className="w-2.5 h-2.5 animate-bounce" />
                              <span>连麦中</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Microphone speech activity border rings */}
                      {activeUser.isSpeaking && !activeUser.isMuted && (
                        <div className="absolute -inset-1.5 rounded-full border border-green-500/50 scale-105 animate-pulse pointer-events-none" />
                      )}
                    </div>
                  ) : (
                    // Empty Mic slot
                    <button
                      onClick={() => handleCoHostInteraction(index)}
                      className="w-full h-full rounded-full bg-black/25 hover:bg-black/40 border border-dashed border-white/10 hover:border-white/30 flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 transition group shadow-inner cursor-pointer"
                    >
                      <Mic className="w-5 h-5 text-zinc-600 group-hover:scale-110 transition" />
                      <span className="text-[8px] font-semibold text-zinc-600 group-hover:text-zinc-400 mt-1">
                        麦位 {index + 1}
                      </span>
                    </button>
                  )}
                </div>

                {/* Subtitle / username display */}
                <div className="mt-1.5 text-center flex items-center gap-1 justify-center max-w-[80px]">
                  <span className={`text-[10px] font-bold truncate max-w-[70px] ${activeUser?.role === 'host' ? 'text-yellow-400' : 'text-zinc-300'}`}>
                    {activeUser ? activeUser.name : '空置'}
                  </span>
                  {activeUser && (
                    <AudioWave isSpeaking={!!activeUser.isSpeaking && !activeUser.isMuted} color={activeUser.role === 'host' ? 'bg-yellow-400' : 'bg-red-500'} count={3} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. INTERACTIVE LIVE PANEL POPUPS (Poll Widget overlay) */}
      <AnimatePresence>
        {isPollOpen && (
          <div className="absolute inset-x-4 bottom-24 z-40">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <PollWidget
                poll={currentPoll}
                isHost={true}
                onStartPoll={handleStartPoll}
                onVote={handleVote}
                onEndPoll={handleEndPoll}
                onClose={() => setIsPollOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. LOGS CHAT LOG PANEL (Bottom Left) */}
      <div className="relative z-10 px-4 pb-2 h-44 flex flex-col justify-end">
        <div className="overflow-y-auto max-h-40 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1">
          {messages.map((msg) => (
            <div key={msg.id} className="text-xs leading-relaxed flex items-start gap-1.5">
              {msg.type === 'system' ? (
                // System notification
                <div className="bg-red-500/10 border border-red-500/10 px-2.5 py-1 rounded-lg text-red-300 font-medium w-full flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold bg-red-500/20 px-1 py-0.2 rounded">系统</span>
                  <span>{msg.content}</span>
                </div>
              ) : msg.type === 'gift' ? (
                // Gift announcement log
                <div className="bg-amber-500/10 border border-amber-500/10 px-2.5 py-1.5 rounded-lg text-amber-200 font-semibold flex items-center gap-1.5 w-full">
                  <span className="text-sm">{msg.giftIcon}</span>
                  <div>
                    <span className="text-white font-bold">{msg.userName}</span>
                    <span> {msg.content}</span>
                  </div>
                </div>
              ) : msg.type === 'join' ? (
                // User Join alert
                <div className="text-[11px] text-zinc-400 font-medium italic flex items-center gap-1">
                  {msg.avatar && (
                    <img src={msg.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                  )}
                  <span className="text-zinc-200 font-semibold">{msg.userName}</span>
                  <span>{msg.content}</span>
                </div>
              ) : (
                // Standard User Chat bubble
                <div className="bg-black/30 border border-white/5 backdrop-blur-sm rounded-2xl px-3 py-1.5 inline-block max-w-[85%]">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`font-extrabold text-[10px] ${msg.userId === 'host-self' ? 'text-yellow-400' : 'text-cyan-400'}`}>
                      {msg.userName}
                    </span>
                    {msg.userId === 'host-self' && (
                      <span className="text-[8px] bg-yellow-400/20 text-yellow-300 px-1 rounded font-bold">房主</span>
                    )}
                  </div>
                  <p className="text-zinc-200 text-xs leading-snug">{msg.content}</p>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 7. BOTTOM ACTION NAVIGATION BAR */}
      <div className="relative z-10 px-4 pb-5 pt-3 bg-gradient-to-t from-black/80 to-transparent border-t border-white/5 flex items-center justify-between gap-3">
        {/* Chat input form */}
        <form onSubmit={handleSendChat} className="flex-1 flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md">
          <MessageSquare className="w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="聊一聊..."
            className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-zinc-500"
            maxLength={35}
          />
          <button type="submit" className="text-red-400 hover:text-red-300 transition active:scale-90 p-0.5">
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Media Buttons (Mic & Video) */}
        <div className="flex items-center gap-2">
          {/* Mic Button */}
          <button
            onClick={() => setIsMicMuted(!isMicMuted)}
            className={`p-2.5 rounded-full transition active:scale-95 border ${
              isMicMuted
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-black/40 border-white/10 text-zinc-300 hover:text-white hover:bg-black/60'
            }`}
            title={isMicMuted ? '取消静音' : '开启静音'}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Camera Button */}
          <button
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`p-2.5 rounded-full transition active:scale-95 border ${
              isCameraOn
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-black/40 border-white/10 text-zinc-300 hover:text-white hover:bg-black/60'
            }`}
            title={isCameraOn ? '关闭摄像头' : '开启摄像头'}
          >
            {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          {/* Poll Button */}
          <button
            onClick={() => setIsPollOpen(!isPollOpen)}
            className={`p-2.5 rounded-full transition active:scale-95 border ${
              isPollOpen
                ? 'bg-red-500 text-white border-transparent shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                : 'bg-black/40 border-white/10 text-zinc-300 hover:text-white'
            }`}
            title="互动投票"
          >
            <Vote className="w-4 h-4" />
          </button>

          {/* Gift Shop Trigger Button */}
          <button
            onClick={() => setIsGiftShopOpen(!isGiftShopOpen)}
            className="p-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 rounded-full text-white shadow-lg active:scale-95 transition flex items-center justify-center border border-white/10"
            title="礼物打赏"
          >
            <GiftIcon className="w-4.5 h-4.5 animate-bounce" />
          </button>
        </div>
      </div>

      {/* 8. GIFT SHOP DRAWER (Bottom overlay sheet) */}
      <AnimatePresence>
        {isGiftShopOpen && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col justify-end">
            <div className="absolute inset-0" onClick={() => setIsGiftShopOpen(false)} />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 22 }}
              className="relative z-10 bg-[#0F111A] border-t border-zinc-800 rounded-t-3xl p-5"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-1.5 text-yellow-400">
                  <Sparkles className="w-4.5 h-4.5" />
                  <h4 className="font-bold text-xs">小红书打赏礼物店 (RED Gifting)</h4>
                </div>
                <button
                  onClick={() => setIsGiftShopOpen(false)}
                  className="p-1 hover:bg-zinc-800 rounded-full transition"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              {/* Gift Grid */}
              <div className="grid grid-cols-5 gap-3 mb-6">
                {AVAILABLE_GIFTS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleSendGift(g)}
                    className="flex flex-col items-center bg-zinc-900/60 hover:bg-zinc-800/80 active:scale-95 border border-zinc-800/30 hover:border-red-500/40 rounded-xl p-2 transition group cursor-pointer"
                  >
                    <span className="text-3xl filter group-hover:scale-110 transition duration-200">
                      {g.icon}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-200 mt-1.5">{g.name}</span>
                    <span className="text-[9px] text-yellow-500 font-semibold mt-0.5 flex items-center gap-0.5">
                      <Coins className="w-2.5 h-2.5" />
                      {g.cost}
                    </span>
                  </button>
                ))}
              </div>

              <div className="text-[10px] text-zinc-500 text-center border-t border-zinc-900 pt-3">
                打赏金币将累计至主播的“硬币余额”中，助推主播登上小红书人气榜！
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

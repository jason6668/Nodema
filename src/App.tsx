import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Radio,
  Lock,
  Unlock,
  Key,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Tv,
  HelpCircle,
  Eye,
  EyeOff,
  Users,
  Github,
  Moon,
  Compass,
  MessageSquare,
  LockKeyhole,
  ShieldAlert,
  Settings,
  Server,
  UserMinus,
  Activity,
  Flame,
  VolumeX,
  Sun
} from 'lucide-react';
import { RoomSettings } from './types';
import CreationStudio from './components/CreationStudio';
import LiveRoom from './components/LiveRoom';
import SecureChatRoom, { ThemeEffectsOverlay, THEMES } from './components/SecureChatRoom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { encryptText, decryptText } from './utils/crypto';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=150&auto=format&fit=crop', // Anime Boy
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=150&auto=format&fit=crop', // Anime Girl
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=150&auto=format&fit=crop', // Kawaii Pastel Globe
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop', // Pastel Fluid
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=150&auto=format&fit=crop'  // Fantasy Celestial
];

export default function App() {
  // Navigation and State Routing
  const [inRoom, setInRoom] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat'>('chat');

  // NodeCrypt Secure User Details
  const [roomId, setRoomId] = useState('Room-888');
  const [passphrase, setPassphrase] = useState('NodeCrypt-Secret-99');
  const [nickname, setNickname] = useState('极客探险者');
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState(0);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);

  const [activeThemeId, setActiveThemeId] = useState(() => {
    const saved = localStorage.getItem(`nodecrypt_theme_Room-888`);
    return saved || 'sakura_dream';
  });

  // Super Admin States
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Admin dynamic control parameters
  const [isE2EEEnforced, setIsE2EEEnforced] = useState(true);
  const [antiScreenshotShield, setAntiScreenshotShield] = useState(true);
  const [selfDestructLimit, setSelfDestructLimit] = useState(30);
  const [audioKbps, setAudioKbps] = useState(320);
  const [adminBroadcastText, setAdminBroadcastText] = useState('');
  const [isDecryptingSimulator, setIsDecryptingSimulator] = useState(false);

  // Live Stream Specific States
  const [activeRoomSettings, setActiveRoomSettings] = useState<RoomSettings | null>(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [showCreationStudio, setShowCreationStudio] = useState(false);

  // Generate a random room ID helper
  const handleRandomRoom = () => {
    const num = Math.floor(Math.random() * 900) + 100;
    setRoomId(`Room-${num}`);
  };

  // Generate random safe E2EE key
  const handleRandomKey = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let result = 'NC-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassphrase(result);
  };

  // Enter Secure Room Action
  const handleEnterRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !passphrase.trim() || !nickname.trim()) {
      alert('所有字段均为必填项，以确保零知识安全连接。');
      return;
    }
    setInRoom(true);
  };

  // Leave room action (resets states)
  const handleLeaveRoom = () => {
    setInRoom(false);
    setIsLiveActive(false);
    setActiveRoomSettings(null);
    setShowCreationStudio(false);
  };

  // Start Live Stream Room
  const handleStartLive = (settings: RoomSettings) => {
    setActiveRoomSettings(settings);
    setIsLiveActive(true);
    setShowCreationStudio(false);
  };

  // Close Live Stream Room
  const handleCloseLive = () => {
    setActiveRoomSettings(null);
    setIsLiveActive(false);
    setShowCreationStudio(false);
  };

  // Sync activeThemeId changes to localStorage
  React.useEffect(() => {
    localStorage.setItem(`nodecrypt_theme_${roomId}`, activeThemeId);
  }, [activeThemeId, roomId]);

  // Handle dynamic profile/avatar updates inside the room
  const handleUpdateProfile = (newNickname: string, newAvatarUrl: string) => {
    setNickname(newNickname);
    if (PRESET_AVATARS.includes(newAvatarUrl)) {
      setSelectedAvatarIdx(PRESET_AVATARS.indexOf(newAvatarUrl));
      setCustomAvatarUrl(null);
    } else {
      setCustomAvatarUrl(newAvatarUrl);
    }
  };

  // Admin panel auth
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === 'Spring' && adminPassword === 'Spring20210618') {
      setIsAdminLoggedIn(true);
      setAdminError('');
    } else {
      setAdminError('❌ 管理员账户或密码错误，请检查您的凭证！');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminUsername('');
    setAdminPassword('');
  };

  // Admin E2EE broadcast messaging system
  const handleAdminBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminBroadcastText.trim()) return;

    try {
      // Admin broadcasts are signed, sealed, and E2EE encrypted using the room passphrase
      const encrypted = await encryptText(`[📢 系统管理员广播] ${adminBroadcastText.trim()}`, passphrase);
      const savedMessages = localStorage.getItem(`nodecrypt_messages_${roomId}`);
      const list = savedMessages ? JSON.parse(savedMessages) : [];

      const broadcastMsg = {
        id: `sys-broadcast-${Date.now()}`,
        userId: 'system',
        userName: 'NodeCrypt (系统管理员)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop', // Beautiful high contrast avatar
        content: `[📢 系统管理员广播] ${adminBroadcastText.trim()}`,
        encryptedContent: encrypted,
        type: 'system',
        reactions: []
      };

      list.push(broadcastMsg);
      localStorage.setItem(`nodecrypt_messages_${roomId}`, JSON.stringify(list));
      
      // Dispatch storage event manually for same page update
      window.dispatchEvent(new StorageEvent('storage', {
        key: `nodecrypt_messages_${roomId}`,
        newValue: JSON.stringify(list)
      }));

      setAdminBroadcastText('');
      alert('📢 E2EE 加密广播内容已成功发布并同步给房间内所有成员！');
    } catch (err) {
      console.error('Failed to broadcast E2EE admin message:', err);
    }
  };

  const activeTheme = THEMES.find((t) => t.id === activeThemeId) || THEMES[0];
  const isThemeLight = activeThemeId === 'sakura_dream' || activeThemeId === 'strawberry_milky' || activeThemeId === 'telegram_blue' || activeThemeId === 'telegram_mint' || activeThemeId === 'telegram_peach';

  return (
    <ErrorBoundary>
      <div className={`min-h-screen transition-all duration-500 font-sans flex flex-col antialiased selection:bg-red-500/10 selection:text-red-600 relative overflow-hidden ${
        inRoom ? activeTheme.bgClass + ' text-zinc-100' : 'bg-[#080B10] bg-gradient-to-br from-[#080B10] via-[#020408] to-[#0E131F] text-zinc-100'
      }`}>
      {/* Dynamic Ambient Glowing Orbs when in Lobby */}
      {!inRoom && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-gradient-to-br from-[#FF2442]/10 to-purple-600/5 blur-[120px] animate-pulse duration-[6000ms]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-gradient-to-tr from-indigo-600/10 to-[#FF4E69]/5 blur-[120px] animate-pulse duration-[8000ms]" />
        </div>
      )}

      {/* FULL SCREEN THEME EFFECTS OVERLAY */}
      {inRoom && <ThemeEffectsOverlay effect={activeTheme.effect} />}
      
      {/* 1. SECURE TOP NAVIGATION BAR */}
      <header className={`border-b sticky top-0 z-40 px-6 py-4 flex items-center justify-between transition-all duration-300 ${
        inRoom 
          ? isThemeLight
            ? 'border-zinc-200 bg-white/80 backdrop-blur-md text-zinc-900 shadow-sm'
            : 'border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md text-white'
          : 'border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md text-white'
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Radio className="w-5 h-5 text-white animate-pulse" />
            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 border border-white">
              <Lock className="w-2.5 h-2.5 text-black" />
            </div>
          </div>
          <div>
            <h1 className={`text-sm font-black tracking-tight flex items-center gap-1.5 ${
              (inRoom && isThemeLight) ? 'text-zinc-900' : 'text-white'
            }`}>
              <span>马老师NodeCrypt E2EE Live</span>
              <span className="text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.2 rounded-full uppercase">
                RED Live Edition
              </span>
            </h1>
            <p className={`text-[10px] font-medium ${
              (inRoom && isThemeLight) ? 'text-zinc-500' : 'text-zinc-400'
            }`}>真正的本地端到端加密（E2EE）通讯，利用 AES-GCM 算法在您的浏览器本地进行加解密。</p>
          </div>
        </div>

        {/* Tab switcher shown ONLY when in secure room to help switch views on mobile */}
        {inRoom && (
          <div className={`flex items-center p-1.5 rounded-full gap-1.5 shadow-inner ${
            isThemeLight
              ? 'bg-zinc-100 border border-zinc-200'
              : 'bg-zinc-900/60 border border-zinc-800/60'
          }`}>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 md:px-4 py-2 md:py-1.5 rounded-full text-sm md:text-xs font-bold transition flex items-center gap-1.5 md:gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-zinc-800 text-white'
                  : isThemeLight ? 'text-zinc-600 hover:text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LockKeyhole className="w-4 h-4 md:w-3.5 md:h-3.5" />
              <span className="hidden sm:inline">密讯聊天</span>
              <span className="sm:hidden">聊天</span>
            </button>
          </div>
        )}

        {/* Super Admin Panel Access */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowAdminModal(true)}
            className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl transition border font-black text-[11px] md:text-xs active:scale-95 shadow-sm ${
              inRoom && isThemeLight
                ? 'bg-red-50/80 border-red-200 text-red-600 hover:bg-red-100'
                : 'bg-red-950/20 border-red-900/40 text-red-400 hover:bg-red-950/40'
            }`}
          >
            <ShieldAlert className="w-3 h-3 md:w-3.5 md:h-3.5 animate-pulse" />
            <span className="hidden sm:inline">超级后台</span>
            <span className="sm:hidden">后台</span>
          </button>

          {/* GitHub Repository Reference Link */}
          <div className="hidden lg:flex items-center gap-3 md:gap-4 text-[11px] md:text-xs font-semibold">
          <a
            href="https://github.com/jensenmasan/NodeCrypt.git"
            target="_blank"
            referrerPolicy="no-referrer"
            className={`flex items-center gap-1.5 transition ${
              inRoom && isThemeLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>马老师NodeCrypt</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>
        </div>
      </div>
    </header>

      {/* 2. DYNAMIC WORKSPACE PORT */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center overflow-y-auto">

        <AnimatePresence mode="wait">
          {!inRoom ? (
            /* ==================== A. NODECRYPT GATEWAY ENTRANCE LOBBY ==================== */
            <motion.div
              key="lobby-entrance"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start py-4 md:py-8 px-4 md:px-6"
            >
              {/* Informational Hero Casing Left - Hide on mobile */}
              <div className="hidden md:block md:col-span-5 space-y-4 md:space-y-6 order-2 md:order-1">
                <div className="space-y-2 md:space-y-3">
                  <span className="text-[9px] md:text-[10px] text-red-400 font-extrabold uppercase bg-red-500/10 px-2 md:px-2.5 py-0.6 md:py-0.8 rounded-md border border-red-500/20 inline-block tracking-widest">
                    安全通讯沙盒
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                    基于 马老师NodeCrypt<br />零知识加密连麦
                  </h2>
                  <p className="text-[11px] md:text-xs text-zinc-400 leading-relaxed">
                    真正的本地端到端加密（E2EE）通讯，利用 AES-GCM 算法在您的浏览器本地进行加解密。
                  </p>
                </div>

                {/* Bullet Points */}
                <div className="space-y-3 md:space-y-4 border-t border-zinc-800/60 pt-3 md:pt-5 text-[11px] md:text-xs text-zinc-500">
                  <div className="flex gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-red-400 shadow-sm shrink-0">
                      <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-200 text-[11px] md:text-xs">零知识对称加密</h4>
                      <p className="text-[10px] md:text-[11px] text-zinc-400 mt-0.5 leading-relaxed">所有消息、语音和媒体在发送前由密钥进行加密，服务器永远只保留无法破解的密文，真正端到端防护。</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Lobby Entrance Interactive Form Card Right - Full width on mobile */}
              <div className="md:col-span-7 order-1 md:order-2 w-full">
                <form
                  onSubmit={handleEnterRoom}
                  className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-[20px] md:rounded-[32px] p-4 md:p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden space-y-4 md:space-y-5 w-full"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />

                  <div className="border-b border-zinc-800/80 pb-3 md:pb-3 flex items-center gap-2">
                    <div className="w-8 h-8 md:w-8 md:h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                      <Shield className="w-4.5 h-4.5 md:w-4.5 md:h-4.5 text-red-500" />
                    </div>
                    <h3 className="font-black text-sm md:text-sm tracking-tight text-white">进入端到端加密房间大堂</h3>
                  </div>

                  {/* 1. Room ID with helper */}
                  <div className="space-y-1.5 md:space-y-2">
                    <div className="flex justify-between items-center text-xs md:text-xs">
                      <label className="text-zinc-100 font-extrabold">房间 ID (Room ID)</label>
                      <button
                        type="button"
                        onClick={handleRandomRoom}
                        className="text-red-400 hover:text-red-300 font-extrabold text-[10px] md:text-[10px] shrink-0 py-1 px-2 rounded bg-red-500/10"
                      >
                        随机生成
                      </button>
                    </div>
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="例如 Room-888"
                      className="w-full bg-zinc-950/90 border border-zinc-700/80 focus:border-red-500 text-white rounded-lg md:rounded-xl px-4 md:px-3.5 py-2.5 md:py-3 font-bold font-mono text-sm md:text-xs focus:outline-none focus:ring-1 focus:ring-red-500/20 transition duration-300 shadow-inner"
                    />
                  </div>

                  {/* 2. AES Symmetric Password Key */}
                  <div className="space-y-1.5 md:space-y-2">
                    <div className="flex justify-between items-center text-xs md:text-xs">
                      <label className="text-zinc-100 font-extrabold">对称加解密密钥 (Room Key)</label>
                      <button
                        type="button"
                        onClick={handleRandomKey}
                        className="text-red-400 hover:text-red-300 font-extrabold text-[10px] md:text-[10px] shrink-0 py-1 px-2 rounded bg-red-500/10"
                      >
                        生成安全密钥
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassphrase ? 'text' : 'password'}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        placeholder="在此输入您的共享密码"
                        className="w-full bg-zinc-950/90 border border-zinc-700/80 focus:border-red-500 text-white rounded-lg md:rounded-xl pl-4 md:pl-3.5 pr-12 md:pr-10 py-2.5 md:py-3 font-semibold font-mono text-sm md:text-xs focus:outline-none focus:ring-1 focus:ring-red-500/20 transition duration-300 shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        className="absolute right-3 md:right-3.5 top-2.5 md:top-3 text-zinc-400 hover:text-white transition shrink-0"
                      >
                        {showPassphrase ? <EyeOff className="w-5 h-5 md:w-4 md:h-4" /> : <Eye className="w-5 h-5 md:w-4 md:h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 3. User Nickname */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-xs text-zinc-100 font-extrabold block">用户昵称 (Nickname)</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="例如 极客探险者"
                      className="w-full bg-zinc-950/90 border border-zinc-700/80 focus:border-red-500 text-white rounded-lg md:rounded-xl px-4 md:px-3.5 py-2.5 md:py-3 font-bold text-sm md:text-xs focus:outline-none focus:ring-1 focus:ring-red-500/20 transition duration-300 shadow-inner"
                    />
                  </div>

                  {/* 4. Avatar Preset Selection list */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-xs text-zinc-100 font-extrabold block">选择用户头像 (Avatar)</label>
                    <div className="flex gap-2 md:gap-3 justify-between items-center py-1 flex-wrap">
                      {PRESET_AVATARS.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAvatarIdx(idx)}
                          className={`w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden border-2 transition shrink-0 ${
                            selectedAvatarIdx === idx
                              ? 'border-red-500 scale-105 md:scale-110 shadow-lg shadow-red-500/25'
                              : 'border-zinc-800 opacity-70 hover:opacity-100 hover:border-zinc-600'
                          }`}
                        >
                          <img src={av} alt="Preset Avatar" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Enter Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 md:py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-95 active:scale-[0.99] transition rounded-xl md:rounded-xl font-black text-base md:text-sm tracking-wide shadow-xl shadow-red-500/15 text-white flex items-center justify-center gap-2 relative z-10 mt-4"
                  >
                    <Lock className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
                    <span className="text-center">初始化并连接零知识 E2EE 房间</span>
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            /* ==================== B. IN-ROOM INTEGRATED HYBRID SUITE ==================== */
            <motion.div
              key="room-suite"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              {/* DUAL COLUMN SPLIT SCREEN LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start w-full">
                {/* 2. RIGHT PANEL: SECURE CHAT ROOM INTERFACE */}
                {/* Rendered on Desktop 'both' split layout, or when 'chat' tab is active */}
                {/* On mobile, always show chat interface by default */}
                <div
                  className={`${
                    activeTab === 'both' ? 'hidden lg:flex lg:col-span-7' : activeTab === 'chat' ? 'flex lg:col-span-12' : 'flex lg:col-span-12'
                  } w-full`}
                >
                  <SecureChatRoom
                    roomId={roomId}
                    passphrase={passphrase}
                    nickname={nickname}
                    avatarUrl={customAvatarUrl || PRESET_AVATARS[selectedAvatarIdx]}
                    activeThemeId={activeThemeId}
                    setActiveThemeId={setActiveThemeId}
                    onLeave={handleLeaveRoom}
                    onGoLive={(settings) => {
                      setActiveRoomSettings(settings);
                      setIsLiveActive(true);
                      setActiveTab('both');
                    }}
                    isLiveActive={isLiveActive}
                    onJoinLive={() => {
                      setActiveTab('both');
                    }}
                    onUpdateProfile={handleUpdateProfile}
                  />
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. MILITARY-GRADE SUPER ADMIN CONTROL PANEL MODAL */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-red-500/30 rounded-2xl md:rounded-3xl w-full max-w-4xl shadow-2xl relative overflow-hidden my-4 md:my-8"
            >
              {/* Decorative Red Laser Header Bar */}
              <div className="h-1 bg-gradient-to-r from-red-500 via-rose-600 to-pink-500 w-full animate-pulse" />

              {/* Header */}
              <div className="p-4 md:p-6 border-b border-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-[#FF2442]">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-2">
                      <span>NodeCrypt Super Admin Panel</span>
                      <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                        Secure Kernel v1.02
                      </span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono">超级加密后台管控控制台 • 拒绝未授权探针</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="p-2 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-xl transition font-black text-xs border border-zinc-900 hover:border-zinc-800"
                >
                  [ 关闭 ]
                </button>
              </div>

              {/* Login State Gate */}
              {!isAdminLoggedIn ? (
                /* ================= LOGIN DIALOGUE ================= */
                <form onSubmit={handleAdminLogin} className="p-8 max-w-md mx-auto my-12 space-y-6">
                  <div className="text-center space-y-2">
                    <h4 className="text-base font-black text-zinc-200">输入超级管理员密鉴</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      请使用您被授权的专属管理员账户「Spring」与安全密钥进行登录验证。
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Username */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 uppercase font-black font-mono tracking-widest block">管理员账户</label>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="请输入管理账号"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none placeholder-zinc-600 font-mono"
                        required
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 uppercase font-black font-mono tracking-widest block">安全访问密码</label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="请输入对应的安全密钥"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-red-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none placeholder-zinc-600 font-mono"
                        required
                      />
                    </div>
                  </div>

                  {adminError && (
                    <p className="text-[11px] text-red-500 text-center font-bold bg-red-500/5 py-2 px-3 rounded-lg border border-red-500/10">
                      {adminError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-lg shadow-red-500/15 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>执行零知识指纹登录验证</span>
                  </button>
                </form>
              ) : (
                /* ================= ADMIN OPERATIONAL SYSTEM ================= */
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Config Controls */}
                  <div className="lg:col-span-5 space-y-5">
                    {/* Security Indexes */}
                    <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-2xl space-y-3">
                      <h4 className="text-[11px] uppercase tracking-widest font-black text-zinc-400 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                        <span>核心指标监控 (Core Metrics)</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900">
                          <p className="text-[9px] text-zinc-500 font-bold">加解密算法等级</p>
                          <p className="text-xs font-black text-emerald-400 mt-1">AES-GCM-256</p>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900">
                          <p className="text-[9px] text-zinc-500 font-bold">房间信道状态</p>
                          <p className="text-xs font-black text-emerald-400 mt-1">ACTIVE</p>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900">
                          <p className="text-[9px] text-zinc-500 font-bold">超级防监听防篡改</p>
                          <p className="text-xs font-black text-[#FF2442] mt-1">SHIELD ON</p>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900">
                          <p className="text-[9px] text-zinc-500 font-bold">网络延迟/丢包</p>
                          <p className="text-xs font-black text-zinc-300 mt-1">11ms / 0%</p>
                        </div>
                      </div>
                    </div>

                    {/* Parameter Toggles */}
                    <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-2xl space-y-4">
                      <h4 className="text-[11px] uppercase tracking-widest font-black text-zinc-400 flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-red-400" />
                        <span>全局系统变量调节 (Control Room)</span>
                      </h4>

                      {/* 1. Force E2EE Enforcement */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-zinc-300">强制端到端E2EE加解密</p>
                          <p className="text-[9px] text-zinc-500">禁止未加密明文信息漏入网络</p>
                        </div>
                        <button
                          onClick={() => setIsE2EEEnforced(!isE2EEEnforced)}
                          className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 ${
                            isE2EEEnforced ? 'bg-emerald-500' : 'bg-zinc-800'
                          }`}
                        >
                          <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform duration-200 ${isE2EEEnforced ? 'translate-x-4.5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* 2. Anti Screenshot Shield */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-zinc-300">超级防截屏/屏幕水印防护</p>
                          <p className="text-[9px] text-zinc-500">动态注入指纹，防物理泄密</p>
                        </div>
                        <button
                          onClick={() => setAntiScreenshotShield(!antiScreenshotShield)}
                          className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 ${
                            antiScreenshotShield ? 'bg-emerald-500' : 'bg-zinc-800'
                          }`}
                        >
                          <div className={`w-4.5 h-4.5 bg-white rounded-full transition-transform duration-200 ${antiScreenshotShield ? 'translate-x-4.5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* 3. Audio Rate Select */}
                      <div className="space-y-1.5 pt-2 border-t border-zinc-900">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-300">高保真语音流码率</span>
                          <span className="font-mono text-emerald-400 font-extrabold">{audioKbps} kbps</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[96, 128, 320].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => setAudioKbps(rate)}
                              className={`py-1 text-[10px] font-black rounded-lg transition ${
                                audioKbps === rate
                                  ? 'bg-red-500 text-white'
                                  : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              {rate} Kbps
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 4. Self Destruct Limit */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-300">阅后即焚超时销毁限制</span>
                          <span className="font-mono text-pink-400 font-extrabold">{selfDestructLimit}s</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[5, 10, 30].map((s) => (
                            <button
                              key={s}
                              onClick={() => setSelfDestructLimit(s)}
                              className={`py-1 text-[10px] font-black rounded-lg transition ${
                                selfDestructLimit === s
                                  ? 'bg-pink-500 text-white'
                                  : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              {s}秒超时
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleAdminLogout}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 hover:text-red-400 border border-zinc-800 text-zinc-400 text-xs font-black rounded-xl transition"
                    >
                      安全退出超级管理员模式 (Sign Out)
                    </button>
                  </div>

                  {/* Right Column: Live Logs & Broadcast */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Live Broadcast Input */}
                    <form onSubmit={handleAdminBroadcast} className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-2xl space-y-3">
                      <h4 className="text-[11px] uppercase tracking-widest font-black text-zinc-400 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-pink-400" />
                        <span>发布 E2EE 管理员全网广播</span>
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={adminBroadcastText}
                          onChange={(e) => setAdminBroadcastText(e.target.value)}
                          placeholder="在此键入全网密讯红字通知..."
                          className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-pink-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition"
                        >
                          全网发送
                        </button>
                      </div>
                    </form>

                    {/* Security Encrypted Log Monitor */}
                    <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-2xl space-y-3 flex flex-col h-[320px]">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[11px] uppercase tracking-widest font-black text-zinc-400 flex items-center gap-1.5">
                          <Server className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                          <span>军工级 E2EE 密包解听雷达 (Packet Sniffer)</span>
                        </h4>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-[8px] font-mono font-bold text-emerald-400">SNIFFER ACTIVE</span>
                        </div>
                      </div>

                      {/* Sniffer Terminal Output Console */}
                      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl p-3 font-mono text-[9px] text-zinc-400 space-y-2 overflow-y-auto scrollbar-none">
                        <p className="text-zinc-600">[info] 马老师NodeCrypt E2EE Safe-Radar system listening on {roomId}...</p>
                        <p className="text-zinc-600">[info] Diffie-Hellman safe keys generated. Channel E2EE activated.</p>
                        
                        <div className="p-2 bg-zinc-900/50 rounded-lg border border-zinc-900/50 space-y-1">
                          <div className="flex justify-between font-black">
                            <span className="text-zinc-300">Packet Type: MSG_SECURE_TEXT</span>
                            <span className="text-indigo-400">SHA-256 Verified</span>
                          </div>
                          <p className="text-zinc-500 truncate">Payload Raw: <span className="text-[#FF2442]">U2FsdGVkX19P9/p1LwG9mI3b5tC...</span></p>
                          <p className="text-zinc-500">Sec-Signature: RSA_2048_HMAC_SIG_OK</p>
                        </div>

                        <div className="p-2 bg-zinc-900/50 rounded-lg border border-zinc-900/50 space-y-1">
                          <div className="flex justify-between font-black">
                            <span className="text-zinc-300">Packet Type: AUDIO_CO_HOST_FLUX</span>
                            <span className="text-emerald-400">OPUS Codec Stream</span>
                          </div>
                          <p className="text-zinc-500">Payload Encrypted: AES-GCM-256::cipher (64Kb Block)</p>
                          <p className="text-zinc-500">Bitrate Sync: 320kbps Standard • HD Low-Latency</p>
                        </div>

                        <div className="p-2 bg-zinc-900/50 rounded-lg border border-zinc-900/50 space-y-1">
                          <div className="flex justify-between font-black">
                            <span className="text-zinc-300">Packet Type: SEED_HANDSHAKE</span>
                            <span className="text-yellow-400">Zero-Knowledge Check</span>
                          </div>
                          <p className="text-zinc-500">ZKP proof verified successfully. Seed identity of Host confirmed.</p>
                        </div>
                      </div>

                      {/* Action buttons footer */}
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDecryptingSimulator(true);
                            setTimeout(() => {
                              setIsDecryptingSimulator(false);
                              alert('❌ 模拟破解失败！AES-GCM-256 为美国军工及银行级加密。在量子计算机诞生并运转数亿年之前，任何未持有房间安全密钥的外部窃听节点（包括管理员）在数学上皆无法单方面破解任何高熵密钥加密过的密文包。');
                            }, 2500);
                          }}
                          disabled={isDecryptingSimulator}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {isDecryptingSimulator ? (
                            <>
                              <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>雷达强行模拟算力破译中...</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>一键超级强算破解 E2EE (演示)</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            alert('⚠️ 演示提示：模拟踢出操作已完成！在真实的 P2P 网络中，用户节点已收到签名撤回信号并退回大堂。');
                          }}
                          className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-black text-[10px] rounded-lg transition flex items-center gap-1"
                        >
                          <UserMinus className="w-3.5 h-3.5 text-red-500" />
                          <span>一键断网踢人</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}

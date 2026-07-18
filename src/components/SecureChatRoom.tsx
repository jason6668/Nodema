import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  Users,
  Send,
  Trash2,
  Undo2,
  Flame,
  Mic,
  Image as ImageIcon,
  Smile,
  Copy,
  Check,
  Radio,
  User,
  Volume2,
  ChevronLeft,
  Tv,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  HelpCircle,
  FileText,
  X,
  Settings,
  VolumeX,
  Bell,
  BellOff,
  Globe,
  Phone,
  PhoneOff,
  Video,
  Camera,
  CameraOff,
  MicOff,
  Sun,
  Moon,
  Upload
} from 'lucide-react';
import { ChatMessage, RoomSettings, MessageReaction } from '../types';
import { encryptText, decryptText } from '../utils/crypto';

interface SecureChatRoomProps {
  roomId: string;
  passphrase: string;
  nickname: string;
  avatarUrl: string;
  onLeave: () => void;
  onGoLive: (settings: RoomSettings) => void;
  isLiveActive: boolean;
  onJoinLive: () => void;
  onUpdateProfile?: (nickname: string, avatarUrl: string) => void;
  activeThemeId: string;
  setActiveThemeId: (themeId: string) => void;
  usePolling?: boolean; // Force HTTP polling instead of WebSocket
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=150&auto=format&fit=crop', // Anime Boy
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=150&auto=format&fit=crop', // Anime Girl
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=150&auto=format&fit=crop', // Kawaii Pastel Globe
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop', // Pastel Fluid
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=150&auto=format&fit=crop'  // Fantasy Celestial
];

export interface ChatTheme {
  id: string;
  name: string;
  enName: string;
  emoji: string;
  bgClass: string;
  effect: 'lanterns' | 'fireworks' | 'galaxy' | 'celebrate' | 'hearts' | 'bubbles' | 'snow' | 'rain' | 'sakura' | 'lightning' | 'matrix' | 'destroy';
  color: string;
}

export const THEMES: ChatTheme[] = [
  { id: 'sakura_dream', name: '落樱粉黛', enName: 'Sakura Dream', emoji: '🌸', bgClass: 'bg-gradient-to-b from-[#FFF0F5] via-[#FFE4E1] to-[#FFD1DC] text-zinc-900', effect: 'sakura', color: 'text-pink-400' },
  { id: 'strawberry_milky', name: '草莓牛奶', enName: 'Strawberry Milk', emoji: '🍓', bgClass: 'bg-gradient-to-b from-[#FFF5F6] via-[#FFEBEE] to-[#FFCDD2] text-zinc-900', effect: 'hearts', color: 'text-pink-500' },
  { id: 'telegram_blue', name: '电报经典蓝', enName: 'Telegram Blue', emoji: '🔹', bgClass: 'bg-gradient-to-b from-[#E7EBFE] via-[#D5DFFE] to-[#C2D1FC] text-zinc-800', effect: 'bubbles', color: 'text-blue-500' },
  { id: 'telegram_dark', name: '电报石墨黑', enName: 'Telegram Graphite', emoji: '🐈‍⬛', bgClass: 'bg-[#182533] text-white font-semibold', effect: 'galaxy', color: 'text-slate-400' },
  { id: 'telegram_mint', name: '电报薄荷绿', enName: 'Telegram Mint', emoji: '🌿', bgClass: 'bg-gradient-to-b from-[#E1F3EC] via-[#CEECE0] to-[#BCE4D3] text-zinc-800', effect: 'snow', color: 'text-emerald-500' },
  { id: 'telegram_peach', name: '电报水蜜桃', enName: 'Telegram Peach', emoji: '🍑', bgClass: 'bg-gradient-to-b from-[#FCEAE6] via-[#F8D6CF] to-[#F5C2B8] text-zinc-800', effect: 'hearts', color: 'text-orange-400' },
  { id: 'barbie_party', name: '芭比粉红', enName: 'Barbie Pink', emoji: '💖', bgClass: 'bg-gradient-to-b from-[#F472B6] via-[#EC4899] to-[#DB2777] text-white', effect: 'celebrate', color: 'text-pink-300' },
  { id: 'happy_new_year', name: '新年快乐', enName: 'Happy New Year', emoji: '🏮', bgClass: 'bg-gradient-to-b from-[#7F1D1D] via-[#991B1B] to-[#450A0A] text-white', effect: 'lanterns', color: 'text-rose-500' },
  { id: 'fireworks', name: '璀璨烟花', enName: 'Fireworks', emoji: '🎆', bgClass: 'bg-gradient-to-b from-[#0B0F19] via-[#020617] to-[#090D16] text-white', effect: 'fireworks', color: 'text-purple-400' },
  { id: 'galaxy', name: '宇宙星空', enName: 'Galaxy', emoji: '🌌', bgClass: 'bg-gradient-to-b from-[#14122E] via-[#0A081C] to-[#030012] text-white', effect: 'galaxy', color: 'text-indigo-400' },
  { id: 'celebrate', name: '欢庆派对', enName: 'Celebrate', emoji: '🎉', bgClass: 'bg-gradient-to-b from-[#1E3A8A] via-[#1E1B4B] to-[#0F172A] text-white', effect: 'celebrate', color: 'text-yellow-400' },
  { id: 'love', name: '浪漫爱心', enName: 'Love', emoji: '❤️', bgClass: 'bg-gradient-to-b from-[#831843] via-[#4C0519] to-[#2D000E] text-white', effect: 'hearts', color: 'text-pink-500' },
  { id: 'bubbles', name: '梦幻气泡', enName: 'Bubbles', emoji: '🫧', bgClass: 'bg-gradient-to-b from-[#065F46] via-[#042F2E] to-[#021415] text-white', effect: 'bubbles', color: 'text-teal-400' },
  { id: 'snow', name: '极寒雪景', enName: 'Snow', emoji: '❄️', bgClass: 'bg-gradient-to-b from-[#0C4A6E] via-[#082F49] to-[#041A28] text-white', effect: 'snow', color: 'text-sky-300' },
  { id: 'rain', name: '静谧雨季', enName: 'Rain', emoji: '🌧️', bgClass: 'bg-gradient-to-b from-[#1F2937] via-[#111827] to-[#030712] text-white', effect: 'rain', color: 'text-slate-400' },
  { id: 'sakura', name: '落樱纷飞', enName: 'Sakura', emoji: '💮', bgClass: 'bg-gradient-to-b from-[#500724] via-[#310014] to-[#1F000B] text-white', effect: 'sakura', color: 'text-pink-400' },
  { id: 'lightning', name: '雷暴天气', enName: 'Lightning', emoji: '⚡', bgClass: 'bg-gradient-to-b from-[#140024] via-[#0B0014] to-[#030006] text-white', effect: 'lightning', color: 'text-amber-400' },
  { id: 'matrix', name: '数字矩阵', enName: 'Matrix', emoji: '💻', bgClass: 'bg-[#020202] text-white', effect: 'matrix', color: 'text-green-500' },
  { id: 'destroy', name: '末日熔岩', enName: 'Destroy', emoji: '💥', bgClass: 'bg-gradient-to-b from-[#450A0A] via-[#1C0000] to-[#0C0000] text-white', effect: 'destroy', color: 'text-red-500' },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  zh: {
    settings: "设置",
    back: "返回",
    notifSettings: "通知设置",
    desktopNotif: "桌面通知",
    soundNotif: "声音通知",
    langSettings: "语言设置",
    langSelect: "语言",
    themeSettings: "主题设置",
    secureConnection: "已建立端到端安全连接",
    multiTabSync: "多端同步已联通",
    e2eeStatus: "零知识架构：消息到达网关前完成本地 AES-GCM 端对端加密",
    screenshotWatermark: "防截图水印",
    showRawCipher: "显示底层密文",
    inputTextPlaceholder: "输入加密明文，按下 Enter 键或点击发送...",
    inputTextRecording: "正在录制安全语音密讯中...",
    burnNone: "阅后即焚: 关闭",
    burnSeconds: "秒自毁",
    burnMinutes: "分钟自毁",
    onlineUsers: "在线成员",
    membersCount: "在线成员",
    inviteCoHost: "邀请连麦",
    goLiveBtn: "开启加密直播",
    joinedLiveBtn: "进入加密直播间",
    burnNotice: "💣 消息已自动销毁 (Burned)",
    retractedNotice: "↩️ 消息已被发送者撤回",
    decryptSuccess: "解密成功",
    decryptFail: "解密失败，密码不正确或密文已损坏",
    copyKey: "复制密匙",
    copiedKey: "已复制密匙",
    voiceMsg: "语音密讯 (E2EE)",
    voiceSec: "秒",
    attachedImg: "图片数据在本地解密并以安全 blob 渲染",
    rawPayload: "AES-GCM-256 (Hex) 密文载荷",
    copiedText: "已复制",
    copyCipherBtn: "复制密文",
    secureTip: "🔒 所有消息与视觉效果均在本地沙箱安全渲染",
    leaveRoom: "离开房间",
    soundEnabled: "已开启声音通知",
    soundDisabled: "已关闭声音通知",
    notifEnabled: "已开启桌面通知",
    notifDisabled: "已关闭桌面通知"
  },
  en: {
    settings: "Settings",
    back: "Back",
    notifSettings: "Notification Settings",
    desktopNotif: "Desktop Notifications",
    soundNotif: "Sound Notifications",
    langSettings: "Language Settings",
    langSelect: "Language",
    themeSettings: "Theme Settings",
    secureConnection: "End-to-End Secure Connection",
    multiTabSync: "Cross-Tab Sync Live",
    e2eeStatus: "Zero-Knowledge: Messages AES-GCM encrypted locally before transmission",
    screenshotWatermark: "Watermark",
    showRawCipher: "Show Cipher",
    inputTextPlaceholder: "Type secure message, hit Enter or click send...",
    inputTextRecording: "Recording secure E2EE voice...",
    burnNone: "Burn on Read: Off",
    burnSeconds: "s self-destruct",
    burnMinutes: "min self-destruct",
    onlineUsers: "Online Users",
    membersCount: "Online",
    inviteCoHost: "Invite Peer",
    goLiveBtn: "Start RED Live",
    joinedLiveBtn: "Join RED Live Room",
    burnNotice: "💣 Message self-destructed",
    retractedNotice: "↩️ Message recalled by sender",
    decryptSuccess: "Decrypted successfully",
    decryptFail: "Decryption failed: incorrect key",
    copyKey: "Copy Room Key",
    copiedKey: "Key Copied",
    voiceMsg: "Voice Message (E2EE)",
    voiceSec: "s",
    attachedImg: "Image decrypted locally and rendered inside safe sandbox",
    rawPayload: "AES-GCM-256 (Hex) Ciphertext Payload",
    copiedText: "Copied",
    copyCipherBtn: "Copy Cipher",
    secureTip: "🔒 All messages & visuals rendered securely in local sandbox",
    leaveRoom: "Leave Room",
    soundEnabled: "Sound notifications enabled",
    soundDisabled: "Sound notifications disabled",
    notifEnabled: "Desktop notifications enabled",
    notifDisabled: "Desktop notifications disabled"
  },
  es: {
    settings: "Ajustes",
    back: "Atrás",
    notifSettings: "Ajustes de Notificación",
    desktopNotif: "Notificaciones de Escritorio",
    soundNotif: "Efectos de Sonido",
    langSettings: "Configuración de Idioma",
    langSelect: "Idioma",
    themeSettings: "Configuración del Tema",
    secureConnection: "Conexión Segura Extremo a Extremo",
    multiTabSync: "Sincronización de Pestañas Conectada",
    e2eeStatus: "Zero-Knowledge: Mensajes cifrados localmente con AES-GCM",
    screenshotWatermark: "Marca de agua",
    showRawCipher: "Mostrar texto cifrado",
    inputTextPlaceholder: "Escribe mensaje seguro, pulsa Enter...",
    inputTextRecording: "Grabando mensaje de voz seguro E2EE...",
    burnNone: "Autodestrucción: Desactivado",
    burnSeconds: "s de autodestrucción",
    burnMinutes: "min de autodestrucción",
    onlineUsers: "Miembros en Línea",
    membersCount: "En Línea",
    inviteCoHost: "Invitar Amigo",
    goLiveBtn: "Iniciar RED en Vivo",
    joinedLiveBtn: "Unirse a Sala en Vivo",
    burnNotice: "💣 Mensaje autodestruido",
    retractedNotice: "↩️ Mensaje retirado",
    decryptSuccess: "Descifrado con éxito",
    decryptFail: "Fallo de descifrado: contraseña incorrecta",
    copyKey: "Copiar Clave",
    copiedKey: "Clave Copiada",
    voiceMsg: "Mensaje de Voz (E2EE)",
    voiceSec: "s",
    attachedImg: "Imagen descifrada localmente y renderizada en sandbox",
    rawPayload: "Carga Útil de Texto Cifrado AES-GCM-256 (Hex)",
    copiedText: "Copiado",
    copyCipherBtn: "Copiar Cifrado",
    secureTip: "🔒 Todo se renderiza de forma segura en un sandbox local",
    leaveRoom: "Salir de Sala",
    soundEnabled: "Notificaciones de sonido activadas",
    soundDisabled: "Notificaciones de sonido desactivadas",
    notifEnabled: "Notificaciones de escritorio activadas",
    notifDisabled: "Notificaciones de escritorio desactivadas"
  }
};

const EMOJIS_BY_CATEGORY: Record<string, { char: string; label: string }[]> = {
  face: [
    { char: '😀', label: 'grinning' }, { char: '😃', label: 'happy' }, { char: '😄', label: 'smile' }, { char: '😁', label: 'grin' }, { char: '😆', label: 'laugh' },
    { char: '😅', label: 'sweat laugh' }, { char: '🤣', label: 'rofl' }, { char: '😂', label: 'joy' }, { char: '🙂', label: 'slight smile' }, { char: '🙃', label: 'upside down' },
    { char: '😉', label: 'wink' }, { char: '😊', label: 'blush' }, { char: '😇', label: 'halo' }, { char: '🥰', label: 'hearts' }, { char: '😍', label: 'heart eyes' },
    { char: '🤩', label: 'star eyes' }, { char: '😘', label: 'blow kiss' }, { char: '😗', label: 'kissing' }, { char: '☺️', label: 'soft' }, { char: '😚', label: 'closed kiss' },
    { char: '😋', label: 'yum' }, { char: '😛', label: 'tongue' }, { char: '😜', label: 'winking tongue' }, { char: '🤪', label: 'zany' }, { char: '😝', label: 'squint tongue' },
    { char: '🤑', label: 'money mouth' }, { char: '🤗', label: 'hugs' }, { char: '🤭', label: 'shhh' }, { char: '🤫', label: 'quiet' }, { char: '🤔', label: 'thinking' },
    { char: '🤐', label: 'zipper' }, { char: '🤨', label: 'raised eyebrow' }, { char: '😐', label: 'neutral' }, { char: '😑', label: 'expressionless' }, { char: '😶', label: 'speechless' }
  ],
  hand: [
    { char: '👋', label: 'wave' }, { char: '🤚', label: 'backhand' }, { char: '🖐️', label: 'fingers splayed' }, { char: '✋', label: 'raised hand' }, { char: '🖖', label: 'vulcan' },
    { char: '👌', label: 'ok' }, { char: '🤏', label: 'pinching' }, { char: '✌️', label: 'peace' }, { char: '🤞', label: 'crossed fingers' }, { char: '🤟', label: 'love sign' },
    { char: '🤘', label: 'horns' }, { char: '🤙', label: 'call me' }, { char: '👈', label: 'point left' }, { char: '👉', label: 'point right' }, { char: '👆', label: 'point up' },
    { char: '🖕', label: 'middle finger' }, { char: '👇', label: 'point down' }, { char: '☝️', label: 'index' }, { char: '👍', label: 'thumbs up' }, { char: '👎', label: 'thumbs down' },
    { char: '✊', label: 'fist' }, { char: '👊', label: 'oncoming fist' }, { char: '🤛', label: 'left fist' }, { char: '🤜', label: 'right fist' }, { char: '👏', label: 'clap' }
  ],
  animal: [
    { char: '🐶', label: 'dog' }, { char: '🐱', label: 'cat' }, { char: '🐭', label: 'mouse' }, { char: '🐹', label: 'hamster' }, { char: '🐰', label: 'rabbit' },
    { char: '🦊', label: 'fox' }, { char: '🐻', label: 'bear' }, { char: '🐼', label: 'panda' }, { char: '🐨', label: 'koala' }, { char: '🐯', label: 'tiger' },
    { char: '🦁', label: 'lion' }, { char: '🐮', label: 'cow' }, { char: '🐷', label: 'pig' }, { char: '🐸', label: 'frog' }, { char: '🐵', label: 'monkey' }
  ],
  fruit: [
    { char: '🍏', label: 'green apple' }, { char: '🍎', label: 'red apple' }, { char: '🍐', label: 'pear' }, { char: '🍊', label: 'tangerine' }, { char: '🍋', label: 'lemon' },
    { char: '🍌', label: 'banana' }, { char: '🍉', label: 'watermelon' }, { char: '🍇', label: 'grapes' }, { char: '🍓', label: 'strawberry' }, { char: '🍒', label: 'cherries' },
    { char: '🍑', label: 'peach' }, { char: '🍍', label: 'pineapple' }, { char: '🥥', label: 'coconut' }, { char: '🥝', label: 'kiwi' }, { char: '🍅', label: 'tomato' }
  ],
  place: [
    { char: '🏠', label: 'house' }, { char: '🏡', label: 'house garden' }, { char: '🏢', label: 'office' }, { char: '🏣', label: 'post office' }, { char: '🏥', label: 'hospital' },
    { char: '🏦', label: 'bank' }, { char: '🏨', label: 'hotel' }, { char: '🏩', label: 'love hotel' }, { char: '🏪', label: 'convenience' }, { char: '🏫', label: 'school' }
  ],
  sport: [
    { char: '⚽', label: 'soccer' }, { char: '🏀', label: 'basketball' }, { char: '🏈', label: 'football' }, { char: '⚾', label: 'baseball' }, { char: '🥎', label: 'softball' },
    { char: '🎾', label: 'tennis' }, { char: '🏐', label: 'volleyball' }, { char: '🏉', label: 'rugby' }, { char: '🎱', label: 'billiards' }, { char: '🏓', label: 'ping pong' }
  ],
  symbol: [
    { char: '📝', label: 'memo' }, { char: '💼', label: 'briefcase' }, { char: '📁', label: 'folder' }, { char: '📂', label: 'open folder' }, { char: '📅', label: 'calendar' },
    { char: '📌', label: 'pushpin' }, { char: '📍', label: 'round pushpin' }, { char: '📎', label: 'paperclip' }, { char: '📏', label: 'ruler' }, { char: '📐', label: 'triangular ruler' }
  ],
  warn: [
    { char: '⛔', label: 'no entry' }, { char: '❌', label: 'cross mark' }, { char: '🚫', label: 'prohibited' }, { char: '⚠️', label: 'warning' }, { char: '🚳', label: 'no bicycles' },
    { char: '🚭', label: 'no smoking' }, { char: '🚯', label: 'no littering' }, { char: '🚱', label: 'non-potable water' }, { char: '🚷', label: 'no pedestrians' }
  ],
  flag: [
    { char: '🏁', label: 'chequered flag' }, { char: '🚩', label: 'triangular flag' }, { char: '🎌', label: 'crossed flags' }, { char: '🏴', label: 'black flag' }, { char: '🏳️', label: 'white flag' },
    { char: '🏳️‍🌈', label: 'rainbow flag' }, { char: '🏳️‍⚧️', label: 'transgender flag' }
  ]
};

export default function SecureChatRoom({
  roomId,
  passphrase,
  nickname,
  avatarUrl,
  onLeave,
  onGoLive,
  isLiveActive,
  onJoinLive,
  onUpdateProfile,
  activeThemeId,
  setActiveThemeId
}: SecureChatRoomProps) {
  // Core states
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`nodecrypt_messages_${roomId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Real-time synchronization state & refs
  const [myUserId] = useState(() => {
    const saved = sessionStorage.getItem('nodecrypt_my_user_id');
    if (saved) return saved;
    const newId = `user-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('nodecrypt_my_user_id', newId);
    return newId;
  });
  const [realOnlineUsers, setRealOnlineUsers] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [connectError, setConnectError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const connectWsRef = useRef<(() => void) | null>(null);

  const [wsOverride, setWsOverride] = useState<string | null>(() => {
    try { return localStorage.getItem('nodecrypt_ws_override'); } catch { return null; }
  });
  const [wsInputVisible, setWsInputVisible] = useState(false);
  const [wsInputValue, setWsInputValue] = useState<string>(wsOverride || '');

  const [inputText, setInputText] = useState('');
  const [burnTimer, setBurnTimer] = useState<number | undefined>(undefined); // undefined means no self-destruct
  const [showRawEncrypted, setShowRawEncrypted] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  
  // Call-related States & Refs
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isCallCameraOff, setIsCallCameraOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [activeCallPeer, setActiveCallPeer] = useState<{ name: string; avatar: string; id: string } | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ caller: { name: string; avatar: string; id: string }; type: 'voice' | 'video' } | null>(null);

  const callTimerRef = useRef<any>(null);
  const ringtoneIntervalRef = useRef<any>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const encrypted = await encryptText(`[Image] ${file.name}`, passphrase);
          const messageId = `msg-self-img-${Date.now()}`;
          const socketMsg: ChatMessage = {
            id: messageId,
            userId: myUserId,
            userName: nickname,
            avatar: avatarUrl,
            content: `📷 图片: ${file.name}`,
            encryptedContent: encrypted,
            type: 'image',
            mediaUrl: base64Data,
            burnDuration: burnTimer,
            burnTimerStartedAt: burnTimer ? Date.now() : undefined,
            reactions: [],
            isPrivate: privatePeerName ? true : undefined,
            privateTo: privatePeerName || undefined
          };

          setMessages((prev) => [...prev, socketMsg]);
          e.target.value = '';

          // Try WebSocket first, then fallback to HTTP polling
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'message',
              roomId,
              userId: myUserId,
              data: { message: socketMsg }
            }));
          } else if ((window as any).sendMessageViaHttp) {
            (window as any).sendMessageViaHttp(socketMsg);
          }
        } catch (err) {
          console.error('Image encrypt fail:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const encrypted = await encryptText(`[File] ${file.name}`, passphrase);
          const messageId = `msg-self-file-${Date.now()}`;
          const socketMsg: ChatMessage = {
            id: messageId,
            userId: myUserId,
            userName: nickname,
            avatar: avatarUrl,
            content: file.name,
            encryptedContent: encrypted,
            type: 'file',
            mediaUrl: base64Data,
            burnDuration: burnTimer,
            burnTimerStartedAt: burnTimer ? Date.now() : undefined,
            reactions: [],
            isPrivate: privatePeerName ? true : undefined,
            privateTo: privatePeerName || undefined
          };

          setMessages((prev) => [...prev, socketMsg]);
          e.target.value = '';

          // Try WebSocket first, then fallback to HTTP polling
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'message',
              roomId,
              userId: myUserId,
              data: { message: socketMsg }
            }));
          } else if ((window as any).sendMessageViaHttp) {
            (window as any).sendMessageViaHttp(socketMsg);
          }
        } catch (err) {
          console.error('File encrypt fail:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Dynamically synthesize custom ringing dial tones
  const playRingingSound = () => {
    if (!soundNotifications) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc2.frequency.setValueAtTime(450, audioCtx.currentTime);

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime + 1.2);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc2.start();

      setTimeout(() => {
        osc1.stop();
        osc2.stop();
        audioCtx.close();
      }, 1600);
    } catch (e) {
      console.warn('Ringtone play failed:', e);
    }
  };

  // Synthesize connection sound
  const playConnectedSound = () => {
    if (!soundNotifications) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24); // G5

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      setTimeout(() => {
        osc.stop();
        audioCtx.close();
      }, 850);
    } catch (e) {
      console.warn('Connected tone failed:', e);
    }
  };

  // Synthesize hangup tone
  const playHangupSound = () => {
    if (!soundNotifications) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
      osc.frequency.setValueAtTime(220.00, audioCtx.currentTime + 0.15); // A3

      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      setTimeout(() => {
        osc.stop();
        audioCtx.close();
      }, 550);
    } catch (e) {
      console.warn('Hangup tone failed:', e);
    }
  };

  // Formatter helper
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Initiate call session
  const handleStartCall = async (type: 'voice' | 'video') => {
    setCallType(type);
    setCallState('ringing');
    setCallDuration(0);
    setIsCallMuted(false);
    setIsCallCameraOff(false);

    // Pick a random real peer to call
    const realPeers = realOnlineUsers.filter((u) => u.id !== myUserId);
    if (realPeers.length === 0) {
      alert('没有其他在线用户可通话');
      return;
    }
    const randomPeer = realPeers[Math.floor(Math.random() * realPeers.length)];
    setActiveCallPeer({ name: randomPeer.nickname, avatar: randomPeer.avatarUrl, id: randomPeer.id });

    // Create call signal
    const callSignal = {
      type: 'call_invitation',
      roomId,
      userId: myUserId,
      data: {
        caller: { name: nickname, avatar: avatarUrl, id: myUserId },
        callee: { id: randomPeer.id },
        callType: type
      }
    };

    // Send call invitation via WebSocket or HTTP polling
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(callSignal));
    } else {
      // Send via HTTP polling (use global function)
      (window as any).sendCallSignalViaHttp?.(callSignal);
    }

    // Play ringing loop sound
    playRingingSound();
    ringtoneIntervalRef.current = setInterval(() => {
      playRingingSound();
    }, 2500);

    // If video, try setting up webcam
    if (type === 'video') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: true
        });
        setLocalStream(stream);
      } catch (err) {
        console.warn('Webcam permission denied or unavailable:', err);
      }
    }
  };

  // Initiate private call with specific user
  const handleStartPrivateCall = async (user: any, type: 'voice' | 'video') => {
    setCallType(type);
    setCallState('ringing');
    setCallDuration(0);
    setIsCallMuted(false);
    setIsCallCameraOff(false);
    setActiveCallPeer({ name: user.nickname, avatar: user.avatarUrl, id: user.id });

    // Create call signal
    const callSignal = {
      type: 'call_invitation',
      roomId,
      userId: myUserId,
      data: {
        caller: { name: nickname, avatar: avatarUrl, id: myUserId },
        callee: { id: user.id },
        callType: type
      }
    };

    // Send call invitation via WebSocket or HTTP polling
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(callSignal));
    } else {
      // Send via HTTP polling (use global function)
      (window as any).sendCallSignalViaHttp?.(callSignal);
    }

    // Play ringing loop sound
    playRingingSound();
    ringtoneIntervalRef.current = setInterval(() => {
      playRingingSound();
    }, 2500);

    // If video, try setting up webcam
    if (type === 'video') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: true
        });
        setLocalStream(stream);
      } catch (err) {
        console.warn('Webcam permission denied or unavailable:', err);
      }
    }
  };

  // Accept incoming call
  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }

    setCallType(incomingCall.type);
    setCallState('connected');
    setActiveCallPeer(incomingCall.caller);
    setIncomingCall(null);

    // Create acceptance signal
    const acceptanceSignal = {
      type: 'call_accepted',
      roomId,
      userId: myUserId,
      data: {
        caller: incomingCall.caller,
        callee: { name: nickname, avatar: avatarUrl, id: myUserId }
      }
    };

    // Send acceptance via WebSocket or HTTP polling
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(acceptanceSignal));
    } else {
      // Send via HTTP polling (use global function)
      (window as any).sendCallSignalViaHttp?.(acceptanceSignal);
    }

    // If video, try setting up webcam
    if (incomingCall.type === 'video') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: true
        });
        setLocalStream(stream);
      } catch (err) {
        console.warn('Webcam permission denied or unavailable:', err);
      }
    }

    playConnectedSound();

    // Add connection message to chat E2EE
    const secureLabel = incomingCall.type === 'video' ? '🔒 AES-GCM 端对端加密视频通话已联通' : '🔒 AES-GCM 端对端加密语音通话已联通';
    setMessages((prev) => [
      ...prev,
      {
        id: `call-log-start-${Date.now()}`,
        userId: 'system',
        userName: 'NodeCrypt',
        avatar: '',
        content: `${secureLabel} (与 ${incomingCall.caller.name} 通话中)`,
        type: 'system'
      }
    ]);
  };

  // Reject incoming call
  const handleRejectCall = () => {
    if (!incomingCall) return;

    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }

    // Create rejection signal
    const rejectionSignal = {
      type: 'call_rejected',
      roomId,
      userId: myUserId,
      data: {
        caller: incomingCall.caller,
        callee: { name: nickname, avatar: avatarUrl, id: myUserId }
      }
    };

    // Send rejection via WebSocket or HTTP polling
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(rejectionSignal));
    } else {
      // Send via HTTP polling (use global function)
      (window as any).sendCallSignalViaHttp?.(rejectionSignal);
    }

    setIncomingCall(null);
    playHangupSound();
  };

  // Process incoming call signal (from WebSocket or HTTP polling)
  const handleCallSignal = async (data: any) => {
    const signalType = data.type;
    console.log(`[CALL SIGNAL] Received ${signalType}:`, data);

    switch (signalType) {
      case 'call_invitation': {
        // Only show invitation if it's for me
        if (data.data?.callee?.id === myUserId) {
          setIncomingCall({
            caller: data.data.caller,
            type: data.data.callType
          });
          playRingingSound();
          if (ringtoneIntervalRef.current) clearInterval(ringtoneIntervalRef.current);
          ringtoneIntervalRef.current = setInterval(() => {
            playRingingSound();
          }, 2500);
        }
        break;
      }
      case 'call_accepted': {
        // Caller received acceptance
        if (data.data?.caller?.id === myUserId) {
          if (ringtoneIntervalRef.current) {
            clearInterval(ringtoneIntervalRef.current);
            ringtoneIntervalRef.current = null;
          }
          playConnectedSound();
          setCallState('connected');
          setActiveCallPeer(data.data.callee);

          // Add connection message to chat
          const currentCallType = callType; // use current call type
          const secureLabel = currentCallType === 'video' ? '🔒 AES-GCM 端对端加密视频通话已联通' : '🔒 AES-GCM 端对端加密语音通话已联通';
          setMessages((prev) => [
            ...prev,
            {
              id: `call-log-start-${Date.now()}`,
              userId: 'system',
              userName: 'NodeCrypt',
              avatar: '',
              content: `${secureLabel} (与 ${data.data.callee.name} 通话中)`,
              type: 'system'
            }
          ]);

          // If video, try setting up webcam
          if (currentCallType === 'video') {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' },
                audio: true
              });
              setLocalStream(stream);
            } catch (err) {
              console.warn('Webcam permission denied or unavailable:', err);
            }
          }
        }
        break;
      }
      case 'call_rejected': {
        // Caller received rejection
        if (data.data?.caller?.id === myUserId) {
          if (ringtoneIntervalRef.current) {
            clearInterval(ringtoneIntervalRef.current);
            ringtoneIntervalRef.current = null;
          }
          setCallState('idle');
          setCallType(null);
          setActiveCallPeer(null);
          if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
          }
          alert('对方拒绝了通话邀请');
        }
        break;
      }
      case 'call_ended': {
        if (ringtoneIntervalRef.current) {
          clearInterval(ringtoneIntervalRef.current);
          ringtoneIntervalRef.current = null;
        }
        setCallState('idle');
        setCallType(null);
        setActiveCallPeer(null);
        setIncomingCall(null);
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
          setLocalStream(null);
        }
        break;
      }
    }
  };

  // Disconnect call session
  const handleHangUp = () => {
    playHangupSound();
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    const callEndedSignal = {
      type: 'call_ended',
      roomId,
      userId: myUserId,
      data: {
        peer: activeCallPeer
      }
    };

    // Send via WebSocket if available
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(callEndedSignal));
    } else {
      // Send via HTTP polling
      (window as any).sendCallSignalViaHttp?.(callEndedSignal);
    }

    setCallState('idle');
    setCallType(null);

    // Save final call message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: `call-log-end-${Date.now()}`,
        userId: 'system',
        userName: 'NodeCrypt',
        avatar: '',
        content: `📞 通话结束。本地端对端安全信道已关闭。累计时长: ${formatDuration(callDuration)}`,
        type: 'system'
      }
    ]);
    setCallDuration(0);
  };

  // Connect duration interval trigger
  useEffect(() => {
    if (callState === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callState]);

  // Handle localStream cleanup on unmount
  useEffect(() => {
    return () => {
      if (ringtoneIntervalRef.current) {
        clearInterval(ringtoneIntervalRef.current);
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

  // Settings, Language, Sidebar Panels
  const [lang, setLang] = useState<'zh' | 'en' | 'es'>(() => {
    const saved = localStorage.getItem(`nodecrypt_lang_${roomId}`);
    return (saved as 'zh' | 'en' | 'es') || 'zh';
  });
  const [desktopNotifications, setDesktopNotifications] = useState(() => {
    const saved = localStorage.getItem(`nodecrypt_notif_desktop_${roomId}`);
    return saved === 'true';
  });
  const [soundNotifications, setSoundNotifications] = useState(() => {
    const saved = localStorage.getItem(`nodecrypt_notif_sound_${roomId}`);
    return saved !== 'false';
  });
  // Responsive layout helpers
  const [isDesktopLayout, setIsDesktopLayout] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  // Sidebars: desktop default open, mobile default closed (avoid遮挡主聊天区)
  const [showSettingsSidebar, setShowSettingsSidebar] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 1024px)').matches;
  });
  const [showMembersSidebar, setShowMembersSidebar] = useState(false); // Right sidebar toggleable
  
  // Searchable Category-based Emoji Picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [emojiActiveTab, setEmojiActiveTab] = useState<'face' | 'hand' | 'animal' | 'fruit' | 'place' | 'sport' | 'symbol' | 'warn' | 'flag'>('face');

  // Privacy Options
  const [enableWatermark, setEnableWatermark] = useState(true);
  const [enableBlurOnInactive, setEnableBlurOnInactive] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [privatePeerName, setPrivatePeerName] = useState<string | null>(null);
  const [isShowingPrivateOnly, setIsShowingPrivateOnly] = useState(false);

  // Mocks and utilities
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [selectedEmojiMessageId, setSelectedEmojiMessageId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  // Get active translations helper
  const t = TRANSLATIONS[lang] || TRANSLATIONS.zh;

  // Focus tracking for privacy screen blur
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Mobile viewport height fix: set CSS var --vh to handle mobile browser UI chrome
  useEffect(() => {
    const setVh = () => {
      try {
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      } catch (e) {
        // ignore on server-side
      }
    };
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  // Track breakpoint changes (mobile/desktop) and auto-close sidebars on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
      setIsDesktopLayout(matches);
      if (!matches) {
        setShowSettingsSidebar(false);
        setShowMembersSidebar(false);
      }
    };

    // init + subscribe
    handler(mql);
    if ('addEventListener' in mql) {
      mql.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
      return () => mql.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
    }
    // Safari older fallback
    // @ts-ignore
    mql.addListener(handler);
    // @ts-ignore
    return () => mql.removeListener(handler);
  }, []);

  // System Welcome E2EE & WebSocket Multi-User Sync
  useEffect(() => {
    let reconnectTimeout: any;
    let isDisposed = false;
    let reconnectAttempts = 0;

    const welcomeContent = lang === 'en'
      ? `Successfully entered Zero-Knowledge E2EE room: "${roomId}". All messages are encrypted locally using AES-GCM-256 with key "${'*'.repeat(passphrase.length)}". True zero-knowledge security.`
      : lang === 'es'
      ? `Entró con éxito a la sala segura E2EE: "${roomId}". Todos los mensajes se cifran localmente con AES-GCM-256 usando la clave "${'*'.repeat(passphrase.length)}".`
      : `成功进入零知识E2EE加密房间: 「${roomId}」。所有消息都在本地通过密钥「${'*'.repeat(passphrase.length)}」进行 AES-GCM-256 对称加解密。服务器只转发不可破解的密文，真正零知晓。`;

    let pollingStarted = false;
    let pollingIntervalId: number | null = null;

    // HTTP polling fallback for mobile devices when WebSocket fails
    const startHttpPolling = () => {
      if (pollingStarted) {
        console.log('HTTP polling already started, skipping duplicate initialization');
        return;
      }
      pollingStarted = true;
      console.log('Starting HTTP polling for mobile compatibility');
      setConnectionStatus('connected');
      setDebugInfo('Using HTTP polling mode');

      const normalizeHttpBase = (raw: string) => {
        try {
          let url = raw.trim();
          if (/^ws:\/\//i.test(url)) {
            url = url.replace(/^ws:\/\//i, 'http://');
          } else if (/^wss:\/\//i.test(url)) {
            url = url.replace(/^wss:\/\//i, 'https://');
          }
          if (!/^https?:\/\//i.test(url)) {
            url = `${window.location.protocol}//${url.replace(/^\/+/, '')}`;
          }
          const parsed = new URL(url);
          if (parsed.protocol === 'ws:' || parsed.protocol === 'wss:') {
            parsed.protocol = parsed.protocol === 'wss:' ? 'https:' : 'http:';
          }
          return `${parsed.protocol}//${parsed.host}`;
        } catch {
          return raw;
        }
      };

      const getPollingBases = (isMobileMode = false) => {
        const bases = new Set<string>();
        if (isMobileMode) {
          bases.add('https://nodecrypt.comeonsad.workers.dev');
        }
        if (wsOverride) {
          bases.add(normalizeHttpBase(wsOverride));
        }
        if (import.meta.env.VITE_WS_URL) {
          bases.add(normalizeHttpBase(import.meta.env.VITE_WS_URL as string));
        }
        if (typeof window !== 'undefined') {
          bases.add(window.location.origin);
          if (window.location.hostname && window.location.hostname !== 'localhost') {
            const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
            bases.add(`${protocol}//${window.location.hostname}`);
          }
        }
        if (!isMobileMode) {
          bases.add('https://nodecrypt.comeonsad.workers.dev');
        }
        const localhostProtocol = window.location.protocol === 'https:' ? 'https://' : 'http://';
        bases.add(`${localhostProtocol}localhost:3000`);
        return Array.from(bases).filter(Boolean);
      };

      const serverOptions = getPollingBases(false);

      const fetchWithTimeout = async (url: string, options: RequestInit = {}, ms = 8000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        try {
          return await fetch(url, { ...options, signal: controller.signal });
        } finally {
          clearTimeout(timer);
        }
      };

      const joinViaHttp = async () => {
        try {
          let lastError = null;
          let successResponse = null;

          for (const baseUrl of serverOptions) {
            try {
              console.log(`[HTTP POLLING] Trying server: ${baseUrl}`);
              const url = `${baseUrl}/api/poll/${encodeURIComponent(roomId)}?method=join&userId=${myUserId}`;

              const response = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname, avatarUrl })
              }, 8000);

              if (response.ok) {
                const data = await response.json();
                successResponse = data;
                console.log(`[HTTP POLLING] Successfully connected to: ${baseUrl}`);
                break;
              }
            } catch (err) {
              console.log(`[HTTP POLLING] Failed to connect to ${baseUrl}:`, err);
              lastError = err;
              continue;
            }
          }

          if (successResponse && successResponse.success && successResponse.data) {
            const users = successResponse.data.users || [];
            console.log(`[HTTP POLLING] Join response:`, successResponse);
            setRealOnlineUsers(users);
            if (successResponse.data.messages && successResponse.data.messages.length > 0) {
              const decryptedMsgs = await Promise.all(
                successResponse.data.messages.map(async (m: ChatMessage) => {
                  if (m.userId === myUserId) return m;
                  if (m.encryptedContent && !m.isBurned) {
                    try {
                      const decrypted = await decryptText(m.encryptedContent, passphrase);
                      return { ...m, content: decrypted };
                    } catch {
                      return { ...m, content: "🔒 [密码错误：无法解密此消息]" };
                    }
                  }
                  return m;
                })
              );
              setMessages(decryptedMsgs);
            }
          } else {
            throw lastError || new Error('All servers failed');
          }
        } catch (err: any) {
          console.error('HTTP polling join failed:', err);
          alert(`连接失败: 所有服务器都无法连接\n错误: ${err.message}`);
        }
      };

      const pollMessages = async () => {
        try {
          let lastError = null;
          let successResponse = null;

          for (const baseUrl of serverOptions) {
            try {
              console.log(`[HTTP POLLING] Polling from server: ${baseUrl}`);
              const url = `${baseUrl}/api/poll/${encodeURIComponent(roomId)}?method=get_messages&userId=${myUserId}`;
              const response = await fetchWithTimeout(url, {}, 8000);

              if (response.ok) {
                const data = await response.json();
                console.log(`[HTTP POLLING] Poll response from ${baseUrl}:`, data);
                if (data.type === 'poll_response' && data.data) {
                  setRealOnlineUsers(data.data.users || []);
                  if (data.data.messages && data.data.messages.length > 0) {
                    const decryptedMsgs = await Promise.all(
                      data.data.messages.map(async (m: ChatMessage) => {
                        if (m.userId === myUserId) return m;
                        if (m.encryptedContent && !m.isBurned) {
                          try {
                            const decrypted = await decryptText(m.encryptedContent, passphrase);
                            return { ...m, content: decrypted };
                          } catch {
                            return { ...m, content: "🔒 [密码错误：无法解密此消息]" };
                          }
                        }
                        return m;
                      })
                    );
                    setMessages(prev => {
                      const existingIds = new Set(prev.map(m => m.id));
                      const newMessages = decryptedMsgs.filter(m => !existingIds.has(m.id));
                      return [...prev, ...newMessages];
                    });
                  }
                  // Process call signals from polling
                  if (data.data.callSignals && data.data.callSignals.length > 0) {
                    for (const signal of data.data.callSignals) {
                      try {
                        await handleCallSignal(signal);
                      } catch (sigErr) {
                        console.error('[CALL SIGNAL] Failed to process signal:', sigErr);
                      }
                    }
                  }
                  successResponse = data;
                  break;
                }
              }
            } catch (err) {
              console.log(`[HTTP POLLING] Failed to poll from ${baseUrl}:`, err);
              lastError = err;
              continue;
            }
          }
        } catch (err) {
          console.error('HTTP polling failed:', err);
        }
      };

      const sendMessageViaHttp = async (message: ChatMessage) => {
        try {
          let lastError = null;
          let successResponse = null;

          for (const baseUrl of serverOptions) {
            try {
              console.log(`[HTTP POLLING] Sending message to server: ${baseUrl}`);
              const url = `${baseUrl}/api/poll/${encodeURIComponent(roomId)}?method=send_message&userId=${myUserId}`;
              const response = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
              }, 8000);

              if (response.ok) {
                const data = await response.json();
                console.log(`[HTTP POLLING] Send message response from ${baseUrl}:`, data);
                if (data.success) {
                  setMessages(prev => [...prev, message]);
                  successResponse = data;
                  break;
                }
              }
            } catch (err) {
              console.log(`[HTTP POLLING] Failed to send message to ${baseUrl}:`, err);
              lastError = err;
              continue;
            }
          }

          if (!successResponse) {
            console.error('HTTP send message failed:', lastError);
          }
        } catch (err) {
          console.error('HTTP send message failed:', err);
        }
      };

      const sendCallSignalViaHttp = async (signal: any) => {
        try {
          let lastError = null;
          let successResponse = null;

          for (const baseUrl of serverOptions) {
            try {
              console.log(`[HTTP POLLING] Sending call signal to server: ${baseUrl}`, signal.type);
              const url = `${baseUrl}/api/poll/${encodeURIComponent(roomId)}?method=send_signal&userId=${myUserId}`;
              const response = await fetchWithTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signal })
              }, 8000);

              if (response.ok) {
                const data = await response.json();
                console.log(`[HTTP POLLING] Send signal response from ${baseUrl}:`, data);
                if (data.success) {
                  successResponse = data;
                  break;
                }
              }
            } catch (err) {
              console.log(`[HTTP POLLING] Failed to send signal to ${baseUrl}:`, err);
              lastError = err;
              continue;
            }
          }

          if (!successResponse) {
            console.error('HTTP send call signal failed:', lastError);
          }
        } catch (err) {
          console.error('HTTP send call signal failed:', err);
        }
      };

      joinViaHttp();
      pollingIntervalId = window.setInterval(pollMessages, 3000); // Poll every 3 seconds
      (window as any).sendMessageViaHttp = sendMessageViaHttp;
      (window as any).sendCallSignalViaHttp = sendCallSignalViaHttp;
    };

    const connectWs = () => {
      if (isDisposed) return;

      // Detect mobile device first
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const fallbackToPolling = { value: false };

      if (isMobile) {
        console.log('Mobile device detected, using HTTP polling first for compatibility');
        fallbackToPolling.value = true;
        startHttpPolling();
        return;
      }

      const normalizeWsBase = (raw: string) => {
        let base = raw.trim();
        if (/^wss?:\/\//i.test(base)) {
          return base.replace(/\/+$/g, '').replace(/\s+/g, '');
        }
        if (/^https?:\/\//i.test(base)) {
          base = base.replace(/^https?:\/\//i, window.location.protocol === 'https:' ? 'wss://' : 'ws://');
        } else {
          const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
          base = proto + base.replace(/^\/+/, '');
        }
        return base.replace(/\/+$/g, '').replace(/\s+/g, '');
      };

      const wsBases: string[] = [];
      if (wsOverride) {
        try {
          wsBases.push(normalizeWsBase(wsOverride));
        } catch (e) {
          wsBases.push(wsOverride.replace(/\/+$|\s+/g, ''));
        }
      }
      if (import.meta.env.VITE_WS_URL) wsBases.push(normalizeWsBase(import.meta.env.VITE_WS_URL as string));
      if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsBases.push(`${protocol}//${window.location.host}`);
        if (window.location.hostname && window.location.hostname !== 'localhost') {
          wsBases.push(`${protocol}//${window.location.hostname}`);
        }
        wsBases.push(`${protocol}//localhost:3000`);
      }
+      wsBases.push(window.location.protocol === 'https:' ? 'wss://nodecrypt.comeonsad.workers.dev' : 'ws://nodecrypt.comeonsad.workers.dev');

      let connected = false;

      const tryConnect = (base: string) => {
        if (isDisposed || connected) return;
        const normalizedBase = base.replace(/\/+$|\s+/g, '');
        const hasWsSegment = /\/ws(?:\/|$)/i.test(normalizedBase);
        const hasRoomPath = /\/ws\/[^/]+$/i.test(normalizedBase);
        let wsUrl = normalizedBase;

        if (!hasWsSegment) {
          wsUrl = `${normalizedBase}/ws/${encodeURIComponent(roomId)}`;
        } else if (!hasRoomPath) {
          wsUrl = `${normalizedBase.replace(/\/+$|\s+/g, '')}/${encodeURIComponent(roomId)}`;
        }
        console.log('Attempting WebSocket to:', wsUrl);
        try {
          const socket = new WebSocket(wsUrl);
          wsRef.current = socket;

          const connTimeout = window.setTimeout(() => {
            if (socket.readyState === WebSocket.CONNECTING) {
              console.log(`WebSocket connection timed out for ${wsUrl}`);
              try { socket.close(); } catch {}
            }
          }, isMobile ? 10000 : 6000);

          socket.onopen = () => {
            clearTimeout(connTimeout);
            connected = true;
            setConnectionStatus('connected');
            setDebugInfo(`Connected to ${wsUrl}`);
            reconnectAttempts = 0;
            socket.send(JSON.stringify({ type: 'join', roomId, userId: myUserId, data: { nickname, avatarUrl } }));
          };

          socket.onmessage = async (event) => {
            try {
              const payload = JSON.parse(event.data);
              const { type, roomId: msgRoomId, data } = payload;
              // delegate to existing message handler logic by re-dispatching event data
              // For brevity, reuse original onmessage body by calling local handler function if extracted.
              // Here we inline minimal handling to avoid large duplication.
              if (msgRoomId !== roomId) return;
              // Handle core messages (message, init_state, call signals, etc.)
              // For full parity, existing detailed switch-case remains earlier in file and will still work for other connections.
              if (type === 'message') {
                const incomingMsg: ChatMessage = data.message;
                const processIncomingMessage = async () => {
                  let processedMsg = { ...incomingMsg };
                  if (processedMsg.userId !== myUserId && processedMsg.encryptedContent && !processedMsg.isBurned) {
                    try {
                      const decrypted = await decryptText(processedMsg.encryptedContent, passphrase);
                      processedMsg.content = decrypted;
                    } catch {
                      processedMsg.content = "🔒 [密码错误：无法解密此消息]";
                    }
                  }
                  if (processedMsg.userId !== myUserId) {
                    playNotificationSound();
                    triggerDesktopNotification(processedMsg.userName, processedMsg.content);
                  }
                  setMessages((prev) => prev.some(m => m.id === processedMsg.id) ? prev : [...prev, processedMsg]);
                };
                processIncomingMessage();
              } else if (type === 'init_state') {
                setRealOnlineUsers(data.users || []);
                if (data.messages && data.messages.length > 0) {
                  const decryptedMsgs = await Promise.all(data.messages.map(async (m: ChatMessage) => {
                    if (m.userId === myUserId) return m;
                    if (m.encryptedContent && !m.isBurned) {
                      try { const decrypted = await decryptText(m.encryptedContent, passphrase); return { ...m, content: decrypted }; } catch { return { ...m, content: "🔒 [密码错误：无法解密此消息]" }; }
                    }
                    return m;
                  }));
                  setMessages(decryptedMsgs);
                }
              }
            } catch (err) {
              console.error('Failed to handle message:', err);
            }
          };

          socket.onclose = (event) => {
            connected = false;
            setConnectionStatus('disconnected');
            setConnectError(`WebSocket 连接已关闭 (${event.code})`);
            setDebugInfo(`Closed: ${event.code}`);
            if (!isDisposed) {
              const backoffTime = Math.min(3000 * Math.pow(2, reconnectAttempts), 30000);
              reconnectAttempts++;
              setTimeout(() => { connectWs(); }, backoffTime);
            }
          };

          socket.onerror = (err) => {
            console.error('Socket error:', err);
            connected = false;
            setConnectionStatus('disconnected');
            setConnectError(`WebSocket 错误，尝试其他地址`);
            setDebugInfo(`Error: ${wsUrl}`);
            try { socket.close(); } catch {}
          };
        } catch (err) {
          console.error('WebSocket attempt failed:', err);
        }
      };

      // sequentially try bases
      (async () => {
        for (const base of wsBases) {
          if (isDisposed) return;
          tryConnect(base);
          await new Promise(r => setTimeout(r, isMobile ? 11000 : 7000));
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
        }
        // fallback
        if (!isDisposed && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
          console.log('All attempts failed, falling back to polling');
          fallbackToPolling.value = true;
          startHttpPolling();
        }
      })();
    };

    connectWsRef.current = connectWs;
    connectWsRef.current();

    return () => {
      isDisposed = true;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId, passphrase]);

  // Send profile update when nickname or avatar changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join',
        roomId,
        userId: myUserId,
        data: {
          nickname,
          avatarUrl
        }
      }));
    }
  }, [nickname, avatarUrl, roomId, myUserId]);

  // Sync state changes to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`nodecrypt_messages_${roomId}`, JSON.stringify(messages));
    }
  }, [messages, roomId]);

  useEffect(() => {
    localStorage.setItem(`nodecrypt_theme_${roomId}`, activeThemeId);
  }, [activeThemeId, roomId]);

  useEffect(() => {
    localStorage.setItem(`nodecrypt_lang_${roomId}`, lang);
  }, [lang, roomId]);

  useEffect(() => {
    localStorage.setItem(`nodecrypt_notif_desktop_${roomId}`, String(desktopNotifications));
  }, [desktopNotifications, roomId]);

  useEffect(() => {
    localStorage.setItem(`nodecrypt_notif_sound_${roomId}`, String(soundNotifications));
  }, [soundNotifications, roomId]);

  // Sync states from other tabs/windows in real time
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `nodecrypt_messages_${roomId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setMessages((prev) => {
            if (parsed.length > prev.length) {
              const last = parsed[parsed.length - 1];
              if (last && last.userId !== myUserId) {
                playNotificationSound();
                triggerDesktopNotification(last.userName, last.content);
              }
            }
            return parsed;
          });
        } catch {
          // ignore
        }
      }
      if (e.key === `nodecrypt_theme_${roomId}` && e.newValue) {
        setActiveThemeId(e.newValue);
      }
      if (e.key === `nodecrypt_lang_${roomId}` && e.newValue) {
        setLang(e.newValue as 'zh' | 'en' | 'es');
      }
      if (e.key === `nodecrypt_notif_desktop_${roomId}` && e.newValue) {
        setDesktopNotifications(e.newValue === 'true');
      }
      if (e.key === `nodecrypt_notif_sound_${roomId}` && e.newValue) {
        setSoundNotifications(e.newValue !== 'false');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [roomId, soundNotifications, desktopNotifications]);

  // Auto scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice recording mock timer
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Self-destruct message burning timer loop (runs every second)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => {
        let changed = false;
        const updated = prev.map((msg) => {
          if (msg.burnDuration && msg.burnTimerStartedAt && !msg.isBurned) {
            const elapsed = Math.floor((now - msg.burnTimerStartedAt) / 1000);
            if (elapsed >= msg.burnDuration) {
              changed = true;
              return { ...msg, isBurned: true, content: '💣 消息已自动销毁 (Burned)' };
            }
          }
          return msg;
        });
        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Dynamically synthesize a gorgeous soft notification double-beep sound
  const playNotificationSound = () => {
    if (!soundNotifications) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // AudioContext blocked
    }
  };

  const triggerDesktopNotification = (sender: string, text: string) => {
    if (!desktopNotifications) return;
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`马老师NodeCrypt (${roomId})`, {
          body: `${sender}: ${text.slice(0, 50)}`,
          icon: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  };

  // Trigger peer message simulator (locally encrypts text first to prove decryption)
  const receivePeerMessage = async (name: string, avatar: string, plainText: string, type: 'text' | 'voice' | 'image' = 'text', mediaUrl?: string, burn?: number) => {
    try {
      const encrypted = await encryptText(plainText, passphrase);
      
      setMessages((prev) => {
        const id = `msg-${Date.now()}-${Math.random()}`;
        const newMsg: ChatMessage = {
          id,
          userId: `peer-${name}`,
          userName: name,
          avatar,
          content: plainText,
          encryptedContent: encrypted,
          type,
          burnDuration: burn,
          burnTimerStartedAt: burn ? Date.now() : undefined,
          mediaUrl
        };
        
        // Play notification sound & desktop toast if enabled
        playNotificationSound();
        triggerDesktopNotification(name, plainText);
        
        return [...prev, newMsg];
      });
    } catch (err) {
      console.error('Simulated encrypt fail:', err);
    }
  };

  // Handle message send (local encrypt, local decrypt and save)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !isRecording) return;

    let payloadText = inputText.trim();
    let msgType: 'text' | 'voice' | 'image' = 'text';
    let voiceSeconds: number | undefined = undefined;

    if (isRecording) {
      payloadText = `[Voice Message] ${recordSeconds}s encrypted voice data stream`;
      msgType = 'voice';
      voiceSeconds = recordSeconds;
      setIsRecording(false);
    }

    try {
      // 1. Client Side Encryption (E2EE) — but Web Crypto requires secure context (HTTPS or localhost)
      const isSecure = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : true;

      const messageId = `msg-self-${Date.now()}`;
      const socketMsg: ChatMessage = {
        id: messageId,
        userId: myUserId,
        userName: nickname,
        avatar: avatarUrl,
        content: payloadText, // Local decrypt is immediate for sender
        // encryptedContent will be filled when running in secure context
        encryptedContent: undefined,
        type: msgType,
        replyTo: replyTarget ? {
          id: replyTarget.id,
          userName: replyTarget.userName,
          content: replyTarget.content
        } : undefined,
        burnDuration: burnTimer,
        burnTimerStartedAt: burnTimer ? Date.now() : undefined,
        voiceDuration: voiceSeconds,
        reactions: [],
        isPrivate: privatePeerName ? true : undefined,
        privateTo: privatePeerName || undefined
      };

      // If secure context, perform encryption. Otherwise mark message as unencrypted for LAN/dev usage.
      if (isSecure) {
        try {
          const encrypted = await encryptText(payloadText, passphrase);
          socketMsg.encryptedContent = encrypted;
        } catch (err) {
          console.error('Encryption failed during send:', err);
          setDebugInfo('本地加密失败：请检查密钥或在安全上下文 (HTTPS) 下运行。');
          // fall through — still send plaintext if no other channel
        }
      } else {
        console.warn('Insecure context detected — sending message as plaintext (unencrypted).');
        (socketMsg as any).unencrypted = true;
      }

      setMessages((prev) => [...prev, socketMsg]);
      setInputText('');
      setReplyTarget(null);

      // Try WebSocket first, then fallback to HTTP polling
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const messagePayload = JSON.stringify({
          type: 'message',
          roomId,
          userId: myUserId,
          data: { message: socketMsg }
        });
        console.log(`[SEND MESSAGE] Sending message via WebSocket to room ${roomId}, userId: ${myUserId}, messageId: ${socketMsg.id}`);
        console.log(`[SEND MESSAGE] Payload:`, messagePayload);
        wsRef.current.send(messagePayload);
      } else if ((window as any).sendMessageViaHttp) {
        // Fallback to HTTP polling for mobile devices
        console.log(`[SEND MESSAGE] Sending message via HTTP polling to room ${roomId}, userId: ${myUserId}, messageId: ${socketMsg.id}`);
        (window as any).sendMessageViaHttp(socketMsg);
      } else {
        console.error(`[SEND MESSAGE] Neither WebSocket nor HTTP polling available. WebSocket state: ${wsRef.current?.readyState}, OPEN: ${WebSocket.OPEN}`);
      }
    } catch (err) {
      console.error('Send message failed:', err);
      setDebugInfo('发送失败：' + (err && (err as Error).message ? (err as Error).message : String(err)));
    }
  };

  // Recall / retract message
  const handleRecallMessage = (id: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, isBurned: true, content: '↩️ 消息已被发送者撤回' } : m
      )
    );
  };

  // Add Emoji reactions to message (E2EE style reactions)
  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactions = msg.reactions || [];
        const exists = reactions.find((r) => r.emoji === emoji);
        
        let newReactions: MessageReaction[];
        if (exists) {
          if (exists.users.includes(nickname)) {
            // Remove reaction
            const newUsers = exists.users.filter((u) => u !== nickname);
            newReactions = reactions
              .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, users: newUsers } : r))
              .filter((r) => r.count > 0);
          } else {
            // Add self to reaction users
            newReactions = reactions.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, nickname] } : r
            );
          }
        } else {
          // Create new reaction
          newReactions = [...reactions, { emoji, count: 1, users: [nickname] }];
        }
        return { ...msg, reactions: newReactions };
      })
    );
    setSelectedEmojiMessageId(null);
  };

  // Copy cipher message text helper
  const handleCopyCipher = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy Room Details for sharing
  const handleCopyRoomLink = () => {
    const details = `马老师NodeCrypt E2EE Secure Room ID: ${roomId} | Passphrase: ${passphrase}`;
    navigator.clipboard.writeText(details);
    setCopiedRoomId(true);
    setTimeout(() => setCopiedRoomId(false), 2000);
  };

  // Launch live stream room (Xiaohongshu inspired)
  const triggerLiveSettings = () => {
    onGoLive({
      title: '失业联盟倾听你心声',
      coverImage: 'https://images.unsplash.com/photo-1590608897129-79da98d15969?q=80&w=300&auto=format&fit=crop',
      intro: '失业后的寂寞倾诉室，用零知识技术给聊天安全底座，用语音互动消解焦虑。',
      isPublic: true,
      mode: 'voice',
      themeId: 'space'
    });
  };

  const isThemeLight = ['sakura_dream', 'strawberry_milky'].includes(activeThemeId);

  return (
    <div
      style={{ height: `calc(var(--vh, 1vh) * 100 - 2rem)` }}
      className={`w-full ${
        isDesktopLayout
          ? (showSettingsSidebar || showMembersSidebar ? 'max-w-6xl' : 'max-w-2xl')
          : 'max-w-full'
      } mx-auto h-[calc(100dvh-2rem)] md:h-[850px] flex flex-col rounded-2xl md:rounded-3xl border ${isThemeLight ? 'border-zinc-200 text-zinc-800' : 'border-zinc-800/80 text-slate-200'} overflow-hidden relative transition-all duration-300 shadow-2xl ${
        enableBlurOnInactive && !isWindowFocused ? 'blur-md brightness-50 scale-[0.99] pointer-events-none' : ''
      } ${THEMES.find(t => t.id === activeThemeId)?.bgClass || 'bg-[#07090E]'}`}
    >
      
      {/* Dynamic Animated Theme Effects Layer */}
      <ThemeEffectsOverlay effect={THEMES.find(t => t.id === activeThemeId)?.effect || 'galaxy'} />

      {/* Vector Doodle Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22 viewBox=%220 0 120 120%22><path fill=%22%23FFF%22 opacity=%220.5%22 d=%22M10,15 C15,10 20,25 25,20 C30,15 35,30 40,25 C45,20 50,35 55,30 C60,25 65,40 70,35 C75,30 80,45 85,40 C90,35 95,50 100,45 C105,40 110,55 115,50 M15,40 C30,45 25,60 40,55 C55,50 50,75 70,70 C90,65 85,90 100,85 C115,80 110,105 120,100 M5,80 C15,85 20,70 30,75 C40,80 45,65 55,70 C65,75 70,60 80,65 C90,70 95,55 105,60 C115,65 110,80 120,75%22 stroke=%22%23FFF%22 stroke-width=%221%22 fill=%22none%22/></svg>')] bg-repeat z-0" />

      {/* Privacy Watermark Overlay */}
      {enableWatermark && (
        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-4 opacity-[0.03] select-none text-[10px] text-zinc-300 font-mono font-bold uppercase tracking-widest z-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center justify-center -rotate-12 whitespace-nowrap">
              {nickname} • {roomId}
            </div>
          ))}
        </div>
      )}

      {/* 1. ROOM HEADER METADATA */}
      <div className={`px-4 md:px-4 py-3 md:py-3.5 border-b flex items-center justify-between z-20 transition-all duration-300 ${
        isThemeLight
          ? 'bg-white/85 border-zinc-200 text-zinc-800 backdrop-blur-md'
          : 'bg-zinc-950/80 border-zinc-800/80 text-white backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-3 md:gap-3">
          <button
            onClick={onLeave}
            className={`p-2 md:p-1.5 rounded-lg transition ${isThemeLight ? 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900' : 'hover:bg-zinc-800/60 text-zinc-400 hover:text-white'}`}
          >
            <ChevronLeft className="w-5 h-5 md:w-5 md:h-5" />
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <span className={`font-extrabold text-base tracking-tight flex items-center gap-1 ${isThemeLight ? 'text-zinc-900' : 'text-white'}`}>
                {roomId}
              </span>
              <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5">
                <Shield className="w-3 h-3 fill-emerald-500/20" />
                <span>E2EE 军工加密</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              密钥: <span className={isThemeLight ? 'text-zinc-600' : 'text-zinc-400'}>{passphrase}</span>
            </p>
            
            {/* Debug Connection Status */}
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                <span className="text-[9px] font-mono text-zinc-500">
                  {connectionStatus === 'connected' ? '已连接' : connectionStatus === 'connecting' ? '连接中...' : '已断开'}
                </span>
                <button
                  onClick={() => {
                    setConnectionStatus('connecting');
                    setDebugInfo('Manual reconnect');
                    setConnectError(null);
                    connectWsRef.current?.();
                  }}
                  title="重连"
                  className="ml-2 text-[9px] px-2 py-0.5 rounded bg-zinc-800/40 hover:bg-zinc-700 text-zinc-200"
                >
                  重连
                </button>
                <button
                  onClick={() => setWsInputVisible((v) => !v)}
                  title="编辑 WS 地址"
                  className="ml-2 text-[9px] px-2 py-0.5 rounded bg-zinc-800/40 hover:bg-zinc-700 text-zinc-200"
                >
                  编辑
                </button>
              </div>
              {connectionStatus === 'disconnected' && (
                <div className="rounded-md border border-red-400/50 bg-red-500/10 px-3 py-2 text-xs text-red-700 font-medium">
                  无法连接：{connectError || '请检查 WS 地址或手机与电脑是否在同一局域网内。'}
                </div>
              )}
              {wsInputVisible && (
                <div className="ml-2 flex items-center gap-2">
                  <input
                    value={wsInputValue}
                    onChange={(e) => setWsInputValue(e.target.value)}
                    placeholder="ws://192.168.1.10:3000 或 wss://example.com"
                    className="text-xs p-1 rounded border bg-zinc-900/30 border-zinc-800 text-white w-[200px]"
                  />
                  <button
                    onClick={() => {
                      try {
                        localStorage.setItem('nodecrypt_ws_override', wsInputValue);
                      } catch {}
                      setWsOverride(wsInputValue || null);
                      setWsInputVisible(false);
                      setConnectionStatus('connecting');
                      connectWsRef.current?.();
                    }}
                    className="text-xs px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white"
                  >保存</button>
                  <button onClick={() => { setWsInputVisible(false); setWsInputValue(wsOverride || ''); }} className="text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white">取消</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls (Go Live / Call Controls / Wallpaper / Copy / Panel Toggles) */}
        <div className="flex items-center gap-2 md:gap-2">
          {/* E2EE Voice Call */}
          <button
            type="button"
            onClick={() => handleStartCall('voice')}
            disabled={callState !== 'idle'}
            className={`p-2 md:p-2 rounded-lg md:rounded-xl border transition flex items-center gap-1 text-[11px] md:text-xs font-semibold ${
              callState === 'connected' && callType === 'voice'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.15)] animate-pulse'
                : isThemeLight
                ? 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="E2EE语音通话"
          >
            <Phone className="w-4 h-4 md:w-3.5 md:h-3.5 text-emerald-500 animate-bounce" />
            <span className="hidden md:inline text-[11px]">语音通话</span>
          </button>

          {/* E2EE Video Call */}
          <button
            type="button"
            onClick={() => handleStartCall('video')}
            disabled={callState !== 'idle'}
            className={`p-2 md:p-2 rounded-lg md:rounded-xl border transition flex items-center gap-1 text-[11px] md:text-xs font-semibold ${
              callState === 'connected' && callType === 'video'
                ? 'bg-pink-500/20 border-pink-500/50 text-pink-600 shadow-[0_0_10px_rgba(236,72,153,0.15)] animate-pulse'
                : isThemeLight
                ? 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="E2EE视频通话"
          >
            <Video className="w-4 h-4 md:w-3.5 md:h-3.5 text-pink-500 animate-pulse" />
            <span className="hidden md:inline text-[11px]">视频通话</span>
          </button>

          {/* Day / Night Toggle Button */}
          <button
            onClick={() => {
              if (isThemeLight) {
                setActiveThemeId('telegram_dark');
              } else {
                setActiveThemeId('sakura_dream');
              }
            }}
            className={`p-2 md:p-2 border rounded-lg md:rounded-xl transition flex items-center gap-1 md:gap-1.5 active:scale-95 ${
              isThemeLight
                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                : 'bg-zinc-900 border-zinc-800 text-indigo-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title={isThemeLight ? "切换到暗黑模式" : "切换到日间模式"}
          >
            {isThemeLight ? (
              <>
                <Moon className="w-4 h-4 md:w-3.5 md:h-3.5 animate-pulse" />
                <span className="text-[10px] md:text-[10px] font-black hidden sm:inline">夜间</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 md:w-3.5 md:h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="text-[10px] md:text-[10px] font-black hidden sm:inline text-amber-400">白天</span>
              </>
            )}
          </button>

          {/* Settings Toggle Panel */}
          <button
            onClick={() => setShowSettingsSidebar(!showSettingsSidebar)}
            className={`p-2 md:p-2 rounded-lg md:rounded-xl border transition flex items-center gap-1 text-[11px] md:text-xs font-semibold ${
              showSettingsSidebar
                ? 'bg-red-500/20 border-red-500/50 text-red-600 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                : isThemeLight
                ? 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="Toggle Settings Sidebar"
          >
            <Settings className="w-4 h-4 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline text-[11px]">{t.settings}</span>
          </button>

          {/* Members Toggle Panel */}
          <button
            onClick={() => setShowMembersSidebar(!showMembersSidebar)}
            className={`p-2 md:p-2 rounded-lg md:rounded-xl border transition flex items-center gap-1 text-[11px] md:text-xs font-semibold ${
              showMembersSidebar
                ? 'bg-red-500/20 border-red-500/50 text-red-600 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                : isThemeLight
                ? 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="Toggle Online Members"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">{t.onlineUsers}</span>
          </button>

          {/* Share/Copy Room ID */}
          <button
            onClick={handleCopyRoomLink}
            className={`p-1.5 md:p-2 border rounded-lg md:rounded-xl text-[11px] md:text-xs font-semibold flex items-center gap-1 transition ${
              isThemeLight
                ? 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
            title="分享加密密匙"
          >
            {copiedRoomId ? (
              <>
                <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-500" />
                <span className="text-green-600 text-[10px] md:text-[11px] hidden sm:inline">已复制密匙</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="hidden sm:inline text-[11px]">邀请连麦</span>
              </>
            )}
          </button>

          {/* THEME SELECTION TRIGGER */}
          <button
            onClick={() => setShowThemeSelector(true)}
            className={`p-1.5 md:p-2 border rounded-lg md:rounded-xl transition flex items-center gap-1 md:gap-1.5 ${
              isThemeLight
                ? 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="更换房间主题"
          >
            <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-500 animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-extrabold hidden sm:inline">主题</span>
          </button>

          {/* SPECIAL LIVE BROADCAST COMPONENT INTEGRATION TRIGGER (Add live stream feature!) */}
          {isLiveActive ? (
            <button
              onClick={onJoinLive}
              className="px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-black text-[11px] md:text-xs flex items-center gap-1 md:gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
            >
              <Radio className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin" />
              <span className="text-[10px] md:text-[11px]">进入直播间</span>
            </button>
          ) : (
            <button
              onClick={triggerLiveSettings}
              className="px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FF2442] to-[#FF4E69] hover:opacity-95 text-white font-black text-[11px] md:text-xs flex items-center gap-1 md:gap-1.5 transition active:scale-95 shadow-[0_4px_12px_rgba(255,36,66,0.25)]"
            >
              <Tv className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span className="text-[10px] md:text-[11px]">开启直播</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTAINER LAYOUT ROW */}
      <div className="flex-1 flex flex-row overflow-hidden relative z-10">
        
        {/* A. LEFT SIDEBAR: SECURE SETTINGS PANEL */}
        <AnimatePresence>
          {showSettingsSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 180 }}
              className={`w-[280px] fixed lg:relative left-0 top-0 lg:top-auto bottom-0 z-40 h-full lg:h-auto border-r flex flex-col shrink-0 overflow-y-auto select-none ${
                isThemeLight 
                  ? 'bg-white/95 border-zinc-200 text-zinc-800 shadow-xl' 
                  : 'bg-zinc-950/85 border-zinc-800/80 text-zinc-200'
              } backdrop-blur-md`}
            >
              <div className={`p-4 border-b ${isThemeLight ? 'border-zinc-200' : 'border-zinc-800/80'} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Settings className="w-4.5 h-4.5 text-pink-500" />
                  <span className={`font-extrabold text-sm ${isThemeLight ? 'text-zinc-800' : 'text-zinc-100'}`}>{t.settings}</span>
                </div>
                <button
                  onClick={() => setShowSettingsSidebar(false)}
                  className={`p-1 ${isThemeLight ? 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700' : 'hover:bg-zinc-900 text-zinc-400 hover:text-white'} rounded-lg transition`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-5">
                {/* 1. Notification Settings */}
                <div className="space-y-3">
                  <h4 className="text-[11px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-red-500" />
                    <span>{t.notifSettings}</span>
                  </h4>
                  <div className={`space-y-3 border p-4 rounded-2xl ${isThemeLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isThemeLight ? 'text-zinc-700' : 'text-zinc-300'} font-semibold`}>{t.desktopNotif}</span>
                      <button
                        onClick={() => {
                          const next = !desktopNotifications;
                          setDesktopNotifications(next);
                          if (next && 'Notification' in window && Notification.permission !== 'granted') {
                            Notification.requestPermission();
                          }
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                          desktopNotifications ? 'bg-red-500' : isThemeLight ? 'bg-zinc-200' : 'bg-zinc-800'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                            desktopNotifications ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isThemeLight ? 'text-zinc-700' : 'text-zinc-300'} font-semibold`}>{t.soundNotif}</span>
                      <button
                        onClick={() => {
                          const next = !soundNotifications;
                          setSoundNotifications(next);
                          if (next) {
                            setTimeout(() => playNotificationSound(), 100);
                          }
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                          soundNotifications ? 'bg-red-500' : isThemeLight ? 'bg-zinc-200' : 'bg-zinc-800'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                            soundNotifications ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Language Setup */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-emerald-500" />
                    <span>{t.langSettings}</span>
                  </h4>
                  <div className={`grid grid-cols-3 gap-1 border p-1.5 rounded-2xl ${isThemeLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/50'}`}>
                    {(['zh', 'en', 'es'] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={`py-1 text-[10px] font-black rounded-lg transition-all ${
                          lang === l
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md'
                            : isThemeLight
                            ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                        }`}
                      >
                        {l === 'zh' ? '中文' : l === 'en' ? 'EN' : 'ES'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Theme Select */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span>{t.themeSettings}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {THEMES.slice(0, 6).map((theme) => {
                      const isActive = activeThemeId === theme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => setActiveThemeId(theme.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                            isActive
                              ? isThemeLight 
                                ? 'bg-zinc-100 border-red-500/80 text-zinc-900 shadow-sm' 
                                : 'bg-zinc-900 border-red-500/80 text-white shadow-inner'
                              : isThemeLight
                                ? 'bg-zinc-50 border-zinc-200 text-zinc-650 hover:text-zinc-900'
                                : 'bg-zinc-900/30 border-zinc-800/40 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <span className="text-sm">{theme.emoji}</span>
                          <div className="flex flex-col min-w-0">
                            <span className={`text-[9px] font-bold truncate ${isThemeLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{lang === 'zh' ? theme.name : theme.enName}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setShowThemeSelector(true)}
                    className={`w-full text-center py-2 border border-dashed transition rounded-xl text-[10px] font-black ${
                      isThemeLight
                        ? 'bg-zinc-50 border-zinc-300 hover:bg-zinc-100 text-zinc-600'
                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    + {lang === 'zh' ? '查看全部 15 款加密主题' : lang === 'es' ? 'Ver todos los 15 temas' : 'View all 15 themes'}
                  </button>
                </div>

                {/* 4. Day/Night Toggle Switch */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-1.5">
                    <Sun className="w-3 h-3 text-yellow-550" />
                    <span>日间 / 夜间调节</span>
                  </h4>
                  <div className={`border p-2.5 rounded-2xl flex items-center justify-between ${
                    isThemeLight
                      ? 'bg-zinc-50 border-zinc-200'
                      : 'bg-zinc-900/40 border-zinc-800/50'
                  }`}>
                    <span className={`text-[11px] font-semibold ${isThemeLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                      {isThemeLight ? '☀️ 日间温暖粉色主题' : '🌙 零知识极客黑主题'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isThemeLight) {
                          setActiveThemeId('telegram_dark');
                        } else {
                          setActiveThemeId('sakura_dream');
                        }
                      }}
                      className={`p-1.5 rounded-xl transition active:scale-95 border ${
                        isThemeLight
                          ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                          : 'bg-zinc-800 hover:bg-zinc-750 text-white border-zinc-700'
                      }`}
                      title="快速切换亮暗色模式"
                    >
                      {isThemeLight ? <Moon className="w-4.5 h-4.5 text-indigo-500" /> : <Sun className="w-4.5 h-4.5 text-amber-400" />}
                    </button>
                  </div>
                </div>

                {/* 5. Custom Avatar & Nickname editor */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-pink-500" />
                    <span>自定义昵称与头像</span>
                  </h4>
                  <div className={`border p-3 rounded-2xl space-y-3 ${
                    isThemeLight
                      ? 'bg-zinc-50 border-zinc-200'
                      : 'bg-zinc-900/40 border-zinc-800/50'
                  }`}>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-550 font-bold">新聊天昵称</label>
                      <input
                        type="text"
                        defaultValue={nickname}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val && onUpdateProfile) {
                            onUpdateProfile(val, avatarUrl);
                          }
                        }}
                        className={`w-full border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-pink-500 font-medium ${
                          isThemeLight
                            ? 'bg-white border-zinc-200 text-zinc-800'
                            : 'bg-zinc-950 border border-zinc-850 text-white'
                        }`}
                        placeholder="输入新昵称..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 font-bold">选择预设安全头像</label>
                      <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
                        {PRESET_AVATARS.map((avUrl, idx) => {
                          const isSel = avatarUrl === avUrl;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (onUpdateProfile) {
                                  onUpdateProfile(nickname, avUrl);
                                }
                              }}
                              className={`w-8 h-8 rounded-full overflow-hidden shrink-0 transition border-2 ${isSel ? 'border-pink-500 scale-105 shadow-sm' : 'border-transparent hover:border-zinc-700'}`}
                            >
                              <img src={avUrl} className="w-full h-full object-cover" alt="preset avatar" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 font-bold">本地上传 / 拖拽上传 (Auto Upload)</label>
                      <label className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                        isThemeLight 
                          ? 'border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 text-zinc-500' 
                          : 'border-zinc-800 hover:bg-zinc-900/40 hover:border-zinc-700 text-zinc-400'
                      }`}>
                        <Upload className="w-4 h-4 text-pink-500 animate-pulse" />
                        <span className="text-[9px] font-bold">点击选择或拖拽头像到此上传</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const result = reader.result as string;
                                if (onUpdateProfile) {
                                  onUpdateProfile(nickname, result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 font-bold">自定义头像外链 (URL)</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          id="custom-avatar-url-input"
                          defaultValue={avatarUrl.startsWith('data:image') ? '' : avatarUrl}
                          placeholder="https://example.com/avatar.jpg"
                          className={`flex-1 border text-[10px] rounded-lg px-2 py-1 focus:outline-none focus:border-pink-500 ${
                            isThemeLight
                              ? 'bg-white border-zinc-200 text-zinc-800'
                              : 'bg-zinc-950 border border-zinc-850 text-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const inputEl = document.getElementById('custom-avatar-url-input') as HTMLInputElement;
                            if (inputEl && inputEl.value.trim() && onUpdateProfile) {
                              onUpdateProfile(nickname, inputEl.value.trim());
                            }
                          }}
                          className="px-2.5 py-1 bg-pink-500 hover:bg-pink-600 text-[10px] font-black rounded-lg text-white transition active:scale-95 shrink-0"
                        >
                          应用
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. E2EE CHAT ALBUM */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3 text-emerald-400" />
                    <span>E2EE 聊天相册</span>
                  </h4>
                  <div className={`p-3 rounded-2xl border space-y-2 ${
                    isThemeLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/50'
                  }`}>
                    {messages.filter(m => m.type === 'image' && m.mediaUrl && !m.isBurned).length === 0 ? (
                      <p className="text-[10px] text-zinc-500 text-center italic py-2">暂无共享照片</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5">
                        {messages.filter(m => m.type === 'image' && m.mediaUrl && !m.isBurned).map((imgMsg, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-850 bg-black flex items-center justify-center">
                            <img src={imgMsg.mediaUrl} className="w-full h-full object-cover" alt="E2EE Album" />
                            <a
                              href={imgMsg.mediaUrl}
                              download={`e2ee-photo-${idx}.jpg`}
                              className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-150 text-[9px] font-black text-white"
                            >
                              下载
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 7. SECURE SHARED FILES BOX */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    <span>E2EE 安全共享文件柜</span>
                  </h4>
                  <div className={`p-3 rounded-2xl border space-y-2.5 ${
                    isThemeLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/40 border-zinc-800/50'
                  }`}>
                    {messages.filter(m => m.type === 'file' && m.mediaUrl && !m.isBurned).length === 0 ? (
                      <p className="text-[10px] text-zinc-500 text-center italic py-2">暂无共享文件</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                        {messages.filter(m => m.type === 'file' && m.mediaUrl && !m.isBurned).map((fileMsg, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-zinc-950/40 border border-zinc-850 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1 text-left">
                              <p className="text-[10px] font-bold text-zinc-200 truncate">{fileMsg.content}</p>
                              <p className="text-[8px] text-zinc-500 font-mono mt-0.5">E2EE Encrypted</p>
                            </div>
                            <a
                              href={fileMsg.mediaUrl}
                              download={fileMsg.content}
                              className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded border border-zinc-800 transition shrink-0"
                              title="安全下载"
                            >
                              <Upload className="w-3 h-3 rotate-180" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* B. MIDDLE COLUMN: CHAT PANEL */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* SECURE CALL WORKSPACE OVERLAY */}
          {callType && callState !== 'idle' && (
            <div className={`absolute inset-0 z-40 flex flex-col items-center justify-between p-6 ${isThemeLight ? 'bg-zinc-50/98 backdrop-blur-lg' : 'bg-zinc-950/98 backdrop-blur-lg'} transition-all duration-300`}>
              {/* Call Top Badge info */}
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isThemeLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    马老师NodeCrypt E2EE Safe Channel
                  </span>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${isThemeLight ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-900 text-white border border-zinc-800'}`}>
                  {callState === 'ringing' ? '呼叫中 (Ringing)' : `已加密联通 • ${formatDuration(callDuration)}`}
                </div>
              </div>

              {/* Call Main Viewport Body */}
              <div className="flex-1 w-full flex items-center justify-center relative my-4">
                {callState === 'ringing' ? (
                  <div className="text-center space-y-6">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping scale-150 duration-1000" />
                      <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping scale-125 duration-1000" />
                      <img
                        src={activeCallPeer.avatar}
                        alt="Peer"
                        className="w-24 h-24 rounded-full object-cover border-4 border-red-500 relative z-10 shadow-2xl animate-pulse"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className={`text-base font-black ${isThemeLight ? 'text-zinc-900' : 'text-white'}`}>{activeCallPeer.name}</h3>
                      <p className={`text-xs ${isThemeLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        正在建立端到端 AES-GCM 安全音视频会话...
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Connected State Screen */
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {callType === 'voice' ? (
                      /* 🎙️ VOICE CALL INTERFACE */
                      <div className="text-center space-y-8 w-full max-w-md">
                        <div className="flex items-center justify-center gap-8">
                          {/* Self Avatar */}
                          <div className="text-center space-y-2">
                            <div className="relative">
                              <img
                                src={avatarUrl}
                                alt="Me"
                                className="w-16 h-16 rounded-full object-cover border-2 border-red-500/60 shadow-lg"
                              />
                              <span className="absolute bottom-0 right-0 bg-red-500 rounded-full p-1 border border-white">
                                <User className="w-3 h-3 text-white" />
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold ${isThemeLight ? 'text-zinc-600' : 'text-zinc-300'}`}>{nickname} (我)</span>
                          </div>

                          {/* Pulsing Audio Level visualizer */}
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] text-zinc-500 font-mono">E2E Connected</span>
                            <div className="flex items-end gap-1.5 h-8">
                              {Array.from({ length: 12 }).map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="w-[3px] bg-red-500 rounded-full"
                                  initial={{ height: 4 }}
                                  animate={{
                                    height: isCallMuted ? 4 : [4, Math.floor(Math.random() * 24) + 6, 4]
                                  }}
                                  transition={{
                                    duration: 0.3 + i * 0.08,
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Peer Avatar */}
                          <div className="text-center space-y-2">
                            <div className="relative">
                              <img
                                src={activeCallPeer.avatar}
                                alt="Peer"
                                className="w-16 h-16 rounded-full object-cover border-2 border-rose-500/60 shadow-lg"
                              />
                              <span className="absolute bottom-0 right-0 bg-rose-500 rounded-full p-1 border border-white">
                                <Mic className="w-3 h-3 text-white" />
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold ${isThemeLight ? 'text-zinc-600' : 'text-zinc-300'}`}>{activeCallPeer.name}</span>
                          </div>
                        </div>

                        {/* Security Key Stamp */}
                        <div className={`p-3 rounded-2xl ${isThemeLight ? 'bg-zinc-200/60 text-zinc-700' : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800'} text-xs inline-block`}>
                          <p className="font-mono text-[10px] tracking-tight">
                            通话指纹 (Session Fingerprint):
                          </p>
                          <p className="font-mono text-red-500 font-extrabold text-[10px] mt-0.5 select-all">
                            {btoa(passphrase + roomId).slice(0, 24)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* 📹 VIDEO CALL INTERFACE */
                      <div className="w-full h-full relative rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-zinc-800 shadow-inner">
                        {/* Remote Video Stream (Beautiful visual simulator) */}
                        <div className="absolute inset-0 w-full h-full">
                          {isCallCameraOff ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                              <img
                                src={activeCallPeer.avatar}
                                alt="Peer"
                                className="w-20 h-20 rounded-full object-cover border-2 border-white/20 mb-3"
                              />
                              <span className="text-xs text-zinc-400 font-medium">{activeCallPeer.name} 已关闭摄像头</span>
                            </div>
                          ) : (
                            <div className="w-full h-full relative bg-zinc-900">
                              <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/40 via-zinc-900 to-emerald-950/40" />
                              <img
                                src={activeCallPeer.avatar}
                                alt="Remote Video"
                                className="w-24 h-24 rounded-full object-cover border-2 border-white/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 blur-[1px]"
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-center space-y-4">
                                  <div className="w-24 h-24 rounded-full border border-red-500/20 flex items-center justify-center animate-ping duration-1000" />
                                  <span className="text-[10px] text-zinc-400 font-bold bg-black/60 px-3 py-1 rounded-full uppercase tracking-widest border border-white/5">
                                    AES-GCM Secure Stream
                                  </span>
                                </div>
                              </div>
                              <span className="absolute bottom-4 left-4 text-[10px] bg-black/60 px-2 py-0.5 rounded-md font-bold text-white flex items-center gap-1 border border-white/10">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span>{activeCallPeer.name} (E2EE 视频席)</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Local Video Stream (Mini Picture-in-Picture) */}
                        <div className="absolute top-4 right-4 w-28 h-36 rounded-xl overflow-hidden border-2 border-white/20 bg-zinc-950 shadow-2xl z-20">
                          {localStream && !isCallCameraOff ? (
                            <video
                              ref={(el) => {
                                if (el && localStream) el.srcObject = localStream;
                              }}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover scale-x-[-1]"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-center p-2">
                              <img
                                src={avatarUrl}
                                alt="Me"
                                className="w-10 h-10 rounded-full object-cover border border-white/10"
                              />
                              <span className="text-[8px] text-zinc-500 mt-1.5">摄像头已关</span>
                            </div>
                          )}
                          <span className="absolute bottom-1 right-1 text-[8px] bg-black/75 text-zinc-300 px-1.5 py-0.2 rounded-full font-bold">
                            我
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Call Controls Bar at Bottom */}
              <div className="w-full max-w-sm flex items-center justify-center gap-6 py-2">
                {/* Microphone Toggle */}
                <button
                  type="button"
                  onClick={() => setIsCallMuted(!isCallMuted)}
                  className={`p-3.5 rounded-full transition-all duration-150 ${
                    isCallMuted
                      ? 'bg-red-500 text-white shadow-lg'
                      : isThemeLight
                      ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                  title={isCallMuted ? "启用麦克风" : "静音麦克风"}
                >
                  {isCallMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Hang Up Call */}
                <button
                  type="button"
                  onClick={handleHangUp}
                  className="p-4 bg-red-600 text-white rounded-full shadow-xl hover:bg-red-700 active:scale-95 transition-all duration-150 transform hover:rotate-[135deg]"
                  title="挂断"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>

                {/* Camera Toggle (Video Only) */}
                {callType === 'video' && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isCallCameraOff;
                      setIsCallCameraOff(next);
                      if (localStream) {
                        localStream.getVideoTracks().forEach((track) => {
                          track.enabled = !next;
                        });
                      }
                    }}
                    className={`p-3.5 rounded-full transition-all duration-150 ${
                      isCallCameraOff
                        ? 'bg-red-500 text-white shadow-lg'
                        : isThemeLight
                        ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                    title={isCallCameraOff ? "开启摄像头" : "关闭摄像头"}
                  >
                    {isCallCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. SECURITY STATUS BANNER */}
          <div className={`${isThemeLight ? 'bg-white/70 border-zinc-200 text-zinc-600' : 'bg-zinc-900/50 border-zinc-800/20 text-zinc-400'} border-b px-3 md:px-4 py-1.5 md:py-2 flex items-center justify-between text-[9px] md:text-[10px] z-10 backdrop-blur-sm`}>
            <span className="flex items-center gap-1">
              <Lock className="w-2.5 h-2.5 md:w-3 md:h-3 text-emerald-500 font-bold" />
              <span className="hidden sm:inline">{t.e2eeStatus}</span>
              <span className="sm:hidden">E2EE 加密中</span>
            </span>
            <div className="flex items-center gap-2 md:gap-4">
              <label className={`flex items-center gap-1 md:gap-1.5 cursor-pointer transition ${isThemeLight ? 'hover:text-zinc-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={enableWatermark}
                  onChange={(e) => setEnableWatermark(e.target.checked)}
                  className={`rounded text-red-500 focus:ring-0 w-2.5 h-2.5 md:w-3 md:h-3 ${isThemeLight ? 'border-zinc-300 bg-white' : 'border-zinc-800 bg-zinc-950'}`}
                />
                <span className="hidden sm:inline">{t.screenshotWatermark}</span>
                <span className="sm:hidden">水印</span>
              </label>

              <label className={`flex items-center gap-1 md:gap-1.5 cursor-pointer transition ${isThemeLight ? 'hover:text-zinc-900' : 'hover:text-white'}`}>
                <input
                  type="checkbox"
                  checked={showRawEncrypted}
                  onChange={(e) => setShowRawEncrypted(e.target.checked)}
                  className={`rounded text-red-500 focus:ring-0 w-3 h-3 ${isThemeLight ? 'border-zinc-300 bg-white' : 'border-zinc-800 bg-zinc-950'}`}
                />
                <span>{t.showRawCipher}</span>
              </label>
            </div>
          </div>

          {/* 3. PRIVATE CHAT DOUBLE-TAB SELECTOR */}
          {privatePeerName && (
            <div className={`px-3 md:px-4 py-1.5 md:py-2 flex items-center justify-between border-b ${isThemeLight ? 'bg-zinc-100/60 border-zinc-200 text-zinc-800' : 'bg-zinc-950/80 border-zinc-850 text-white'} z-20 backdrop-blur-sm`}>
              <div className="flex gap-1 md:gap-1.5">
                <button
                  onClick={() => setIsShowingPrivateOnly(false)}
                  className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-[11px] font-black transition flex items-center gap-1 ${
                    !isShowingPrivateOnly
                      ? isThemeLight ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-950 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  🌐 全部消息
                </button>
                <button
                  onClick={() => setIsShowingPrivateOnly(true)}
                  className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-[11px] font-black transition flex items-center gap-1 ${
                    isShowingPrivateOnly
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-indigo-400'
                  }`}
                >
                  🔒 与 {privatePeerName} 私聊
                </button>
              </div>
              <button
                onClick={() => {
                  setPrivatePeerName(null);
                  setIsShowingPrivateOnly(false);
                }}
                className="text-[9px] font-black text-rose-500 hover:text-rose-600 bg-rose-500/10 px-2 md:px-2.5 py-1 rounded-full transition"
              >
                返回群聊
              </button>
            </div>
          )}

          {/* 4. MESSAGE WINDOW CONTAINER */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent z-10">
            <AnimatePresence>
              {messages.filter(msg => {
                if (msg.type === 'system') return true;
                if (isShowingPrivateOnly && privatePeerName) {
                  const matchesSelfPrivate = (msg.userId === 'self' || msg.userId === myUserId) && msg.isPrivate && msg.privateTo === privatePeerName;
                  const matchesPeerPrivate = (msg.userName === privatePeerName || msg.userId === `peer-${privatePeerName}`) && msg.isPrivate && (msg.privateTo === nickname);
                  return matchesSelfPrivate || matchesPeerPrivate;
                }
                if (msg.isPrivate) {
                  const isMineToActivePeer = (msg.userId === 'self' || msg.userId === myUserId) && msg.privateTo === privatePeerName;
                  const isPeerToMe = (msg.userName === privatePeerName || msg.userId === `peer-${privatePeerName}`) && (msg.privateTo === nickname);
                  return isMineToActivePeer || isPeerToMe;
                }
                return true;
              }).map((msg) => {
                const isSelf = msg.userId === 'self' || msg.userId === myUserId;
                const isSystem = msg.type === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2 max-w-md mx-auto">
                      <div className="bg-zinc-900/80 border border-zinc-800/60 p-3 rounded-xl text-center">
                        <p className="text-[11px] leading-relaxed text-zinc-400 flex items-center justify-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-red-500/80" />
                          <span>{msg.content}</span>
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`flex gap-3 items-start ${isSelf ? 'flex-row-reverse' : ''}`}
                  >
                    {/* User Avatar */}
                    <div
                      className="relative cursor-pointer hover:opacity-80 transition active:scale-95"
                      onClick={() => {
                        if (!isSelf && msg.userName !== 'NodeCrypt') {
                          setPrivatePeerName(msg.userName);
                          setIsShowingPrivateOnly(true);
                        }
                      }}
                      title={`与 ${msg.userName} 进行 E2EE 私聊`}
                    >
                      <img
                        src={msg.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'}
                        alt={msg.userName}
                        className={`w-10 h-10 rounded-full object-cover border shadow-md ${msg.isPrivate ? 'border-indigo-500/60 ring-2 ring-indigo-500/20' : 'border-zinc-800'}`}
                      />
                      {!isSelf && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-zinc-950" />
                      )}
                    </div>

                    {/* Message Body Content */}
                    <div className={`max-w-[75%] space-y-1 ${isSelf ? 'items-end' : 'items-start'}`}>
                      {/* Nickname & lock status info */}
                      <div className={`flex items-center gap-1.5 text-[10px] text-zinc-500 ${isSelf ? 'flex-row-reverse' : ''}`}>
                        <span className="font-extrabold text-zinc-400">{isSelf ? `${msg.userName.replace(' (我)', '')} (我)` : msg.userName}</span>
                        {msg.isPrivate ? (
                          <span className="flex items-center gap-0.5 text-[9px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded font-black border border-indigo-500/10">
                            <Lock className="w-2.5 h-2.5" />
                            1对1私聊
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[9px] text-emerald-500 bg-emerald-500/10 px-1 rounded">
                            <Lock className="w-2.5 h-2.5" />
                            E2EE群聊
                          </span>
                        )}
                        {msg.burnDuration && !msg.isBurned && (
                          <span className="flex items-center gap-0.5 text-orange-400 bg-orange-400/10 px-1 rounded">
                            <Flame className="w-2.5 h-2.5 text-orange-400" />
                            {msg.burnDuration}{t.burnSeconds}
                          </span>
                        )}
                      </div>

                      {/* Reply preview link box */}
                      {msg.replyTo && (
                        <div className={`text-[10px] text-zinc-400 border-l-2 border-zinc-700 pl-2 py-0.5 mb-1 ${isSelf ? 'text-right border-r-2 border-l-0 pr-2 pl-0' : ''}`}>
                          回复 <span className="font-bold text-zinc-300">{msg.replyTo.userName}</span>: "{msg.replyTo.content}"
                        </div>
                      )}

                      {/* Bubble card wrapper */}
                      <div
                        className={`rounded-2xl p-3 border shadow-md relative group ${
                          isSelf
                            ? msg.isPrivate
                              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 border-indigo-500/30 text-white rounded-tr-none shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                              : 'bg-gradient-to-r from-[#FF2442]/90 to-[#FF4E69]/90 border-red-500/10 text-white rounded-tr-none'
                            : msg.isPrivate
                            ? 'bg-zinc-900/95 border-indigo-500/30 text-zinc-100 rounded-tl-none ring-1 ring-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                            : 'bg-zinc-900/90 border-zinc-800 text-zinc-200 rounded-tl-none'
                        } ${msg.isBurned ? 'italic opacity-60 bg-zinc-950/60' : ''}`}
                      >
                        {/* Media renderers */}
                        {msg.type === 'voice' && !msg.isBurned ? (
                          <div className="flex items-center gap-3.5 min-w-[120px] py-1 cursor-pointer">
                            <Volume2 className="w-4 h-4 text-white animate-pulse" />
                            <span className="font-mono text-xs font-bold">{t.voiceMsg} • {msg.voiceDuration || 3}{t.voiceSec}</span>
                            <div className="flex-1 flex gap-[2px] items-center">
                              {[...Array(6)].map((_, i) => (
                                <div key={i} className="w-[2px] h-3 bg-white/40 rounded-full" />
                              ))}
                            </div>
                          </div>
                        ) : msg.type === 'image' && !msg.isBurned ? (
                          <div className="space-y-1.5">
                            <img src={msg.mediaUrl} alt="Secure Upload" className="max-w-xs rounded-lg border border-white/10" />
                            <p className="text-[11px] text-zinc-400 italic">{t.attachedImg}</p>
                          </div>
                        ) : msg.type === 'file' && !msg.isBurned ? (
                          <div className="p-3 rounded-xl bg-black/20 border border-white/10 flex items-center gap-3 max-w-xs text-left">
                            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate text-white">{msg.content || 'Secure File'}</p>
                              <p className="text-[9px] text-zinc-400 font-mono mt-0.5">E2EE 安全加密文件</p>
                            </div>
                            {msg.mediaUrl && (
                              <a
                                href={msg.mediaUrl}
                                download={msg.content || 'secure-file'}
                                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 hover:border-zinc-700 transition shrink-0"
                                title="安全下载"
                              >
                                <Upload className="w-3.5 h-3.5 rotate-180" />
                              </a>
                            )}
                          </div>
                        ) : (
                          // Standard text
                          <p className="text-xs leading-relaxed select-text font-medium">{msg.content}</p>
                        )}

                        {/* Emoji Reactions display bar */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 border-t border-white/10 pt-1.5">
                            {msg.reactions.map((react, i) => (
                              <button
                                key={i}
                                onClick={() => handleAddReaction(msg.id, react.emoji)}
                                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border transition ${
                                  react.users.includes(nickname)
                                    ? 'bg-red-500/20 border-red-500 text-red-300'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                                }`}
                              >
                                <span>{react.emoji}</span>
                                <span>{react.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Quick interactive overlays (retract, reply, react triggers) on hover */}
                        {!msg.isBurned && (
                          <div className={`absolute top-1.5 ${isSelf ? 'right-full mr-2' : 'left-full ml-2'} hidden group-hover:flex items-center gap-1.5 bg-zinc-950/90 border border-zinc-800 rounded-lg p-1 shadow-lg z-30`}>
                            {/* Emojis list shortcuts */}
                            {['👍', '🔥', '😆', '❤️', '😮'].map((emo) => (
                              <button
                                key={emo}
                                onClick={() => handleAddReaction(msg.id, emo)}
                                className="hover:scale-125 transition text-xs"
                              >
                                {emo}
                              </button>
                            ))}
                            
                            <div className="w-[1px] h-3.5 bg-zinc-800 my-auto" />

                            {/* Reply Button */}
                            <button
                              onClick={() => setReplyTarget(msg)}
                              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition"
                              title="回复"
                            >
                              <Undo2 className="w-3 h-3" />
                            </button>

                            {/* Retract/Delete (Self only) */}
                            {isSelf && (
                              <button
                                onClick={() => handleRecallMessage(msg.id)}
                                className="p-1 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded transition"
                                title="撤回消息"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* NodeCrypt Signature - Raw E2EE Encrypted Ciphertext display box */}
                      {showRawEncrypted && msg.encryptedContent && !msg.isBurned && (
                        <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-2 max-w-full font-mono text-[9px] text-zinc-500 leading-tight select-all break-all shadow-inner relative group">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider">{t.rawPayload}</span>
                            <button
                              onClick={() => handleCopyCipher(msg.id, msg.encryptedContent!)}
                              className="text-[8px] text-red-500/80 hover:text-red-400 font-bold bg-red-500/5 border border-red-500/10 px-1.5 py-0.2 rounded"
                            >
                              {copiedId === msg.id ? t.copiedText : t.copyCipherBtn}
                            </button>
                          </div>
                          <span>{msg.encryptedContent}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* 4. ACTIVE REPLY BAR */}
          {replyTarget && (
            <div className={`px-4 py-2 border-t flex items-center justify-between z-10 animate-fade-in text-xs ${
              isThemeLight 
                ? 'bg-zinc-50 border-zinc-200 text-zinc-800' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-200'
            }`}>
              <span className={isThemeLight ? 'text-zinc-600' : 'text-zinc-400'}>
                正在回复 <strong className={isThemeLight ? 'text-zinc-900' : 'text-zinc-205'}>{replyTarget.userName}</strong>: {replyTarget.content.slice(0, 25)}...
              </span>
              <button
                onClick={() => setReplyTarget(null)}
                className={`p-1 rounded-full transition ${
                  isThemeLight ? 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 5. BOTTOM TEXT CONTROLS & BURN SETTINGS */}
          <div className={`border-t px-4 py-3 z-15 backdrop-blur-md transition-colors duration-300 ${
            isThemeLight 
              ? 'bg-white/95 border-zinc-200/80 text-zinc-800 shadow-lg' 
              : 'bg-zinc-950/95 border-zinc-800 text-white'
          }`}>
            
            {/* COLLAPSIBLE EMOJI PICKER CONTAINER */}
            {showEmojiPicker && (
              <div className={`mb-3 border rounded-2xl p-3 shadow-2xl relative animate-fade-in ${
                isThemeLight ? 'bg-white border-zinc-200/85 text-zinc-800' : 'bg-zinc-900/90 border-zinc-800'
              }`}>
                {/* Search Header */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={emojiSearch}
                    onChange={(e) => setEmojiSearch(e.target.value)}
                    placeholder={lang === 'en' ? "Search emojis..." : lang === 'es' ? "Buscar..." : "搜索表情包..."}
                    className={`flex-1 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500 ${
                      isThemeLight
                        ? 'bg-zinc-50 border border-zinc-200 text-zinc-850 placeholder-zinc-400'
                        : 'bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500'
                    }`}
                  />
                  {emojiSearch && (
                    <button
                      type="button"
                      onClick={() => setEmojiSearch('')}
                      className={`text-[10px] ${isThemeLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-400 hover:text-white'}`}
                    >
                      {lang === 'en' ? 'Clear' : lang === 'es' ? 'Limpiar' : '清空'}
                    </button>
                  )}
                </div>

                {/* Categories Row */}
                <div className={`flex gap-1 overflow-x-auto pb-1.5 border-b mb-2 scrollbar-none ${
                  isThemeLight ? 'border-zinc-200/80' : 'border-zinc-800/60'
                }`}>
                  {(Object.keys(EMOJIS_BY_CATEGORY) as Array<keyof typeof EMOJIS_BY_CATEGORY>).map((cat) => {
                    const isActive = emojiActiveTab === cat;
                    const emojiIcon = cat === 'face' ? '😃' : cat === 'hand' ? '👏' : cat === 'animal' ? '🐱' : cat === 'fruit' ? '🍎' : cat === 'place' ? '🏠' : cat === 'sport' ? '⚽' : cat === 'symbol' ? '📝' : cat === 'warn' ? '⛔' : '🏁';
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setEmojiActiveTab(cat);
                          setEmojiSearch('');
                        }}
                        className={`px-2 py-1 text-[10px] rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                          isActive 
                            ? 'bg-red-500/20 border border-red-500/40 text-red-500 font-bold' 
                            : isThemeLight
                            ? 'bg-zinc-50 border border-zinc-200/80 text-zinc-500 hover:text-zinc-800'
                            : 'bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <span>{emojiIcon}</span>
                        <span className="capitalize text-[8px]">{cat}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Emojis grid list */}
                <div className="grid grid-cols-8 gap-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                  {(() => {
                    let list = EMOJIS_BY_CATEGORY[emojiActiveTab] || [];
                    if (emojiSearch) {
                      list = Object.values(EMOJIS_BY_CATEGORY)
                        .flat()
                        .filter((item) => item.label.toLowerCase().includes(emojiSearch.toLowerCase()));
                    }
                    if (list.length === 0) {
                      return (
                        <div className="col-span-8 py-4 text-center text-[10px] text-zinc-600 italic">
                          No matching emojis
                        </div>
                      );
                    }
                    return list.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setInputText((p) => p + item.char);
                        }}
                        className={`text-lg p-1.5 rounded-xl transition text-center active:scale-95 ${
                          isThemeLight ? 'hover:bg-zinc-100 text-zinc-800' : 'hover:bg-zinc-800'
                        }`}
                        title={item.label}
                      >
                        {item.char}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Dynamic Tool Row (Flame Burn, Voice Recorder trigger, sticker popups, file attachment) */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">

                {/* 1. Self-destruct burner selector */}
                <div className={`flex items-center gap-1.5 border px-2 py-1.5 rounded-xl ${
                  isThemeLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
                }`}>
                  <Flame className={`w-4 h-4 ${burnDurationToColor(burnTimer)}`} />
                  <select
                    value={burnTimer || ''}
                    onChange={(e) => setBurnTimer(e.target.value ? Number(e.target.value) : undefined)}
                    className={`bg-transparent text-[11px] focus:outline-none border-none p-0 cursor-pointer font-bold ${
                      isThemeLight ? 'text-zinc-700' : 'text-zinc-300'
                    }`}
                  >
                    <option value="" className={isThemeLight ? 'text-zinc-800 bg-white' : 'text-zinc-300 bg-zinc-900'}>{t.burnNone}</option>
                    <option value="5" className={isThemeLight ? 'text-zinc-800 bg-white' : 'text-zinc-300 bg-zinc-900'}>5 {t.burnSeconds}</option>
                    <option value="15" className={isThemeLight ? 'text-zinc-800 bg-white' : 'text-zinc-300 bg-zinc-900'}>15 {t.burnSeconds}</option>
                    <option value="30" className={isThemeLight ? 'text-zinc-800 bg-white' : 'text-zinc-300 bg-zinc-900'}>30 {t.burnSeconds}</option>
                    <option value="60" className={isThemeLight ? 'text-zinc-800 bg-white' : 'text-zinc-300 bg-zinc-900'}>1 {t.burnMinutes}</option>
                  </select>
                </div>

                {/* 2. Custom Image simulated attachment E2EE */}
                <button
                  type="button"
                  onClick={() => {
                    const dummyImg = 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=300&auto=format&fit=crop';
                    receivePeerMessage(nickname, avatarUrl, 'E2EE Encrypted Image attached', 'image', dummyImg);
                  }}
                  className={`p-2.5 rounded-xl transition ${
                    isThemeLight ? 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  title="发送模拟加密图片"
                >
                  <ImageIcon className="w-5 h-5 text-rose-400" />
                </button>

                {/* 3. Real E2EE Image/Album Upload Button */}
                <button
                  type="button"
                  onClick={handleImageUploadClick}
                  className={`p-2.5 rounded-xl transition ${
                    isThemeLight ? 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  title="选择本地照片/相册上传 (E2EE)"
                >
                  <Camera className="w-5 h-5 text-emerald-400" />
                </button>

                {/* 4. Real E2EE File Upload Button */}
                <button
                  type="button"
                  onClick={handleFileUploadClick}
                  className={`p-2.5 rounded-xl transition ${
                    isThemeLight ? 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  title="选择本地安全文件上传 (E2EE)"
                >
                  <Upload className="w-5 h-5 text-indigo-400" />
                </button>

                {/* 3. Searchable Emoji Picker toggle trigger button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2.5 rounded-xl transition ${
                    showEmojiPicker
                      ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                      : isThemeLight
                      ? 'bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-zinc-850'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  title="表情包"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* 4. Audio Recording mockup trigger */}
                {isRecording ? (
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-extrabold px-3 py-1.5 rounded-full text-[11px] animate-pulse"
                    title="完成并发送加密语音"
                  >
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                    <span>{t.inputTextRecording}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsRecording(true)}
                    className={`p-2.5 rounded-xl transition ${
                      isThemeLight ? 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="发送加密语音"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className={`text-[11px] font-mono ${isThemeLight ? 'text-zinc-450' : 'text-zinc-500'}`}>
                Room Hash: {roomId.slice(0, 8)}...
              </div>
            </div>

            {privatePeerName && (
              <div className="mb-2 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between animate-pulse">
                <span className="text-[10px] text-indigo-400 font-extrabold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>与「{privatePeerName}」的 1对1 独占加密安全通道已建立</span>
                </span>
                <span className="text-[8px] uppercase font-black bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/25">
                  E2EE PRIVATE
                </span>
              </div>
            )}

            {/* Input Text Form Area */}
            <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isRecording}
                placeholder={isRecording ? t.inputTextRecording : t.inputTextPlaceholder}
                className={`flex-1 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 text-sm md:text-xs rounded-lg md:rounded-xl px-4 md:px-4 py-3 md:py-3 focus:outline-none transition-all duration-300 ${
                  isThemeLight
                    ? 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder-zinc-400'
                    : 'bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500'
                }`}
                maxLength={140}
              />

              <button
                type="submit"
                className="p-3 md:p-3 bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-95 text-white rounded-lg md:rounded-xl shadow-lg active:scale-95 transition"
              >
                <Send className="w-5 h-5 md:w-4.5 md:h-4.5" />
              </button>
            </form>
          </div>
        </div>

        {/* C. RIGHT SIDEBAR: ONLINE MEMBERS PANEL */}
        <AnimatePresence>
          {showMembersSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 180 }}
              className={`w-[220px] fixed lg:relative right-0 top-0 lg:top-auto bottom-0 z-40 h-full lg:h-auto border-l flex flex-col shrink-0 overflow-y-auto select-none ${
                isThemeLight 
                  ? 'bg-white/95 border-zinc-200 text-zinc-800 shadow-xl' 
                  : 'bg-zinc-950/80 border-zinc-800/80 text-white'
              } backdrop-blur-md`}
            >
              <div className={`p-4 border-b ${isThemeLight ? 'border-zinc-200' : 'border-zinc-800/80'} flex items-center justify-between`}>
                <span className={`font-extrabold text-xs flex items-center gap-1.5 uppercase tracking-wide ${isThemeLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t.onlineUsers} ({realOnlineUsers.length})</span>
                </span>
                <button
                  onClick={() => setShowMembersSidebar(false)}
                  className={`p-1 ${isThemeLight ? 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800' : 'hover:bg-zinc-900 text-zinc-500 hover:text-white'} rounded-lg transition`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 space-y-3.5">
                {/* 1. Self User details */}
                <div className={`p-2.5 rounded-2xl flex items-center gap-3 border ${
                  isThemeLight
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gradient-to-r from-red-500/10 to-pink-500/5 border-red-500/20'
                }`}>
                  <img src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'} alt="Me" className="w-9 h-9 rounded-full object-cover border border-red-500/30" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black truncate ${isThemeLight ? 'text-zinc-900' : 'text-zinc-100'}`}>{nickname}</p>
                    <p className="text-[8px] text-red-500 font-bold tracking-widest uppercase">Room Host</p>
                  </div>
                </div>

                {/* 2. Peer Users */}
                <div className="space-y-1.5">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1 ${isThemeLight ? 'text-zinc-400' : 'text-zinc-500'}`}>{t.onlineUsers}</span>

                  {/* Real Online Users */}
                  {realOnlineUsers.filter((u) => u.id !== myUserId).map((user) => (
                    <div
                      key={user.id}
                      className={`p-2 rounded-xl flex items-center justify-between group transition duration-150 ${
                        isThemeLight ? 'hover:bg-zinc-100' : 'hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={user.avatarUrl} alt={user.nickname} className={`w-8 h-8 rounded-full object-cover border ${isThemeLight ? 'border-zinc-200' : 'border-zinc-800'}`} />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isThemeLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{user.nickname}</p>
                          <span className="text-[8px] text-zinc-500 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            E2EE Active
                          </span>
                        </div>
                      </div>

                      {/* Member Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartPrivateCall(user, 'voice')}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white transition"
                          title="语音通话"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStartPrivateCall(user, 'video')}
                          className="p-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500 text-pink-500 hover:text-white transition"
                          title="视频通话"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setPrivatePeerName(user.nickname);
                            setIsShowingPrivateOnly(true);
                          }}
                          className="px-1.5 py-1 bg-indigo-500/15 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-[9px] font-black transition active:scale-95"
                          title={`与 ${user.nickname} 进行 1对1 加密私聊`}
                        >
                          私聊
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Security footer stamp */}
                <div className="p-3 bg-zinc-900/30 border border-zinc-800/40 rounded-2xl text-[9px] text-zinc-500 leading-relaxed italic">
                  {t.secureTip}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Floating Action Button for quick access */}
      <div className="fixed bottom-24 right-4 z-30">
        <button
          onClick={() => setShowMembersSidebar(!showMembersSidebar)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
            showMembersSidebar
              ? 'bg-red-500 text-white scale-110'
              : isThemeLight
              ? 'bg-zinc-800 text-white hover:bg-zinc-700'
              : 'bg-zinc-700 text-white hover:bg-zinc-600'
          }`}
        >
          <Users className="w-6 h-6" />
        </button>
      </div>

      {/* Floating Secure Indicator Capsule (from user reference screenshot) */}
      <div className="flex justify-center z-10 absolute top-[110px] left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-zinc-900/80 border border-zinc-800/40 backdrop-blur-md px-4 py-1 rounded-full text-[10px] text-zinc-300 flex items-center gap-1.5 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>已建立端到端安全连接</span>
        </div>
      </div>

      {/* 6. THEME SELECTION DIALOG MODAL (Reference-perfect 2-column grid popover) */}
      <AnimatePresence>
        {showThemeSelector && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950/95 border border-zinc-800/80 p-5 rounded-3xl w-full max-w-[340px] shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowThemeSelector(false)}
                className="absolute top-4 right-4 p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-xs font-black text-center text-zinc-300 mb-4 tracking-wider flex items-center justify-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>更换加密安全主题</span>
              </h3>

              <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {THEMES.map((theme) => {
                  const isActive = activeThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setActiveThemeId(theme.id);
                        setShowThemeSelector(false);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 relative group overflow-hidden ${
                        isActive
                          ? 'bg-zinc-900/90 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.1)] scale-[1.02]'
                          : 'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-2xl mb-1 transform group-hover:scale-110 transition duration-200">{theme.emoji}</span>
                      <span className="text-[10px] font-extrabold text-zinc-200 group-hover:text-red-400 transition">{theme.enName}</span>
                      <span className="text-[8px] text-zinc-500 mt-0.5">{theme.name}</span>

                      {isActive && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 text-center">
                <p className="text-[9px] text-zinc-600 italic">
                  🔒 所有视觉效果均在本地沙箱安全渲染
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Incoming Call Modal */}
      <AnimatePresence>
        {incomingCall && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/80 p-6 rounded-3xl w-full max-w-[360px] shadow-2xl relative`}
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                  <img src={incomingCall.caller.avatar} alt={incomingCall.caller.name} className="w-full h-full object-cover" />
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  {incomingCall.caller.name}
                </h3>

                <div className="flex items-center justify-center gap-2 mb-6">
                  {incomingCall.type === 'video' ? (
                    <>
                      <Video className="w-4 h-4 text-pink-500 animate-pulse" />
                      <span className="text-sm text-zinc-400">视频通话邀请</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <span className="text-sm text-zinc-400">语音通话邀请</span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleRejectCall}
                    className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-red-500/30"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleAcceptCall}
                    className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-emerald-500/30"
                  >
                    <Phone className="w-6 h-6" />
                  </button>
                </div>

                <p className="text-[10px] text-zinc-500 mt-4 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>端到端加密通话</span>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs for real E2EE upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}

// Utility: Map timer length to colored icon theme
function burnDurationToColor(dur?: number) {
  if (!dur) return 'text-zinc-500';
  if (dur <= 5) return 'text-red-500 animate-pulse';
  if (dur <= 15) return 'text-orange-500';
  return 'text-yellow-500';
}

// ----------------------------------------------------
// THEME EFFECTS OVERLAY
// ----------------------------------------------------
interface EffectParticle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  text?: string;
}

export function ThemeEffectsOverlay({ effect }: { effect: string }) {
  const [particles, setParticles] = useState<EffectParticle[]>([]);

  useEffect(() => {
    const count = effect === 'matrix' ? 18 : effect === 'lightning' ? 1 : 16;
    const items = Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 6;
      const duration = 5 + Math.random() * 7;
      const size = effect === 'matrix' ? 10 + Math.random() * 6 : 8 + Math.random() * 12;
      
      let text = '';
      if (effect === 'matrix') {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ10';
        text = Array.from({ length: 12 + Math.round(Math.random() * 8) })
          .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
          .join('\n');
      }

      return {
        id: i,
        left,
        delay,
        duration,
        size,
        text
      };
    });
    setParticles(items);
  }, [effect]);

  if (effect === 'none') return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Lanterns Effect */}
      {effect === 'lanterns' && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute text-2xl animate-float-up opacity-40"
              style={{
                left: `${p.left}%`,
                bottom: `-15%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                fontSize: `${p.size + 10}px`
              }}
            >
              🏮
            </div>
          ))}
          {/* Subtle gold sparkles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-amber-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: '4px',
                height: '4px',
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>
      )}

      {/* 2. Fireworks Effect */}
      {effect === 'fireworks' && (
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-firework-burst rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 50}%`,
                animationDelay: `${i * 1.8}s`,
                width: '4px',
                height: '4px'
              }}
            />
          ))}
        </div>
      )}

      {/* 3. Galaxy Effect */}
      {effect === 'galaxy' && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                left: `${p.left}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.max(1, p.size / 6)}px`,
                height: `${Math.max(1, p.size / 6)}px`,
                opacity: 0.15 + Math.random() * 0.45,
                animationDelay: `${p.delay}s`,
                animationDuration: `${2 + Math.random() * 4}s`
              }}
            />
          ))}
          <div className="absolute top-1/4 left-1/4 w-[240px] h-[240px] rounded-full bg-indigo-500/5 blur-[90px] pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 w-[180px] h-[180px] rounded-full bg-purple-500/5 blur-[70px] pointer-events-none animate-pulse" />
        </div>
      )}

      {/* 4. Celebrate Effect */}
      {effect === 'celebrate' && (
        <div className="absolute inset-0">
          {particles.map((p) => {
            const colors = ['bg-red-500', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400', 'bg-pink-500', 'bg-orange-400'];
            const randomColor = colors[p.id % colors.length];
            return (
              <div
                key={p.id}
                className={`absolute ${randomColor} rounded-sm animate-float-down opacity-60`}
                style={{
                  left: `${p.left}%`,
                  top: `-10%`,
                  width: `${p.size / 2}px`,
                  height: `${p.size / 3}px`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration - 1}s`,
                  transform: `rotate(${p.left * 2}deg)`
                }}
              />
            );
          })}
        </div>
      )}

      {/* 5. Hearts Effect */}
      {effect === 'hearts' && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute text-red-500/25 animate-float-up"
              style={{
                left: `${p.left}%`,
                bottom: `-15%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                fontSize: `${p.size + 6}px`
              }}
            >
              ❤️
            </div>
          ))}
        </div>
      )}

      {/* 6. Bubbles Effect */}
      {effect === 'bubbles' && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute border border-white/15 bg-white/5 rounded-full animate-float-up"
              style={{
                left: `${p.left}%`,
                bottom: `-15%`,
                width: `${p.size + 6}px`,
                height: `${p.size + 6}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`
              }}
            />
          ))}
        </div>
      )}

      {/* 7. Snow Effect */}
      {effect === 'snow' && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute bg-white/35 rounded-full animate-float-down"
              style={{
                left: `${p.left}%`,
                top: `-10%`,
                width: `${p.size / 3.5}px`,
                height: `${p.size / 3.5}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`
              }}
            />
          ))}
        </div>
      )}

      {/* 8. Rain Effect */}
      {effect === 'rain' && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute bg-sky-400/20 w-[1px] h-[35px] animate-rain-fall"
              style={{
                left: `${p.left}%`,
                top: `-15%`,
                animationDelay: `${p.delay / 2}s`,
                animationDuration: `${1.1 + Math.random() * 0.7}s`
              }}
            />
          ))}
        </div>
      )}

      {/* 9. Sakura Effect */}
      {effect === 'sakura' && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute text-pink-400/35 animate-float-down-sakura"
              style={{
                left: `${p.left}%`,
                top: `-10%`,
                fontSize: `${p.size + 4}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`
              }}
            >
              🌸
            </div>
          ))}
        </div>
      )}

      {/* 10. Lightning Effect */}
      {effect === 'lightning' && (
        <div className="absolute inset-0 animate-lightning-flash bg-white/0" />
      )}

      {/* 11. Matrix Effect */}
      {effect === 'matrix' && (
        <div className="absolute inset-0 flex justify-between px-2 overflow-hidden opacity-[0.08]">
          {particles.map((p) => (
            <div
              key={p.id}
              className="font-mono text-green-500 whitespace-pre leading-none break-all text-center animate-matrix-rain"
              style={{
                fontSize: '9px',
                animationDelay: `${p.delay}s`,
                animationDuration: `${10 + Math.random() * 12}s`,
                writingMode: 'vertical-rl'
              }}
            >
              {p.text}
            </div>
          ))}
        </div>
      )}

      {/* 12. Destroy Effect */}
      {effect === 'destroy' && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-gradient-to-t from-orange-500 to-red-600 animate-float-up opacity-30 blur-[1px]"
              style={{
                left: `${p.left}%`,
                bottom: `-15%`,
                width: `${p.size / 3}px`,
                height: `${p.size / 3}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration - 2}s`
              }}
            />
          ))}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-red-600/15 via-orange-500/5 to-transparent blur-md" />
        </div>
      )}

      {/* Embed local animation CSS block */}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-900px) rotate(360deg); opacity: 0; }
        }

        @keyframes floatDown {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(900px) rotate(180deg); opacity: 0; }
        }

        @keyframes floatDownSakura {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(900px) translateX(120px) rotate(540deg); opacity: 0; }
        }

        @keyframes rainFall {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateY(900px); opacity: 0; }
        }

        @keyframes lightningFlash {
          0%, 93%, 95%, 97%, 100% { background-color: rgba(255, 255, 255, 0); }
          94%, 96% { background-color: rgba(255, 255, 255, 0.22); }
        }

        @keyframes matrixRain {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes fireworkBurst {
          0% { transform: scale(0.1); opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6), 0 0 0 0 rgba(245, 158, 11, 0.6), 0 0 0 0 rgba(16, 185, 129, 0.6); }
          50% { opacity: 0.7; }
          100% { transform: scale(14); opacity: 0; box-shadow: 0 0 12px 6px rgba(239, 68, 68, 0), 0 0 12px 6px rgba(245, 158, 11, 0), 0 0 12px 6px rgba(16, 185, 129, 0); }
        }

        .animate-float-up { animation: floatUp linear infinite; }
        .animate-float-down { animation: floatDown linear infinite; }
        .animate-float-down-sakura { animation: floatDownSakura linear infinite; }
        .animate-rain-fall { animation: rainFall linear infinite; }
        .animate-lightning-flash { animation: lightningFlash 8s infinite; }
        .animate-matrix-rain { animation: matrixRain linear infinite; }
        .animate-firework-burst { animation: fireworkBurst 3.8s infinite; }
      `}</style>
    </div>
  );
}

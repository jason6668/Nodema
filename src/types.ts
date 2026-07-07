export interface CoHost {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isSpeaking: boolean;
  role: 'host' | 'co-host' | 'audience';
  stream?: MediaStream | null;
  isVideoEnabled?: boolean;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  content: string; // Decrypted content (only shown in UI if key matches)
  encryptedContent?: string; // Ciphertext sent through the wire
  type: 'text' | 'gift' | 'system' | 'join' | 'voice' | 'image' | 'file';
  giftName?: string;
  giftIcon?: string;
  giftCount?: number;
  replyTo?: {
    id: string;
    userName: string;
    content: string;
  };
  reactions?: MessageReaction[];
  burnDuration?: number; // Seconds until deletion
  burnTimerStartedAt?: number; // Timestamp when read
  isBurned?: boolean;
  voiceDuration?: number; // Seconds for voice message
  mediaUrl?: string; // Image or file attachment
  isPrivate?: boolean; // E2EE private message
  privateTo?: string; // Recipient user name for private E2EE chat
}

export interface DanmakuMessage {
  id: string;
  content: string;
  color: string;
  top: number; // percentage from top (e.g. 10 to 60)
  speed: number; // duration in seconds
}

export interface Gift {
  id: string;
  name: string;
  icon: string;
  cost: number;
  label: string;
  animationType: 'pop' | 'fly-right' | 'rocket' | 'sparkle' | 'car';
}

export interface LivePoll {
  question: string;
  options: { text: string; votes: number }[];
  totalVotes: number;
  isActive: boolean;
}

export type LiveMode = 'voice' | 'default' | 'game' | 'pc';

export interface RoomSettings {
  title: string;
  coverImage: string;
  intro: string;
  isPublic: boolean;
  mode: LiveMode;
  themeId: string;
}

export interface RoomTheme {
  id: string;
  name: string;
  className: string;
  previewBg: string;
}

export const ROOM_THEMES: RoomTheme[] = [
  {
    id: 'space',
    name: '星空深空',
    className: 'bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A]',
    previewBg: 'from-[#0F172A] to-[#1E293B]'
  },
  {
    id: 'sunset',
    name: '落日余晖',
    className: 'bg-gradient-to-b from-[#2E1065] via-[#4C1D95] to-[#1E1B4B]',
    previewBg: 'from-[#2E1065] to-[#4C1D95]'
  },
  {
    id: 'neon',
    name: '赛博霓虹',
    className: 'bg-gradient-to-b from-[#180024] via-[#0D0B21] to-[#02000A]',
    previewBg: 'from-[#180024] to-[#0D0B21]'
  },
  {
    id: 'studio',
    name: '暖光录音棚',
    className: 'bg-gradient-to-b from-[#271E1C] via-[#1C1614] to-[#120E0D]',
    previewBg: 'from-[#271E1C] to-[#1C1614]'
  },
  {
    id: 'forest',
    name: '深林静谧',
    className: 'bg-gradient-to-b from-[#064E3B] via-[#022C22] to-[#011C14]',
    previewBg: 'from-[#064E3B] to-[#022C22]'
  }
];

export const AVAILABLE_GIFTS = [
  { id: 'lollipop', name: '棒棒糖', icon: '🍭', cost: 1, label: '送出一个甜甜的棒棒糖', animationType: 'pop' },
  { id: 'beer', name: '能量饮料', icon: '🥤', cost: 10, label: '为你送上冰镇能量饮料', animationType: 'fly-right' },
  { id: 'heart', name: '比心', icon: '💖', cost: 20, label: '比了一个大大的心', animationType: 'sparkle' },
  { id: 'supercar', name: '超跑', icon: '🏎️', cost: 120, label: '开着豪华超跑炫酷登场', animationType: 'car' },
  { id: 'rocket', name: '火箭升空', icon: '🚀', cost: 520, label: '点燃火箭送主播上热门', animationType: 'rocket' }
] as const;

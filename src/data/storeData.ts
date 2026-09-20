import { PSPlusPlan, VBucksPack, RocketPack, HezoService } from '../types';

export const plusEssentialOptions = [
  {
    duration: '1m',
    title: '1 Month Essential',
    prices: { prim5: 485, prim4: 250 }
  },
  {
    duration: '3m',
    title: '3 Months Essential',
    prices: { prim5: 900, prim4: 400, sec: 200 }
  },
  {
    duration: '12m',
    title: '12 Months Essential',
    prices: { prim5: 1875, prim4: 700, sec: 400, full: 3000 }
  }
];

export const plusData: PSPlusPlan[] = [
  {
    id: 'essential',
    name: 'Essential',
    color: '#3b82f6',
    badge: 'Standard',
    basePrices: {
      '1m_p': 485,
      '3m_p': 900,
      '12m_p': 1875,
      '1m_s': 250,
      '3m_s': 200,
      '12m_s': 400,
    },
    features: [
      'Monthly downloadable games',
      'Online multiplayer access',
      'Exclusive store discounts',
      'Cloud storage for saved games'
    ]
  },
  {
    id: 'extra',
    name: 'Extra',
    color: '#8b5cf6',
    badge: 'Most Popular',
    basePrices: {
      '1m_p': 650,
      '3m_p': 1300,
      '12m_p': 2950,
      '1m_s': 350,
      '3m_s': 700,
      '12m_s': 1500,
    },
    features: [
      'All Essential benefits',
      'Catalog of up to 400 PS4 & PS5 games',
      'Ubisoft+ Classics catalog access',
      'Regular game updates & rotation'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    color: '#ec4899',
    badge: 'Ultimate Tier',
    basePrices: {
      '1m_p': 850,
      '3m_p': 1750,
      '12m_p': 3800,
      '1m_s': 450,
      '3m_s': 900,
      '12m_s': 1950,
    },
    features: [
      'All Essential & Extra benefits',
      'Classics catalog (PS1, PS2, PS3, PSP)',
      'Game time-limited trials',
      'Cloud streaming for select titles'
    ]
  }
];

export const vBucksData: VBucksPack[] = [
  { id: 'vb800', amount: 800, price: 280, bonus: 'Standard Pack' },
  { id: 'vb2400', amount: 2400, price: 470, bonus: '+200 Bonus', popular: true },
  { id: 'vb4500', amount: 4500, price: 750, bonus: '+500 Bonus' },
  { id: 'vb12500', amount: 12500, price: 1750, bonus: '+2,500 Bonus', popular: true }
];

export const rocketData: RocketPack[] = [
  { id: 'rc500', name: '500 Credits', credits: 500, price: 550 },
  { id: 'rc1100', name: '1100 Credits', credits: 1100, price: 720 },
  { id: 'rc3000', name: '3000 Credits', credits: 3000, price: 1150 },
  { id: 'rc6500', name: '6500 Credits', credits: 6500, price: 2000 },
  { id: 'rc_pass', name: 'Rocket Pass', price: 450, isPass: true }
];

export interface SocialPlatformService {
  platform: 'tiktok' | 'instagram';
  category: 'views' | 'likes' | 'followers' | 'comments';
  title: string;
  packages: { quantity: number; price: number }[];
}

export const socialServices: SocialPlatformService[] = [
  // TikTok
  {
    platform: 'tiktok',
    category: 'views',
    title: 'TikTok Views',
    packages: [
      { quantity: 1000, price: 90 },
      { quantity: 2000, price: 160 },
      { quantity: 3000, price: 230 },
      { quantity: 4000, price: 340 },
      { quantity: 5000, price: 475 },
    ]
  },
  {
    platform: 'tiktok',
    category: 'likes',
    title: 'TikTok Likes',
    packages: [
      { quantity: 1000, price: 60 },
      { quantity: 2000, price: 90 },
      { quantity: 3000, price: 120 },
      { quantity: 4000, price: 175 },
    ]
  },
  {
    platform: 'tiktok',
    category: 'followers',
    title: 'TikTok Followers',
    packages: [
      { quantity: 1000, price: 175 },
      { quantity: 2000, price: 280 },
      { quantity: 3000, price: 390 },
    ]
  },
  {
    platform: 'tiktok',
    category: 'comments',
    title: 'TikTok Custom Comments',
    packages: [
      { quantity: 50, price: 80 },
      { quantity: 100, price: 130 },
      { quantity: 200, price: 200 },
      { quantity: 1000, price: 275 },
    ]
  },

  // Instagram
  {
    platform: 'instagram',
    category: 'followers',
    title: 'Instagram Followers',
    packages: [
      { quantity: 1000, price: 80 },
      { quantity: 2000, price: 120 },
      { quantity: 3000, price: 160 },
    ]
  },
  {
    platform: 'instagram',
    category: 'likes',
    title: 'Instagram Likes',
    packages: [
      { quantity: 1000, price: 60 },
      { quantity: 2000, price: 90 },
      { quantity: 3000, price: 150 },
    ]
  }
];

export const hezoData: HezoService[] = [
  { id: 'tiktok_views', name: 'TikTok Views', icon: 'eye', pricePer1k: 90, unit: 'views', minQty: 1000, maxQty: 5000, step: 1000 },
  { id: 'tiktok_likes', name: 'TikTok Likes', icon: 'heart', pricePer1k: 60, unit: 'likes', minQty: 1000, maxQty: 4000, step: 1000 },
  { id: 'tiktok_followers', name: 'TikTok Followers', icon: 'user-plus', pricePer1k: 175, unit: 'followers', minQty: 1000, maxQty: 3000, step: 1000 },
  { id: 'tiktok_comments', name: 'TikTok Comments', icon: 'message-square', pricePer1k: 275, unit: 'comments', minQty: 50, maxQty: 1000, step: 50 },
  { id: 'ig_followers', name: 'Instagram Followers', icon: 'user-plus', pricePer1k: 80, unit: 'followers', minQty: 1000, maxQty: 3000, step: 1000 },
  { id: 'ig_likes', name: 'Instagram Likes', icon: 'heart', pricePer1k: 60, unit: 'likes', minQty: 1000, maxQty: 3000, step: 1000 },
];

export const paymentMethods = [
  {
    id: 'paymob',
    title: 'Paymob',
    subtitle: 'Cards & Mobile Wallets',
    handle: 'Visa • Mastercard • Meeza • Wallets',
    copyValue: 'Paymob Gateway (Visa, Mastercard, Meeza, Vodafone Cash, Orange Cash, Etisalat, WE Pay)',
    icon: 'credit-card',
    note: 'Direct Cards (Visa/Mastercard/Meeza) & Mobile Wallets (Vodafone Cash, etc.)',
    cards: ['Visa', 'Mastercard', 'Meeza'],
    wallets: ['Vodafone Cash', 'Orange Cash', 'Etisalat Cash', 'WE Pay']
  },
  {
    id: 'telda',
    title: 'Telda',
    subtitle: 'Telda App Transfer',
    handle: '@selimahmed1',
    copyValue: '@selimahmed1',
    icon: 'wallet',
    note: 'Click to copy handle'
  },
  {
    id: 'instapay',
    title: 'InstaPay',
    subtitle: 'Instant Bank & Mobile Transfer',
    handle: '01212072882',
    copyValue: '01212072882',
    icon: 'phone-call',
    note: 'Click to copy number'
  }
];

export const WHATSAPP_NUMBER = '201042240852';
export const WHATSAPP_DISPLAY = '01042240852';


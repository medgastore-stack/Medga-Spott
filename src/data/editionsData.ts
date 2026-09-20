import { PlatformType } from '../types';

export interface EditionPerk {
  name: string;
  category: 'content' | 'currency' | 'access' | 'cosmetics';
  standard: boolean | string;
  deluxeOrUltimate: boolean | string;
  description: string;
}

export interface GameEditionOption {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  isPopular?: boolean;
  prices: Partial<Record<PlatformType, number>>;
}

export interface GameComparisonData {
  gameId: string;
  title: string;
  publisher: string;
  genre: string;
  icon: string;
  description: string;
  standardEdition: GameEditionOption;
  ultimateEdition: GameEditionOption;
  perks: EditionPerk[];
  verdict: {
    standardRecommend: string;
    ultimateRecommend: string;
  };
}

export const comparisonGames: GameComparisonData[] = [
  {
    gameId: 'fc27',
    title: 'EA Sports FC 27',
    publisher: 'Electronic Arts',
    genre: 'Sports / Football Simulation',
    icon: 'trophy',
    description: 'The world’s game with next-gen HyperMotion V, updated clubs, and revolutionary Career & Ultimate Team modes.',
    standardEdition: {
      id: 'fc27_std',
      name: 'Standard Edition',
      tagline: 'The complete football simulation experience',
      badge: 'Best Value',
      prices: {
        prim5: 1775,
        prim4: 800,
        sec: 950,
        full: 3550,
      },
    },
    ultimateEdition: {
      id: 'fc27_ult',
      name: 'FC ULTIMATE EDITION 🔥',
      tagline: '7 Days Early Access + 4,600 FC Points + Full Access shareable with 3 people',
      badge: 'Ultimate Choice 🔥',
      isPopular: true,
      prices: {
        prim5: 3500,
        prim4: 1800,
        sec: 2400,
        full: 6000,
      },
    },
    perks: [
      {
        name: 'Full Base Game (PS4 & PS5)',
        category: 'content',
        standard: true,
        deluxeOrUltimate: true,
        description: 'Cross-gen dual entitlement to play on both PlayStation 4 & PlayStation 5 consoles.',
      },
      {
        name: '7 Days Early Access',
        category: 'access',
        standard: false,
        deluxeOrUltimate: '7 Days Early',
        description: 'Start playing a full week before the official global worldwide street date.',
      },
      {
        name: 'FC Points Currency',
        category: 'currency',
        standard: false,
        deluxeOrUltimate: '4,600 FC Points',
        description: 'Huge points bundle worth over 1,200 L.E to open packs in Ultimate Team or draft entries.',
      },
      {
        name: 'Untradeable UEFA Hero Player Item',
        category: 'cosmetics',
        standard: false,
        deluxeOrUltimate: 'Guaranteed 88+ Hero',
        description: 'Exclusive pre-order UCL/UWCL Hero item on launch day.',
      },
      {
        name: 'Nike Air Zoom / Clubs Cosmetics',
        category: 'cosmetics',
        standard: 'Standard Boots',
        deluxeOrUltimate: 'Exclusive VIP Apparel & Vanity',
        description: 'Special edition kits, customized goal fireworks, and signature boots.',
      },
      {
        name: 'Manager Career 5-Star Coach & Scout',
        category: 'content',
        standard: false,
        deluxeOrUltimate: true,
        description: 'Accelerate youth development and tactics in offline Career Mode.',
      },
      {
        name: 'Clubs PlayStyles Slot Unlocked',
        category: 'access',
        standard: 'Level-locked',
        deluxeOrUltimate: 'Unlocked Immediately',
        description: 'Additional trait slot unlocked instantly to boost your Pro.',
      },
    ],
    verdict: {
      standardRecommend: 'Ideal for casual players, career mode fans, and local co-op play with friends.',
      ultimateRecommend: 'Essential for competitive Ultimate Team players wanting early market access & 4,600 FC Points.',
    },
  },
  {
    gameId: 'gta6',
    title: 'Grand Theft Auto VI',
    publisher: 'Rockstar Games',
    genre: 'Open World / Crime Action',
    icon: 'car',
    description: 'Explore the neon-soaked streets of Vice City and the state of Leonida in the biggest gaming launch in history.',
    standardEdition: {
      id: 'gta6_std',
      name: 'Standard Edition',
      tagline: 'Complete Vice City Campaign & Online',
      badge: 'Core Experience',
      prices: {
        prim5: 2200,
        sec: 1600,
        full: 3700,
      },
    },
    ultimateEdition: {
      id: 'gta6_ult',
      name: 'Ultimate Criminal Edition',
      tagline: 'Exclusive Story Heist + Vice City Online Enterprise Pack + $2M Cash',
      badge: 'Ultimate Collector',
      isPopular: true,
      prices: {
        prim5: 2775,
        sec: 2000,
        full: 4720,
      },
    },
    perks: [
      {
        name: 'Full Campaign & Next-Gen Vice City',
        category: 'content',
        standard: true,
        deluxeOrUltimate: true,
        description: 'Full story of Lucia and Jason across massive state of Leonida.',
      },
      {
        name: 'Vice Online Cash Starter',
        category: 'currency',
        standard: '$500,000 Cash',
        deluxeOrUltimate: '$2,500,000 GTA Cash',
        description: 'In-game cash instantly deposited to your Maze Bank account for weapons and properties.',
      },
      {
        name: 'Exclusive Story Bonus Heist',
        category: 'content',
        standard: false,
        deluxeOrUltimate: 'Included (Ocean Drive Vault)',
        description: 'A bespoke high-stakes heist storyline exclusive to premium edition buyers.',
      },
      {
        name: 'Vice City Executive Garage & 3 Supercars',
        category: 'cosmetics',
        standard: false,
        deluxeOrUltimate: '3 Exotic Tuners + 10-Car Garage',
        description: 'Immediate access to exotic custom vehicles on day one.',
      },
      {
        name: 'Custom Outfits & Weapon Skins',
        category: 'cosmetics',
        standard: 'Basic Wardrobe',
        deluxeOrUltimate: 'Vintage 80s & Miami Vice Sets',
        description: 'Exclusive character customizations for Jason & Lucia in story & online.',
      },
      {
        name: 'Priority Server Access & VIP Badge',
        category: 'access',
        standard: false,
        deluxeOrUltimate: 'VIP Player Status',
        description: 'Faster matchmaking and unique player profile emblem in online lobbies.',
      },
    ],
    verdict: {
      standardRecommend: 'Perfect for single-player story lovers who want the full Vice City narrative.',
      ultimateRecommend: 'Recommended for online players who want the starting enterprise, $2.5M, and exclusive heists.',
    },
  },
  {
    gameId: 'spiderman2',
    title: "Marvel's Spider-Man 2",
    publisher: 'PlayStation Studios / Insomniac',
    genre: 'Action Adventure / Superhero',
    icon: 'spider',
    description: 'Peter Parker and Miles Morales return in an epic battle against Kraven the Hunter, Lizard, and the monstrous Venom.',
    standardEdition: {
      id: 'spiderman2_std',
      name: 'Standard Edition',
      tagline: 'Complete Peter & Miles story with all 65+ in-game suits',
      badge: 'Core Story',
      prices: {
        prim5: 1099,
        sec: 550,
        full: 2200,
      },
    },
    ultimateEdition: {
      id: 'spiderman2_dlx',
      name: 'Digital Deluxe Edition',
      tagline: '10 Exclusive Deluxe Suits + 5 Skill Points + Photo Mode Items',
      badge: 'Fan Favorite',
      isPopular: true,
      prices: {
        prim5: 1399,
        sec: 700,
        full: 2750,
      },
    },
    perks: [
      {
        name: 'Full Campaign & Open-World NYC',
        category: 'content',
        standard: true,
        deluxeOrUltimate: true,
        description: 'Instant fast-travel across Manhattan, Queens, and Brooklyn.',
      },
      {
        name: 'Exclusive Deluxe Suits',
        category: 'cosmetics',
        standard: '65 standard unlockable suits',
        deluxeOrUltimate: '10 Unique Artist-Designed Suits',
        description: '5 suits for Peter Parker and 5 suits for Miles Morales designed by renowned guest comic artists.',
      },
      {
        name: 'Skill Points Headstart',
        category: 'access',
        standard: 'Earn via gameplay',
        deluxeOrUltimate: '5 Skill Points immediately',
        description: 'Jumpstart your abilities with instant early skill points.',
      },
      {
        name: 'Early Web Grabber Gadget',
        category: 'access',
        standard: 'Unlock at level 8',
        deluxeOrUltimate: 'Unlocked from Start',
        description: 'Pull enemies and environmental hazards together from the start of the game.',
      },
      {
        name: 'Photo Mode Custom Frames & Stickers',
        category: 'cosmetics',
        standard: 'Standard Kit',
        deluxeOrUltimate: 'Exclusive Deluxe Photo Mode Kit',
        description: 'Unique custom lighting, frames, and comic stickers for capturing screenshots.',
      },
    ],
    verdict: {
      standardRecommend: 'Great for players who only care about beating the main storyline.',
      ultimateRecommend: 'Best for Marvel enthusiasts who want all exclusive suits and quick character progression.',
    },
  },
];

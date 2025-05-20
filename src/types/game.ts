export enum DogeMood {
  HAPPY = 'happy',
  NEUTRAL = 'neutral',
  SAD = 'sad',
  SLEEPY = 'sleepy',
  EXCITED = 'excited',
}

export enum DogeAnimation {
  IDLE = 'idle',
  TAP = 'tap',
  FEED = 'feed',
  PLAY = 'play',
  SLEEP = 'sleep',
}

export interface Animation {
  type: DogeAnimation;
  duration: number;
  startTime: number;
}

export interface GameItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'food' | 'toy' | 'accessory' | 'credit';
  energyBoost?: number;
  happinessBoost?: number;
  accessoryType?: 'hat' | 'glasses' | 'collar';
  imageUrl?: string;
  creditAmount?: number;
}
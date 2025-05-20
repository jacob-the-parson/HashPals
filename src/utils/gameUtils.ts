import { DogeMood } from '../types/game';

export const getDogeCurrentMood = (happiness: number, energy: number): DogeMood => {
  if (energy < 30) {
    return DogeMood.SLEEPY;
  }
  
  if (happiness > 80) {
    return DogeMood.EXCITED;
  } else if (happiness > 60) {
    return DogeMood.HAPPY;
  } else if (happiness > 40) {
    return DogeMood.NEUTRAL;
  } else {
    return DogeMood.SAD;
  }
};

export const generateRandomCoins = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};
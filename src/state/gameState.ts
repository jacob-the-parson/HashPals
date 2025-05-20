import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define accessory and inventory types
export interface Accessory {
  id: string;
  name: string;
  description: string;
  type: 'hat' | 'glasses' | 'collar';
  imageUrl?: string;
  equipped: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'food' | 'toy';
  energyBoost?: number;
  happinessBoost?: number;
  quantity: number;
  imageUrl?: string;
}

export interface DailyReward {
  day: number;
  claimed: boolean;
  reward: {
    type: 'coins' | 'item';
    value: number;
    itemId?: string;
  };
}

// Available game scenes
export type GameScene = 'warehouse' | 'town' | 'park' | 'city';

export interface GameState {
  coins: number;
  happiness: number;
  energy: number;
  aiCredits: number; // Credits for AI interactions
  lastFed: number;
  lastPlayed: number;
  lastActive: number;
  lastHappinessUpdate: number; // Track when we last updated happiness for decay
  lastEnergyUpdate: number; // Track when we last updated energy for decay during mining
  isMining: boolean; // Track if currently mining
  miningSpeed: number;
  miningUpgradeCost: number;
  accessories: Accessory[];
  inventory: InventoryItem[];
  currentScene: GameScene; // Current background scene
  unlockedScenes: Record<GameScene, boolean>; // Track which scenes are unlocked
  dailyRewards: {
    lastClaimDate: number;
    currentStreak: number;
    maxStreak: number;
    rewards: DailyReward[];
  };
  feeding: {
    dailyAllowance: number;      // Maximum daily feeds
    remainingAllowance: number;  // Remaining feeds for today
    lastAllowanceDate: number;   // Date when allowance was last reset
  };
  // Actions
  earnCoins: (amount: number) => void;
  addAiCredits: (amount: number) => void;
  useAiCredit: () => boolean;
  feed: () => void;
  play: () => void;
  pet: () => void;
  buyItem: (item: any) => void;
  upgradeMiningSpped: () => void;
  useInventoryItem: (itemId: string) => void;
  equipAccessory: (accessoryId: string) => void;
  unequipAccessory: (accessoryType: 'hat' | 'glasses' | 'collar') => void;
  claimDailyReward: () => void;
  updateLastActive: () => void;
  updateHappiness: () => void; // Update happiness with decay
  updateMiningEnergy: () => void; // Update energy with decay during mining
  startMining: () => void; // Start mining
  stopMining: () => void; // Stop mining
  setScene: (scene: GameScene) => void; // Change current scene
  unlockScene: (scene: GameScene, cost: number) => void; // Unlock a new scene
  resetStats: () => void;
}

// Initial daily rewards
const initialDailyRewards: DailyReward[] = [
  { day: 1, claimed: false, reward: { type: 'coins', value: 50 } },
  { day: 2, claimed: false, reward: { type: 'coins', value: 100 } },
  { day: 3, claimed: false, reward: { type: 'item', value: 1, itemId: 'premium_food' } },
  { day: 4, claimed: false, reward: { type: 'coins', value: 150 } },
  { day: 5, claimed: false, reward: { type: 'coins', value: 200 } },
  { day: 6, claimed: false, reward: { type: 'item', value: 1, itemId: 'super_toy' } },
  { day: 7, claimed: false, reward: { type: 'coins', value: 500 } },
];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      coins: 100,
      happiness: 70,
      energy: 80,
      aiCredits: 5, // Start with 5 AI credits
      lastFed: Date.now(),
      lastPlayed: Date.now(),
      lastActive: Date.now(),
      lastHappinessUpdate: Date.now(),
      lastEnergyUpdate: Date.now(),
      isMining: false,
      miningSpeed: 1,
      miningUpgradeCost: 100,
      accessories: [],
      inventory: [],
      currentScene: 'warehouse' as GameScene,
      unlockedScenes: {
        warehouse: true,
        park: false,
        town: false,
        city: false,
      },
      dailyRewards: {
        lastClaimDate: 0,
        currentStreak: 0,
        maxStreak: 0,
        rewards: initialDailyRewards,
      },
      feeding: {
        dailyAllowance: 3,      // Default 3 feeds per day
        remainingAllowance: 3,  // Start with full allowance
        lastAllowanceDate: Date.now(),
      },
      
      earnCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      
      addAiCredits: (amount) => set((state) => ({ 
        aiCredits: state.aiCredits + amount,
        lastActive: Date.now(),
      })),
      
      useAiCredit: () => {
        const { aiCredits } = get();
        if (aiCredits <= 0) return false;
        
        set((state) => ({ 
          aiCredits: state.aiCredits - 1,
          lastActive: Date.now(),
        }));
        return true;
      },
      
      feed: () => set((state) => {
        // Check for new day to reset allowance
        const today = new Date().setHours(0, 0, 0, 0);
        const lastAllowanceDay = new Date(state.feeding.lastAllowanceDate).setHours(0, 0, 0, 0);
        const isNewDay = today > lastAllowanceDay;
        
        // If new day, reset allowance
        const updatedRemainingAllowance = isNewDay 
          ? state.feeding.dailyAllowance - 1 // Reset and consume 1
          : state.feeding.remainingAllowance > 0 
            ? state.feeding.remainingAllowance - 1 // Consume 1 from remaining
            : 0; // No allowance left
        
        // If no allowance left, can't feed
        if ((!isNewDay && state.feeding.remainingAllowance <= 0)) {
          // No changes to state, return current state
          return state;
        }
        
        // Maintain lastEnergyUpdate if mining is active to keep energy decay calculation consistent
        const updatedLastEnergyUpdate = state.isMining ? state.lastEnergyUpdate : Date.now();
        
        return {
          energy: Math.round(Math.min(100, state.energy + 20) * 100) / 100,
          happiness: Math.round(Math.min(100, state.happiness + 5) * 100) / 100,
          lastFed: Date.now(),
          lastActive: Date.now(),
          lastHappinessUpdate: Date.now(), // Reset happiness decay timer when we feed
          lastEnergyUpdate: updatedLastEnergyUpdate, // Keep energy decay if mining
          feeding: {
            dailyAllowance: state.feeding.dailyAllowance,
            remainingAllowance: updatedRemainingAllowance,
            lastAllowanceDate: isNewDay ? Date.now() : state.feeding.lastAllowanceDate,
          }
        };
      }),
      
      play: () => set((state) => ({
        happiness: Math.round(Math.min(100, state.happiness + 15) * 100) / 100,
        energy: Math.round(Math.max(0, state.energy - 10) * 100) / 100,
        lastPlayed: Date.now(),
        lastActive: Date.now(),
        lastHappinessUpdate: Date.now(), // Reset happiness decay timer when we play
      })),
      
      pet: () => set((state) => ({
        happiness: Math.round(Math.min(100, state.happiness + 5) * 100) / 100,
        lastActive: Date.now(),
        lastHappinessUpdate: Date.now(), // Reset happiness decay timer when we pet
      })),
      
      buyItem: (item) => set((state) => {
        // Check if we can afford the item
        if (state.coins < item.cost) {
          return state;
        }
        
        // Handle different item types
        if (item.type === 'credit') {
          // Add AI credits directly
          return {
            coins: state.coins - item.cost,
            aiCredits: state.aiCredits + (item.creditAmount || 0),
            lastActive: Date.now(),
          };
        } else if (item.type === 'accessory') {
          // Add to accessories
          const accessory: Accessory = {
            id: item.id,
            name: item.name,
            description: item.description,
            type: item.accessoryType || 'hat',
            imageUrl: item.imageUrl,
            equipped: false,
          };
          
          return {
            coins: state.coins - item.cost,
            accessories: [...state.accessories, accessory],
            lastActive: Date.now(),
          };
        } else {
          // Check if item exists in inventory
          const existingItemIndex = state.inventory.findIndex((i) => i.id === item.id);
          let updatedInventory = [...state.inventory];
          
          if (existingItemIndex >= 0) {
            // Update quantity
            updatedInventory[existingItemIndex] = {
              ...updatedInventory[existingItemIndex],
              quantity: updatedInventory[existingItemIndex].quantity + 1,
            };
          } else {
            // Add new item
            const newItem: InventoryItem = {
              id: item.id,
              name: item.name,
              description: item.description,
              type: item.type,
              energyBoost: item.energyBoost,
              happinessBoost: item.happinessBoost,
              imageUrl: item.imageUrl,
              quantity: 1,
            };
            updatedInventory.push(newItem);
          }
          
          return {
            coins: state.coins - item.cost,
            inventory: updatedInventory,
            lastActive: Date.now(),
          };
        }
      }),
      
      upgradeMiningSpped: () => set((state) => {
        const nextLevel = state.miningSpeed + 1;
        const cost = state.miningUpgradeCost;
        
        if (state.coins < cost || nextLevel > 5) {
          return state;
        }
        
        return {
          coins: state.coins - cost,
          miningSpeed: nextLevel,
          miningUpgradeCost: cost * 2, // Double the cost for the next level
          lastActive: Date.now(),
        };
      }),
      
      useInventoryItem: (itemId) => set((state) => {
        const itemIndex = state.inventory.findIndex((item) => item.id === itemId);
        if (itemIndex < 0 || state.inventory[itemIndex].quantity <= 0) {
          return state;
        }
        
        const item = state.inventory[itemIndex];
        let updatedInventory = [...state.inventory];
        
        // Apply effects
        let happinessBoost = 0;
        let energyBoost = 0;
        
        if (item.happinessBoost) {
          happinessBoost = item.happinessBoost;
        }
        
        if (item.energyBoost) {
          energyBoost = item.energyBoost;
        }
        
        // Update quantity
        updatedInventory[itemIndex] = {
          ...item,
          quantity: item.quantity - 1,
        };
        
        // Remove item if quantity is 0
        if (updatedInventory[itemIndex].quantity === 0) {
          updatedInventory = updatedInventory.filter((_, index) => index !== itemIndex);
        }
        
        // Update happiness decay timer if happiness boost is applied
        const updatedLastHappinessUpdate = happinessBoost > 0 ? Date.now() : state.lastHappinessUpdate;
        
        // Update last fed time if it's a food item
        const lastFed = item.type === 'food' ? Date.now() : state.lastFed;
        
        return {
          inventory: updatedInventory,
          happiness: Math.round(Math.min(100, state.happiness + happinessBoost) * 100) / 100,
          energy: Math.round(Math.min(100, state.energy + energyBoost) * 100) / 100,
          lastActive: Date.now(),
          lastHappinessUpdate: updatedLastHappinessUpdate,
          lastFed: lastFed,
        };
      }),
      
      equipAccessory: (accessoryId) => set((state) => {
        const accessoryIndex = state.accessories.findIndex((acc) => acc.id === accessoryId);
        if (accessoryIndex < 0) return state;
        
        const accessory = state.accessories[accessoryIndex];
        
        // Unequip any existing accessory of the same type
        const updatedAccessories = state.accessories.map((acc) => {
          if (acc.type === accessory.type) {
            return { ...acc, equipped: acc.id === accessoryId };
          }
          return acc;
        });
        
        return {
          accessories: updatedAccessories,
          lastActive: Date.now(),
        };
      }),
      
      unequipAccessory: (accessoryType) => set((state) => {
        const updatedAccessories = state.accessories.map((acc) => {
          if (acc.type === accessoryType) {
            return { ...acc, equipped: false };
          }
          return acc;
        });
        
        return {
          accessories: updatedAccessories,
          lastActive: Date.now(),
        };
      }),
      
      claimDailyReward: () => set((state) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const lastClaim = new Date(state.dailyRewards.lastClaimDate).setHours(0, 0, 0, 0);
        
        // Check if already claimed today
        if (lastClaim === today) {
          return state;
        }
        
        // Calculate streak
        let currentStreak = state.dailyRewards.currentStreak;
        let maxStreak = state.dailyRewards.maxStreak;
        
        // If last claim was yesterday, increment streak
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.setHours(0, 0, 0, 0);
        
        if (lastClaim === yesterdayDate) {
          currentStreak += 1;
        } else if (lastClaim !== today) {
          // Reset streak if not consecutive days
          currentStreak = 1;
        }
        
        // Update max streak if needed
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
        
        // Get current day in the cycle (1-7)
        const day = ((currentStreak - 1) % 7) + 1;
        
        // Find the reward for this day
        const reward = state.dailyRewards.rewards.find(r => r.day === day);
        let updatedRewards = [...state.dailyRewards.rewards];
        let updatedCoins = state.coins;
        let updatedInventory = [...state.inventory];
        
        if (reward) {
          // Mark as claimed
          updatedRewards = updatedRewards.map(r => {
            if (r.day === day) {
              return { ...r, claimed: true };
            }
            return r;
          });
          
          // Apply reward
          if (reward.reward.type === 'coins') {
            updatedCoins += reward.reward.value;
          } else if (reward.reward.type === 'item' && reward.reward.itemId) {
            // Add item to inventory
            const itemId = reward.reward.itemId;
            const existingItemIndex = updatedInventory.findIndex(item => item.id === itemId);
            
            if (existingItemIndex >= 0) {
              updatedInventory[existingItemIndex].quantity += reward.reward.value;
            } else {
              // This is simplified - in a real app you'd have item definitions
              updatedInventory.push({
                id: itemId,
                name: itemId === 'premium_food' ? 'Premium Food' : 'Super Toy',
                description: itemId === 'premium_food' ? 'High quality food that boosts energy significantly' : 'A fun toy that makes your Doge happy',
                type: itemId === 'premium_food' ? 'food' : 'toy',
                energyBoost: itemId === 'premium_food' ? 40 : 0,
                happinessBoost: itemId === 'premium_food' ? 10 : 30,
                quantity: reward.reward.value
              });
            }
          }
        }
        
        // Reset claims after a full cycle
        if (day === 7) {
          updatedRewards = updatedRewards.map(r => ({ ...r, claimed: false }));
        }
        
        return {
          coins: updatedCoins,
          inventory: updatedInventory,
          dailyRewards: {
            lastClaimDate: today,
            currentStreak,
            maxStreak,
            rewards: updatedRewards,
          },
          lastActive: Date.now(),
        };
      }),
      
      updateLastActive: () => set({ lastActive: Date.now() }),
      
      // Update happiness with decay over time (6-hour decay cycle)
      updateHappiness: () => set((state) => {
        const now = Date.now();
        const timeSinceLastUpdate = now - state.lastHappinessUpdate;
        
        // If less than a minute has passed, don't update
        if (timeSinceLastUpdate < 60 * 1000) {
          return state;
        }
        
        // Calculate happiness decay (full decay over 6 hours = 21,600,000 milliseconds)
        // This means 100 happiness points over 6 hours = 100/21,600,000 happiness per millisecond
        const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
        const DECAY_RATE = 100 / SIX_HOURS_MS; // happiness points per millisecond
        
        // Calculate decay amount based on time passed
        const decayAmount = DECAY_RATE * timeSinceLastUpdate;
        
        // Only apply decay if the doge has some happiness to lose
        if (state.happiness > 0) {
          return {
            happiness: Math.round(Math.max(0, state.happiness - decayAmount) * 100) / 100,
            lastHappinessUpdate: now,
          };
        }
        
        return { lastHappinessUpdate: now };
      }),
      
      // Update energy with decay if mining (full decay over 8 hours)
      updateMiningEnergy: () => set((state) => {
        // Only decay energy if currently mining
        if (!state.isMining) {
          return state;
        }
        
        const now = Date.now();
        const timeSinceLastUpdate = now - state.lastEnergyUpdate;
        
        // If less than a minute has passed, don't update
        if (timeSinceLastUpdate < 60 * 1000) {
          return state;
        }
        
        // Calculate energy decay (full decay over 8 hours = 28,800,000 milliseconds)
        // This means 100 energy points over 8 hours = 100/28,800,000 energy per millisecond
        const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
        const DECAY_RATE = 100 / EIGHT_HOURS_MS; // energy points per millisecond
        
        // Calculate decay amount based on time passed
        const decayAmount = DECAY_RATE * timeSinceLastUpdate;
        
        // Only apply decay if the doge has some energy to lose
        if (state.energy > 0) {
          const newEnergy = Math.round(Math.max(0, state.energy - decayAmount) * 100) / 100;
          
          // If energy reaches zero, stop mining
          if (newEnergy <= 0) {
            return {
              energy: 0,
              lastEnergyUpdate: now,
              isMining: false
            };
          }
          
          return {
            energy: newEnergy,
            lastEnergyUpdate: now,
          };
        }
        
        // If no energy left, also make sure mining stops
        if (state.energy <= 0) {
          return { 
            lastEnergyUpdate: now,
            isMining: false
          };
        }
        
        return { lastEnergyUpdate: now };
      }),
      
      // Start mining (only if enough energy)
      startMining: () => set((state) => {
        // Need at least 20 energy to start mining
        if (state.energy < 20) {
          return state;
        }
        
        return {
          isMining: true,
          lastEnergyUpdate: Date.now(), // Start the energy decay timer for mining
          lastActive: Date.now(),
        };
      }),
      
      // Stop mining
      stopMining: () => set((state) => ({
        isMining: false,
        lastActive: Date.now(),
      })),
      
      // Change the current scene
      setScene: (scene) => set((state) => ({
        currentScene: scene,
        lastActive: Date.now()
      })),
      
      // Unlock a new scene
      unlockScene: (scene, cost) => set((state) => {
        // Check if already unlocked or not enough coins
        if (state.unlockedScenes[scene] || state.coins < cost) {
          return state;
        }
        
        return {
          coins: state.coins - cost,
          unlockedScenes: {
            ...state.unlockedScenes,
            [scene]: true
          },
          lastActive: Date.now()
        };
      }),
      
      resetStats: () => set({
        coins: 100,
        happiness: 70,
        energy: 80,
        aiCredits: 5,
        lastFed: Date.now(),
        lastPlayed: Date.now(),
        lastActive: Date.now(),
        lastHappinessUpdate: Date.now(),
        lastEnergyUpdate: Date.now(),
        isMining: false,
        miningSpeed: 1,
        miningUpgradeCost: 100,
        accessories: [],
        inventory: [],
        currentScene: 'warehouse',
        unlockedScenes: {
          warehouse: true,
          park: false,
          town: false,
          city: false,
        },
        dailyRewards: {
          lastClaimDate: 0,
          currentStreak: 0,
          maxStreak: 0,
          rewards: initialDailyRewards,
        },
        feeding: {
          dailyAllowance: 3,
          remainingAllowance: 3,
          lastAllowanceDate: Date.now(),
        },
      }),
    }),
    {
      name: 'doge-game-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
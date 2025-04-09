
import { User, Dialect, SubscriptionTier } from "@/types";

// In a real implementation, this would connect to Firebase, 
// or another backend service. For demo purposes, we'll use localStorage.

const STORAGE_KEY = "arabi_falak_user";

export const saveUser = (user: User): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userData = localStorage.getItem(STORAGE_KEY);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData) as User;
  } catch (e) {
    console.error("Error parsing user data:", e);
    return null;
  }
};

export const updateUserDialect = (dialect: Dialect): void => {
  const user = getUser();
  if (user) {
    saveUser({ ...user, dialect });
  }
};

export const updateUserBirthDetails = (
  birthDate: string,
  birthTime: string,
  birthPlace: string
): void => {
  const user = getUser();
  if (user) {
    saveUser({
      ...user,
      birthDate,
      birthTime,
      birthPlace
    });
  }
};

export const updateSubscriptionTier = (tier: SubscriptionTier): void => {
  const user = getUser();
  if (user) {
    saveUser({ ...user, subscriptionTier: tier });
  }
};

export const logUserMessage = (): void => {
  const user = getUser();
  if (!user) return;
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Initialize firstLoginDate if not set
  const firstLoginDate = user.firstLoginDate || now.toISOString();
  
  // Reset messageCountToday if it's a new day
  let messageCountToday = user.messageCountToday || 0;
  if (user.lastMessageDate !== today) {
    messageCountToday = 0;
  }
  
  // Increment message counts
  messageCountToday += 1;
  const totalMessagesThisMonth = (user.totalMessagesThisMonth || 0) + 1;
  
  saveUser({
    ...user,
    firstLoginDate,
    messageCountToday,
    lastMessageDate: today,
    totalMessagesThisMonth
  });
};

export const createNewUser = (): User => {
  const now = new Date().toISOString();
  
  const newUser: User = {
    id: `user_${Date.now()}`,
    subscriptionTier: 0, // Start with free tier
    firstLoginDate: now,
    messageCountToday: 0,
    lastMessageDate: now.split('T')[0],
    totalMessagesThisMonth: 0
  };
  
  saveUser(newUser);
  return newUser;
};

export const resetMessageCountForNewDay = (): void => {
  const user = getUser();
  if (!user) return;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Reset if it's a new day
  if (user.lastMessageDate !== today) {
    saveUser({
      ...user,
      messageCountToday: 0,
      lastMessageDate: today
    });
  }
};

export const clearUserData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

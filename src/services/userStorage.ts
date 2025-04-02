
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

export const createNewUser = (): User => {
  const newUser: User = {
    id: `user_${Date.now()}`,
    subscriptionTier: 0 // Start with free tier
  };
  
  saveUser(newUser);
  return newUser;
};

export const clearUserData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

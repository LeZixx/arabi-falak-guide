
export type Dialect = 
  | "saudi" | "emirati" | "kuwaiti" | "bahraini" | "qatari" | "omani" | "yemeni"
  | "iraqi" | "lebanese" | "syrian" | "jordanian" | "palestinian" | "egyptian"
  | "sudanese" | "moroccan" | "algerian" | "tunisian" | "libyan" | "mauritanian"
  | "somali" | "msa";

export type DialectInfo = {
  code: Dialect;
  name: string;
  flag: string;
  nameArabic: string;
};

export type SubscriptionTier = 0 | 1 | 2 | 3 | 4;

export interface User {
  id: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  dialect?: Dialect;
  subscriptionTier: SubscriptionTier;
}

export type HoroscopeType = "daily" | "love" | "career" | "health";

export interface DialogStep {
  id: string;
  next?: string;
  component: React.FC<DialogStepProps>;
}

export interface DialogStepProps {
  onNext: (data?: any) => void;
  data?: any;
}

export interface HoroscopeResponse {
  title: string;
  content: string;
  luckyStar?: string;
  luckyNumber?: number;
  luckyColor?: string;
}

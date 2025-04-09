
import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  getUpgradeMessage, 
  isInTrialPeriod, 
  hasReachedDailyLimit,
  SUBSCRIPTION_TIERS 
} from "@/utils/subscription-utils";
import { User } from "@/types";
import { Badge } from "@/components/ui/badge";

interface AskQuestionFormProps {
  user: User;
  onSubmit: (question: string) => void;
  onUpgrade: () => void;
}

const AskQuestionForm: React.FC<AskQuestionFormProps> = ({ user, onSubmit, onUpgrade }) => {
  const [question, setQuestion] = useState("");
  
  const inTrial = isInTrialPeriod(user.firstLoginDate);
  const reachedDailyLimit = !inTrial && user.subscriptionTier === 0 && hasReachedDailyLimit(user.messageCountToday);
  
  // Check monthly limit for paid tiers
  const tierInfo = SUBSCRIPTION_TIERS[user.subscriptionTier];
  const monthlyLimit = tierInfo.questionsPerMonth;
  const reachedMonthlyLimit = 
    !inTrial && 
    user.subscriptionTier > 0 && 
    monthlyLimit !== null && 
    user.totalMessagesThisMonth >= monthlyLimit;
  
  const canAskQuestion = inTrial || (!reachedDailyLimit && !reachedMonthlyLimit);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && canAskQuestion) {
      onSubmit(question);
      setQuestion("");
    }
  };
  
  // Display remaining questions
  const getRemainingText = () => {
    if (inTrial) {
      return "✨ فترة تجربة مجانية (7 أيام)";
    }
    
    if (user.subscriptionTier === 0) {
      return `${3 - user.messageCountToday}/3 أسئلة متبقية اليوم`;
    }
    
    if (monthlyLimit) {
      return `${monthlyLimit - user.totalMessagesThisMonth}/${monthlyLimit} سؤال متبقي هذا الشهر`;
    }
    
    return "";
  };
  
  if (!canAskQuestion) {
    return (
      <div className="text-center space-y-3 p-4 border border-muted rounded-lg">
        <h3 className="text-lg font-semibold">❗ تم الوصول إلى حد الأسئلة</h3>
        <p className="text-muted-foreground text-sm">
          {reachedDailyLimit ? 
            getUpgradeMessage(user.subscriptionTier, "questions", true, true) : 
            `لقد وصلت إلى الحد الشهري (${monthlyLimit} سؤال). يرجى الانتظار حتى بداية الشهر القادم أو ترقية باقتك.`
          }
        </p>
        <Button onClick={onUpgrade} className="mt-2">
          ترقية الآن ⭐
        </Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex justify-between items-center">
        <Badge variant="outline" className="ml-auto">
          {getRemainingText()}
        </Badge>
        <h3 className="text-lg font-semibold text-center">❓ اسأل المنجم ✨</h3>
      </div>
      <Textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="اكتب سؤالك هنا..."
        className="min-h-24 text-right"
        dir="rtl"
      />
      <Button type="submit" className="w-full" disabled={!question.trim()}>
        إرسال السؤال 🔮
      </Button>
    </form>
  );
};

export default AskQuestionForm;

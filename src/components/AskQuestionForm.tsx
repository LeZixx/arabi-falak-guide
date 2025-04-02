
import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getUpgradeMessage, canAccessFeature } from "@/utils/subscription-utils";
import { User } from "@/types";

interface AskQuestionFormProps {
  user: User;
  onSubmit: (question: string) => void;
  onUpgrade: () => void;
}

const AskQuestionForm: React.FC<AskQuestionFormProps> = ({ user, onSubmit, onUpgrade }) => {
  const [question, setQuestion] = useState("");
  const canAskQuestions = canAccessFeature(user.subscriptionTier, "questions");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && canAskQuestions) {
      onSubmit(question);
      setQuestion("");
    }
  };
  
  if (!canAskQuestions) {
    return (
      <div className="text-center space-y-3 p-4 border border-muted rounded-lg">
        <h3 className="text-lg font-semibold">✨ ميزة الأسئلة المفتوحة ✨</h3>
        <p className="text-muted-foreground text-sm">
          {getUpgradeMessage(user.subscriptionTier, "questions")}
        </p>
        <Button onClick={onUpgrade}>
          ترقية الآن ⭐
        </Button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-lg font-semibold text-center">❓ اسأل المنجم ✨</h3>
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

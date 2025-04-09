
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_TIERS } from "@/utils/subscription-utils";
import { Separator } from "@/components/ui/separator";
import { updateSubscriptionTier } from "@/services/userStorage";
import { SubscriptionTier } from "@/types";
import { Badge } from "@/components/ui/badge";

interface SubscriptionCardProps {
  currentTier: SubscriptionTier;
  onSubscribe: (tier: SubscriptionTier) => void;
  isTrialEnded?: boolean;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  currentTier,
  onSubscribe,
  isTrialEnded = false
}) => {
  const handleSubscribe = (tier: SubscriptionTier) => {
    // In a real app, this would trigger Stripe or payment processing
    // For demo purposes, we'll just update the tier directly
    updateSubscriptionTier(tier);
    onSubscribe(tier);
  };
  
  // Filter out the free tier if trial has ended
  const tiersToShow = SUBSCRIPTION_TIERS.filter(tier => 
    !isTrialEnded || tier.id !== 0
  );
  
  return (
    <div className="w-full max-w-md mx-auto">
      <h3 className="text-xl font-semibold text-center mb-4">
        باقات الاشتراك ✨
      </h3>
      
      <div className="space-y-3">
        {tiersToShow.map((tier) => (
          <Card 
            key={tier.id}
            className={`border ${currentTier === tier.id ? "border-accent" : "border-muted"} transition-all hover:border-accent/50`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>{tier.icon}</span>
                  <span className="text-right">{tier.arabicName}</span>
                  {tier.id === 0 && !isTrialEnded && (
                    <Badge variant="outline" className="mr-2">7 أيام</Badge>
                  )}
                </CardTitle>
                <span className="text-xl font-bold">
                  {tier.price === 0 ? "مجاني" : `$${tier.price}`}
                </span>
              </div>
            </CardHeader>
            
            <Separator className="mx-auto w-4/5" />
            
            <CardContent className="pt-3 pb-2">
              <p className="text-right text-muted-foreground">{tier.arabicDescription}</p>
              {tier.questionsPerMonth && (
                <p className="text-right text-sm mt-1">
                  {tier.id === 3 ? "✓ تنبؤات لمدة عامين" : "✓ تنبؤات لمدة 7 أيام"}
                </p>
              )}
              {tier.id > 0 && (
                <p className="text-right text-sm mt-1">
                  ✓ بدون حدود للأحرف في الرسائل
                </p>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                variant={currentTier === tier.id ? "secondary" : "default"}
                className="w-full"
                onClick={() => handleSubscribe(tier.id as SubscriptionTier)}
                disabled={currentTier === tier.id}
              >
                {currentTier === tier.id ? "مشترك حالياً ✓" : tier.id === 0 ? "استخدم المجاني" : "ترقية"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionCard;


import React from "react";
import { Button } from "@/components/ui/button";

interface CommandButtonsProps {
  onCommand: (command: string) => void;
  subscriptionTier?: number;
  isTrialEnded?: boolean;
}

const CommandButtons: React.FC<CommandButtonsProps> = ({ 
  onCommand, 
  subscriptionTier = 0,
  isTrialEnded = false
}) => {
  // Basic commands available to all users
  const baseCommands = [
    { name: "/start", label: "/start 🔄", description: "بدء من جديد" },
    { name: "/mydata", label: "/mydata 📋", description: "بياناتي" },
    { name: "/change_dialect", label: "/change_dialect 🗣️", description: "تغيير اللهجة" },
    { name: "/subscribe", label: "/subscribe ⭐", description: "الاشتراكات" },
    { name: "/horoscope", label: "/horoscope 🔮", description: "قراءة يومية" }
  ];
  
  // Topic-specific commands - availability depends on subscription
  const topicCommands = [
    { name: "/love", label: "/love ❤️", description: "الحب", minTier: isTrialEnded ? 1 : 0 },
    { name: "/career", label: "/career 💼", description: "العمل", minTier: isTrialEnded ? 2 : 0 },
    { name: "/health", label: "/health 🌿", description: "الصحة", minTier: isTrialEnded ? 2 : 0 }
  ];
  
  // Additional commands
  const otherCommands = [
    { name: "/ask", label: "/ask ❓", description: "سؤال", minTier: 0 }
  ];
  
  // Filter commands based on subscription tier
  const availableTopicCommands = topicCommands.filter(cmd => 
    subscriptionTier >= cmd.minTier || 
    (subscriptionTier === 1 && cmd.name === "/love") // Tier 1 only gets love topic
  );
  
  const allCommands = [...baseCommands, ...availableTopicCommands, ...otherCommands];
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-center">
        {allCommands.map((command) => (
          <Button
            key={command.name}
            variant="outline"
            className="text-xs px-2 py-1 h-auto flex flex-col"
            onClick={() => onCommand(command.name)}
          >
            <span>{command.label}</span>
            <span className="text-muted-foreground text-[10px]">{command.description}</span>
          </Button>
        ))}
      </div>
      
      {isTrialEnded && subscriptionTier < 2 && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          قم بترقية اشتراكك للوصول إلى جميع الموضوعات ✨
        </p>
      )}
    </div>
  );
};

export default CommandButtons;


import React from "react";
import { Button } from "@/components/ui/button";

interface CommandButtonsProps {
  onCommand: (command: string) => void;
}

const CommandButtons: React.FC<CommandButtonsProps> = ({ onCommand }) => {
  const commands = [
    { name: "/start", label: "🔄 /start", description: "بدء من جديد" },
    { name: "/mydata", label: "📋 /mydata", description: "بياناتي" },
    { name: "/change_dialect", label: "🗣️ /change_dialect", description: "تغيير اللهجة" },
    { name: "/subscribe", label: "⭐ /subscribe", description: "الاشتراكات" },
    { name: "/horoscope", label: "🔮 /horoscope", description: "قراءة يومية" },
    { name: "/love", label: "❤️ /love", description: "الحب" },
    { name: "/career", label: "💼 /career", description: "العمل" },
    { name: "/health", label: "🌿 /health", description: "الصحة" },
    { name: "/ask", label: "❓ /ask", description: "سؤال" }
  ];
  
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {commands.map((command) => (
        <Button
          key={command.name}
          variant="outline"
          className="text-xs px-2 py-1 h-auto"
          onClick={() => onCommand(command.name)}
        >
          {command.label}
        </Button>
      ))}
    </div>
  );
};

export default CommandButtons;


import React from "react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  isUser?: boolean;
  timestamp?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  isUser = false,
  timestamp 
}) => {
  return (
    <div className={cn(
      "flex w-full max-w-[85%]", 
      isUser ? "ml-auto justify-end" : "mr-auto justify-start"
    )}>
      <div
        className={cn(
          "rounded-lg px-4 py-2",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary text-secondary-foreground"
        )}
      >
        <p className="whitespace-pre-wrap text-right">{message}</p>
        {timestamp && (
          <div className="text-right mt-1">
            <span className="text-xs opacity-70">{timestamp}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;

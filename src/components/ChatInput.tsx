
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizonal } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  placeholder = "اكتب رسالة...",
  disabled = false
}) => {
  const [message, setMessage] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        className="text-right"
        dir="rtl"
        disabled={disabled}
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={!message.trim() || disabled}
      >
        <SendHorizonal className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ChatInput;

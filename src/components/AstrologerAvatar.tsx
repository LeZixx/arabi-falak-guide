
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AstrologerAvatarProps {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

const AstrologerAvatar: React.FC<AstrologerAvatarProps> = ({ 
  size = "md", 
  animate = true 
}) => {
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-24 w-24"
  };
  
  return (
    <div className={`relative ${animate ? "animate-float" : ""}`}>
      <Avatar className={`${sizeClasses[size]} border-2 border-accent shadow-lg`}>
        <AvatarImage src="/astrologer.png" alt="Astrologer" />
        <AvatarFallback className="bg-secondary text-accent">
          🔮
        </AvatarFallback>
      </Avatar>
      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1 text-xs">
        🌙
      </div>
    </div>
  );
};

export default AstrologerAvatar;

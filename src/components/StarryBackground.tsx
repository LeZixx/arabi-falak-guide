
import React, { useEffect, useState } from "react";

interface Star {
  id: number;
  size: "sm" | "md" | "lg";
  top: string;
  left: string;
  animationDelay: string;
}

const StarryBackground: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);
  
  useEffect(() => {
    const generateStars = () => {
      const newStars: Star[] = [];
      const starCount = Math.floor(window.innerWidth * window.innerHeight / 10000);
      
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          id: i,
          size: ["sm", "md", "lg"][Math.floor(Math.random() * 3)] as "sm" | "md" | "lg",
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`
        });
      }
      
      setStars(newStars);
    };
    
    generateStars();
    
    window.addEventListener("resize", generateStars);
    return () => {
      window.removeEventListener("resize", generateStars);
    };
  }, []);
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className={`star star-${star.size}`}
          style={{
            top: star.top,
            left: star.left,
            animationDelay: star.animationDelay
          }}
        />
      ))}
    </div>
  );
};

export default StarryBackground;

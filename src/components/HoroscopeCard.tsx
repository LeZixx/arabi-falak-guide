
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HoroscopeResponse } from "@/types";

interface HoroscopeCardProps {
  horoscope: HoroscopeResponse;
  zodiacSign: string;
  zodiacEmoji: string;
}

const HoroscopeCard: React.FC<HoroscopeCardProps> = ({
  horoscope,
  zodiacSign,
  zodiacEmoji
}) => {
  return (
    <Card className="w-full max-w-md mx-auto border-accent/50 bg-gradient-to-br from-secondary to-black">
      <CardHeader className="pb-2 text-center">
        <div className="flex items-center justify-center text-2xl space-x-2 mb-1">
          <span>{zodiacEmoji}</span>
          <span className="text-accent">{zodiacSign}</span>
          <span>{zodiacEmoji}</span>
        </div>
        <CardTitle className="text-xl text-center">{horoscope.title}</CardTitle>
      </CardHeader>
      
      <Separator className="mx-auto w-4/5 bg-accent/30" />
      
      <CardContent className="pt-4">
        <p className="text-right leading-relaxed text-foreground/90">{horoscope.content}</p>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        <Separator className="w-full bg-accent/30 mb-2" />
        <div className="w-full grid grid-cols-3 gap-2 text-center text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">الرقم المحظوظ</p>
            <p className="text-accent font-bold">{horoscope.luckyNumber}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">النجم المحظوظ</p>
            <p className="text-accent font-bold">{horoscope.luckyStar}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">اللون المحظوظ</p>
            <p className="text-accent font-bold">{horoscope.luckyColor}</p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default HoroscopeCard;

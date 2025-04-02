
import React from "react";
import { ArrowLeft, MoreVertical } from "lucide-react";

const MockTelegramHeader: React.FC = () => {
  return (
    <div className="bg-primary py-2 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ArrowLeft className="h-5 w-5" />
        <div className="flex flex-col">
          <span className="font-semibold">النجم العربي 🌙✨</span>
          <span className="text-xs opacity-70">متصل الآن</span>
        </div>
      </div>
      <MoreVertical className="h-5 w-5" />
    </div>
  );
};

export default MockTelegramHeader;

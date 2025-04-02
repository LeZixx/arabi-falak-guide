
import React from "react";
import { DIALECTS } from "@/utils/dialect-utils";
import { Dialect } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { updateUserDialect } from "@/services/userStorage";

interface DialectSelectorProps {
  onSelect: (dialect: Dialect) => void;
  selectedDialect?: Dialect;
}

const DialectSelector: React.FC<DialectSelectorProps> = ({ 
  onSelect, 
  selectedDialect 
}) => {
  const handleSelect = (dialect: Dialect) => {
    updateUserDialect(dialect);
    onSelect(dialect);
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-2 text-center">
        🗣️ اختر لهجتك المفضلة
      </h3>
      <ScrollArea className="h-60 rounded-md border p-4">
        <div className="grid grid-cols-2 gap-2">
          {DIALECTS.map((dialect) => (
            <Button
              key={dialect.code}
              variant={selectedDialect === dialect.code ? "default" : "outline"}
              className={`justify-start gap-2 ${
                selectedDialect === dialect.code ? "bg-primary" : "hover:bg-primary/10"
              }`}
              onClick={() => handleSelect(dialect.code)}
            >
              <span>{dialect.flag}</span>
              <span className="text-right flex-grow">{dialect.nameArabic}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DialectSelector;

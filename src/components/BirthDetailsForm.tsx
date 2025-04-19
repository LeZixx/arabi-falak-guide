
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updateUserBirthDetails } from "@/services/userStorage";
import { DialogStepProps } from "@/types";

const BirthDetailsForm: React.FC<DialogStepProps> = ({ onNext }) => {
  const [birthDate, setBirthDate] = useState<string>("");
  const [birthTime, setBirthTime] = useState<string>("");
  const [birthPlace, setBirthPlace] = useState<string>("");
  const [errors, setErrors] = useState<{
    date?: string;
    time?: string;
    place?: string;
  }>({});
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: {
      date?: string;
      time?: string;
      place?: string;
    } = {};
    
    if (!birthDate) {
      newErrors.date = "يرجى إدخال تاريخ الميلاد";
    }
    
    // Time is optional, but if provided, validate format
    if (birthTime) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timeRegex.test(birthTime)) {
        newErrors.time = "صيغة الوقت غير صحيحة. الرجاء استخدام الصيغة HH:MM (مثال: 09:30)";
      }
    }
    
    if (!birthPlace) {
      newErrors.place = "يرجى إدخال مكان الميلاد";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    updateUserBirthDetails(birthDate, birthTime, birthPlace);
    onNext({ birthDate, birthTime, birthPlace });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto text-right">
      <h3 className="text-xl font-semibold text-center">
        📅 بيانات الميلاد ⏰
      </h3>
      
      <p className="text-center text-muted-foreground text-sm">
        لقراءة فلكية دقيقة، نحتاج إلى معلومات ميلادك الدقيقة
      </p>
      
      <Separator />
      
      <div className="space-y-2">
        <Label htmlFor="birthDate" className="text-right block">تاريخ الميلاد</Label>
        <Input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="text-right"
          dir="rtl"
        />
        {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="birthTime" className="text-right block">
          وقت الميلاد (إذا كان معلوماً، يعطي نتائج أدق)
        </Label>
        <p className="text-xs text-muted-foreground text-right">
          إذا لم تكن تعرف وقت ميلادك، يمكنك ترك هذا الحقل فارغاً. سنفترض الساعة 12 ظهراً للتوقعات العامة.
        </p>
        <Input
          id="birthTime"
          type="time"
          value={birthTime}
          onChange={(e) => setBirthTime(e.target.value)}
          className="text-right"
          dir="rtl"
        />
        {errors.time && <p className="text-red-500 text-sm">{errors.time}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="birthPlace" className="text-right block">مكان الميلاد (المدينة، البلد)</Label>
        <Input
          id="birthPlace"
          type="text"
          value={birthPlace}
          onChange={(e) => setBirthPlace(e.target.value)}
          className="text-right"
          placeholder="القاهرة، مصر"
          dir="rtl"
        />
        {errors.place && <p className="text-red-500 text-sm">{errors.place}</p>}
      </div>
      
      <Button type="submit" className="w-full">
        متابعة ✨
      </Button>
    </form>
  );
};

export default BirthDetailsForm;

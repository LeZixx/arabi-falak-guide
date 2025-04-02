import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import StarryBackground from "./StarryBackground";
import MockTelegramHeader from "./MockTelegramHeader";
import AstrologerAvatar from "./AstrologerAvatar";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import CommandButtons from "./CommandButtons";
import BirthDetailsForm from "./BirthDetailsForm";
import DialectSelector from "./DialectSelector";
import HoroscopeCard from "./HoroscopeCard";
import SubscriptionCard from "./SubscriptionCard";
import AskQuestionForm from "./AskQuestionForm";

import { 
  getUser, 
  createNewUser, 
  updateUserBirthDetails,
  updateUserDialect 
} from "@/services/userStorage";
import { 
  generateHoroscope, 
  getZodiacSign, 
  getZodiacEmoji 
} from "@/utils/astrology-utils";
import { 
  getDialectGreeting, 
  getDialectInfo 
} from "@/utils/dialect-utils";
import { 
  canAccessFeature, 
  canAccessHoroscopeType,
  getUpgradeMessage 
} from "@/utils/subscription-utils";
import { Dialect, User, HoroscopeType } from "@/types";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const getCurrentTime = (): string => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const TelegramBot: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const existingUser = getUser();
    if (existingUser) {
      setUser(existingUser);
      
      if (existingUser.birthDate && existingUser.dialect) {
        const dialectInfo = getDialectInfo(existingUser.dialect);
        const greeting = getDialectGreeting(existingUser.dialect);
        
        addBotMessage(`مرحباً بعودتك! ${dialectInfo?.flag || "✨"}\n${greeting}`);
      }
    } else {
      const newUser = createNewUser();
      setUser(newUser);
      
      addBotMessage(
        "مرحباً بك في النجم العربي 🌙✨\n" +
        "مرحبًا بك في عالم التنجيم الشخصي!\n\n" +
        "هذا التطبيق يقدم لك:\n" +
        "• قراءات فلكية مخصصة 🔮\n" +
        "• توقعات يومية دقيقة ✨\n" +
        "• دعم لعدة لهجات عربية 🗣️\n\n" +
        "اكتب /start للبدء برحلتك الفلكية!"
      );
    }
  }, []);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  const addBotMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        isUser: false,
        timestamp: getCurrentTime()
      }
    ]);
  };
  
  const addUserMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        isUser: true,
        timestamp: getCurrentTime()
      }
    ]);
  };
  
  const handleUserMessage = (message: string) => {
    addUserMessage(message);
    
    if (message.startsWith("/")) {
      handleCommand(message);
    } else {
      if (!user?.birthDate || !user?.dialect) {
        addBotMessage("لم تكمل إعداد ملفك الشخصي بعد. الرجاء كتابة /start للبدء.");
      } else {
        if (canAccessFeature(user.subscriptionTier, "questions")) {
          setTimeout(() => {
            const dialectInfo = getDialectInfo(user.dialect!);
            addBotMessage(`${dialectInfo?.flag || "✨"} إجابة على سؤالك:\n\n${message.length % 2 === 0 ? "النجوم تشير إلى أن هذا وقت مناسب للمضي قدماً. القمر في بيتك الخامس يدعم القرارات الجديدة. ✨🌙" : "الكواكب تنصحك بالتروي قليلاً. زحل في وضع معاكس يشير إلى ضرورة التأني والتفكير مرة أخرى. 🪐✨"}`);
          }, 1000);
        } else {
          addBotMessage(getUpgradeMessage(user.subscriptionTier, "questions"));
          setDialogContent(
            <SubscriptionCard 
              currentTier={user.subscriptionTier} 
              onSubscribe={(tier) => {
                setUser(prev => prev ? { ...prev, subscriptionTier: tier } : null);
                setIsDialogOpen(false);
                addBotMessage(`✨ تم ترقية اشتراكك بنجاح! شكراً لدعمك. ✨`);
              }} 
            />
          );
          setIsDialogOpen(true);
        }
      }
    }
  };
  
  const handleCommand = (command: string) => {
    switch (command) {
      case "/start":
        startOnboarding();
        break;
      case "/mydata":
        showUserData();
        break;
      case "/change_dialect":
        changeDialect();
        break;
      case "/subscribe":
        showSubscriptions();
        break;
      case "/horoscope":
        showHoroscope("daily");
        break;
      case "/love":
        showHoroscope("love");
        break;
      case "/career":
        showHoroscope("career");
        break;
      case "/health":
        showHoroscope("health");
        break;
      case "/ask":
        askQuestion();
        break;
      default:
        addBotMessage("عذراً، هذا الأمر غير معروف. يرجى استخدام أحد الأوامر المتاحة.");
    }
  };
  
  const startOnboarding = () => {
    addBotMessage("✨ مرحباً بك في النجم العربي ✨\n\nلنبدأ بإعداد ملفك الشخصي لقراءة فلكية دقيقة.");
    
    setDialogContent(
      <BirthDetailsForm
        onNext={(data) => {
          updateUserBirthDetails(data.birthDate, data.birthTime, data.birthPlace);
          setUser(prev => prev ? { 
            ...prev, 
            birthDate: data.birthDate,
            birthTime: data.birthTime,
            birthPlace: data.birthPlace
          } : null);
          
          setDialogContent(
            <DialectSelector
              onSelect={(dialect) => {
                updateUserDialect(dialect);
                setUser(prev => prev ? { ...prev, dialect } : null);
                setIsDialogOpen(false);
                
                const dialectInfo = getDialectInfo(dialect);
                addBotMessage(`✨ تم إكمال الإعداد بنجاح! ${dialectInfo?.flag || ""}\n\n${getDialectGreeting(dialect)}`);
              }}
              selectedDialect={user?.dialect}
            />
          );
        }}
      />
    );
    setIsDialogOpen(true);
  };
  
  const showUserData = () => {
    if (!user || !user.birthDate || !user.dialect) {
      addBotMessage("لم تكمل إعداد ملفك الشخصي بعد. الرجاء كتابة /start للبدء.");
      return;
    }
    
    const dialectInfo = getDialectInfo(user.dialect);
    const tierInfo = {
      0: "مجاني",
      1: "راصد النجوم",
      2: "ابن القمر",
      3: "سماوي",
      4: "المرشد الكوني"
    }[user.subscriptionTier];
    
    const zodiacSign = getZodiacSign(user.birthDate);
    const zodiacEmoji = getZodiacEmoji(zodiacSign);
    
    addBotMessage(
      `📋 بياناتك:\n\n` +
      `🗣️ اللهجة: ${dialectInfo?.nameArabic} ${dialectInfo?.flag || ""}\n` +
      `📅 تاريخ الميلاد: ${new Date(user.birthDate).toLocaleDateString("ar")}\n` +
      `⏰ وقت الميلاد: ${user.birthTime}\n` +
      `📍 مكان الميلاد: ${user.birthPlace}\n` +
      `♈ البرج: ${zodiacSign} ${zodiacEmoji}\n` +
      `⭐ نوع الاشتراك: ${tierInfo}`
    );
  };
  
  const changeDialect = () => {
    setDialogContent(
      <DialectSelector
        onSelect={(dialect) => {
          updateUserDialect(dialect);
          setUser(prev => prev ? { ...prev, dialect } : null);
          setIsDialogOpen(false);
          
          const dialectInfo = getDialectInfo(dialect);
          addBotMessage(`✨ تم تغيير اللهجة بنجاح إلى ${dialectInfo?.nameArabic} ${dialectInfo?.flag || ""}`);
        }}
        selectedDialect={user?.dialect}
      />
    );
    setIsDialogOpen(true);
  };
  
  const showSubscriptions = () => {
    if (!user) return;
    
    setDialogContent(
      <SubscriptionCard 
        currentTier={user.subscriptionTier} 
        onSubscribe={(tier) => {
          setUser(prev => prev ? { ...prev, subscriptionTier: tier } : null);
          setIsDialogOpen(false);
          addBotMessage(`✨ تم تحديث اشتراكك بنجاح! شكراً لدعمك. ✨`);
        }} 
      />
    );
    setIsDialogOpen(true);
  };
  
  const showHoroscope = (type: HoroscopeType) => {
    if (!user || !user.birthDate || !user.dialect) {
      addBotMessage("لم تكمل إعداد ملفك الشخصي بعد. الرجاء كتابة /start للبدء.");
      return;
    }
    
    if (!canAccessHoroscopeType(user.subscriptionTier, type)) {
      addBotMessage(getUpgradeMessage(
        user.subscriptionTier,
        type === "daily" ? "daily" : "all_topics"
      ));
      setDialogContent(
        <SubscriptionCard 
          currentTier={user.subscriptionTier} 
          onSubscribe={(tier) => {
            setUser(prev => prev ? { ...prev, subscriptionTier: tier } : null);
            setIsDialogOpen(false);
            addBotMessage(`✨ تم ترقية اشتراكك بنجاح! شكراً لدعمك. ✨`);
            
            setTimeout(() => showHoroscope(type), 1000);
          }} 
        />
      );
      setIsDialogOpen(true);
      return;
    }
    
    const horoscope = generateHoroscope(
      user.birthDate,
      user.birthTime || "",
      user.birthPlace || "",
      type,
      user.dialect
    );
    
    const zodiacSign = getZodiacSign(user.birthDate);
    const zodiacEmoji = getZodiacEmoji(zodiacSign);
    
    setDialogContent(
      <HoroscopeCard 
        horoscope={horoscope}
        zodiacSign={zodiacSign}
        zodiacEmoji={zodiacEmoji}
      />
    );
    setIsDialogOpen(true);
    
    const typeEmojis = {
      daily: "✨",
      love: "❤️",
      career: "💼",
      health: "🌿"
    };
    
    const dialectInfo = getDialectInfo(user.dialect);
    addBotMessage(`${typeEmojis[type]} ${horoscope.title} ${dialectInfo?.flag || ""}\n\n${horoscope.content}\n\n🔮 الرقم المحظوظ: ${horoscope.luckyNumber}\n🌟 النجم المحظوظ: ${horoscope.luckyStar}\n🎨 اللون المحظوظ: ${horoscope.luckyColor}`);
  };
  
  const askQuestion = () => {
    if (!user || !user.birthDate || !user.dialect) {
      addBotMessage("لم تكمل إعداد ملفك الشخصي بعد. الرجاء كتابة /start للبدء.");
      return;
    }
    
    setDialogContent(
      <AskQuestionForm 
        user={user}
        onSubmit={(question) => {
          setIsDialogOpen(false);
          addUserMessage(question);
          
          setTimeout(() => {
            const dialectInfo = getDialectInfo(user.dialect!);
            addBotMessage(`${dialectInfo?.flag || "✨"} إجابة سؤالك:\n\n${question.length % 2 === 0 ? "القمر في برجك يشير إلى فترة من التغيير الإيجابي. هذا وقت مناسب للمبادرة والتقدم في أهدافك. ✨🌙" : "حركة المريخ حالياً تنصحك بالحذر في الخطوات القادمة. تأكد من دراسة جميع الخيارات قبل اتخاذ القرار. 🔮✨"}`);
          }, 1000);
        }}
        onUpgrade={() => {
          setIsDialogOpen(false);
          showSubscriptions();
        }}
      />
    );
    setIsDialogOpen(true);
  };
  
  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <StarryBackground />
      
      <MockTelegramHeader />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-center">
          <TabsTrigger value="chat">💬 الدردشة</TabsTrigger>
          <TabsTrigger value="commands">📋 الأوامر</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex justify-center mb-4">
            <AstrologerAvatar size="lg" />
          </div>
          
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-4">
              {messages.map(message => (
                <ChatBubble
                  key={message.id}
                  message={message.text}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="mt-4">
            <ChatInput onSend={handleUserMessage} />
          </div>
        </TabsContent>
        
        <TabsContent value="commands" className="flex-1 p-4 overflow-auto">
          <div className="max-w-md mx-auto space-y-8">
            <div className="text-center space-y-2">
              <AstrologerAvatar size="md" />
              <h2 className="text-lg font-semibold">النجم العربي 🌙✨</h2>
              <p className="text-sm text-muted-foreground">
                المنجم العربي الشخصي الخاص بك
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-center">📋 الأوامر المتاحة</h3>
              <CommandButtons onCommand={(cmd) => {
                setActiveTab("chat");
                handleCommand(cmd);
              }} />
            </div>
            
            {user?.birthDate && user?.dialect && (
              <>
                <Separator />
                
                <div className="space-y-3">
                  <Button 
                    className="w-full"
                    onClick={() => showHoroscope("daily")}
                    variant="outline"
                  >
                    🔮 الحصول على قراءة يومية
                  </Button>
                  
                  <Button 
                    className="w-full"
                    onClick={showSubscriptions}
                    variant="outline"
                  >
                    ⭐ ترقية اشتراكك
                  </Button>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {dialogContent}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TelegramBot;

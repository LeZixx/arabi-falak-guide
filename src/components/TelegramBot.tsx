
import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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
  updateUserDialect,
  logUserMessage,
  resetMessageCountForNewDay
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
  getUpgradeMessage,
  isInTrialPeriod,
  hasReachedDailyLimit,
  getForecastRange,
  SUBSCRIPTION_TIERS,
  getCharacterLimit
} from "@/utils/subscription-utils";
import { calculateNatalChart } from "@/utils/swiss-ephemeris-utils";
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

const generateResponse = (
  content: string, 
  characterLimit: number | null
): string => {
  if (!characterLimit || content.length <= characterLimit) {
    return content;
  }
  
  return content.substring(0, characterLimit - 3) + "...";
};

// Function to generate a basic birth chart summary
const generateBirthChartSummary = (user: User): string => {
  if (!user.birthDate || !user.birthTime || !user.birthPlace) {
    return "";
  }

  const chart = calculateNatalChart(user.birthDate, user.birthTime, user.birthPlace);
  const zodiacSign = getZodiacSign(user.birthDate);
  const zodiacEmoji = getZodiacEmoji(zodiacSign);
  
  // Get the main planetary positions
  const sun = chart.planets.find(p => p.planet === "Sun");
  const moon = chart.planets.find(p => p.planet === "Moon");
  const mercury = chart.planets.find(p => p.planet === "Mercury");
  
  return `✨ *خريطتك الفلكية الأساسية* ✨\n\n` +
    `برجك: ${zodiacSign} ${zodiacEmoji}\n` +
    `الطالع: ${chart.ascendant} ↗️\n` +
    `الشمس في: ${sun?.sign} ${sun?.retrograde ? "☿ᴿ" : ""}\n` +
    `القمر في: ${moon?.sign} ${moon?.retrograde ? "☿ᴿ" : ""}\n` +
    `عطارد في: ${mercury?.sign} ${mercury?.retrograde ? "☿ᴿ" : ""}\n\n` +
    `هذه معلومات أساسية عن خريطتك الفلكية. ماذا تريد أن تعرف المزيد عنه؟ يمكنك استخدام الأوامر التالية:`;
};

const TelegramBot: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    resetMessageCountForNewDay();
    
    const existingUser = getUser();
    if (existingUser) {
      setUser(existingUser);
      
      if (existingUser.birthDate && existingUser.dialect) {
        const dialectInfo = getDialectInfo(existingUser.dialect);
        const greeting = getDialectGreeting(existingUser.dialect);
        const inTrial = isInTrialPeriod(existingUser.firstLoginDate);
        const trialInfo = inTrial ? 
          "\n\nأنت حالياً في فترة التجربة المجانية (7 أيام) مع إمكانية وصول كاملة ✨" :
          "";
        
        addBotMessage(`مرحباً بعودتك ${dialectInfo?.flag || "✨"}\n${greeting}${trialInfo}`);
        
        // Show birth chart summary on login
        setTimeout(() => {
          const birthChartSummary = generateBirthChartSummary(existingUser);
          addBotMessage(birthChartSummary);
        }, 1000);
        
        if (!inTrial && existingUser.lastMessageDate !== new Date().toISOString().split('T')[0]) {
          setTimeout(() => {
            addBotMessage("لقد انتهت فترة التجربة المجانية الخاصة بك ❗ الآن لديك حد يومي من 3 أسئلة فقط. يمكنك الترقية للحصول على المزيد من الميزات.");
          }, 2500);
        }
      } else {
        addBotMessage(
          "مرحباً بك في النجم العربي 🌙✨\n" +
          "مرحبًا بك في عالم التنجيم الشخصي!\n\n" +
          "هذا التطبيق يقدم لك:\n" +
          "• قراءات فلكية مخصصة لك شخصياً 🔮\n" +
          "• توقعات يومية دقيقة مرتبطة ببرجك ✨\n" +
          "• دعم لعدة لهجات عربية 🗣️\n\n" +
          "اكتب /start للبدء برحلتك الفلكية!"
        );
      }
    } else {
      const newUser = createNewUser();
      setUser(newUser);
      
      setTimeout(() => {
        addBotMessage(
          "مرحباً بك في النجم العربي 🌙✨\n" +
          "مرحبًا بك في مساعدك الفلكي الشخصي 🔮\n\n" +
          "هذا التطبيق هو مرشدك الفلكي الخاص، المصمم خصيصًا لك 👤:\n" +
          "• قراءات فلكية شخصية ومخصصة بناءً على بياناتك الفريدة 🌟\n" +
          "• توقعات يومية دقيقة مرتبطة ببرجك وولادتك ✨\n" +
          "• اختيار اللهجة العربية التي تشعر بها 🗣️\n" +
          "• إرشادات روحية مخصصة للحب والعمل والصحة 💫\n\n" +
          "استمتع بفترة تجربة مجانية كاملة لمدة 7 أيام ✨\n\n" +
          "لتبدأ رحلتك الفلكية الشخصية، نحتاج إلى معلومات ميلادك الدقيقة.\n" +
          "اكتب /start الآن لإنشاء مرشدك الفلكي الخاص 🌙✨"
        );
      }, 500);
    }
  }, []);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  const addBotMessage = (text: string) => {
    let finalText = text;
    if (user) {
      const inTrial = isInTrialPeriod(user.firstLoginDate);
      const characterLimit = getCharacterLimit(user.subscriptionTier, inTrial);
      finalText = generateResponse(text, characterLimit);
    }
    
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        text: finalText,
        isUser: false,
        timestamp: getCurrentTime()
      }
    ]);
  };
  
  const addUserMessage = (text: string) => {
    if (user) {
      logUserMessage();
      const updatedUser = getUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
    }
    
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
    if (user && !isInTrialPeriod(user.firstLoginDate) && 
        user.subscriptionTier === 0 && hasReachedDailyLimit(user.messageCountToday)) {
      showSubscriptions(true);
      addBotMessage(getUpgradeMessage(user.subscriptionTier, "questions", true, true));
      return;
    }
    
    if (user && user.subscriptionTier > 0) {
      const tierInfo = SUBSCRIPTION_TIERS.find(t => t.id === user.subscriptionTier);
      if (tierInfo && tierInfo.questionsPerMonth && 
          user.totalMessagesThisMonth >= tierInfo.questionsPerMonth) {
        addBotMessage(`لقد وصلت إلى الحد الشهري (${tierInfo.questionsPerMonth} سؤال) ❗ يرجى الانتظار حتى بداية الشهر القادم أو ترقية باقتك.`);
        showSubscriptions();
        return;
      }
    }
    
    addUserMessage(message);
    
    if (message.startsWith("/")) {
      handleCommand(message);
    } else {
      if (!user?.birthDate || !user?.dialect) {
        addBotMessage("لم تكمل إعداد ملفك الشخصي بعد. الرجاء كتابة /start للبدء.");
      } else {
        setTimeout(() => {
          const dialectInfo = getDialectInfo(user.dialect!);
          const inTrial = isInTrialPeriod(user.firstLoginDate);
          const forecastRange = user.subscriptionTier === 3 ? "عامين" : "7 أيام";
          
          addBotMessage(`إجابة على سؤالك ${dialectInfo?.flag || "✨"}\n\n${message.length % 2 === 0 ? 
            `النجوم تشير إلى أن هذا وقت مناسب للمضي قدماً. القمر في بيتك الخامس يدعم القرارات الجديدة. توقعات للـ ${forecastRange} القادمة تبدو إيجابية 🌙✨` : 
            `الكواكب تنصحك بالتروي قليلاً. زحل في وضع معاكس يشير إلى ضرورة التأني والتفكير مرة أخرى. خلال الـ ${forecastRange} القادمة، قد تواجه بعض التحديات 🪐✨`}`);
        }, 1000);
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
    addBotMessage("مرحباً بك في النجم العربي ✨\n\nلنبدأ بإعداد ملفك الشخصي لقراءة فلكية دقيقة.");
    
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
                
                const updatedUser = getUser();
                if (!updatedUser) return;
                
                const dialectInfo = getDialectInfo(dialect);
                const inTrial = isInTrialPeriod(updatedUser.firstLoginDate);
                const trialInfo = inTrial ? 
                  "\n\nأنت حالياً في فترة التجربة المجانية (7 أيام) مع إمكانية وصول كاملة ✨" : 
                  "";
                  
                addBotMessage(`تم إكمال الإعداد بنجاح ✨ ${dialectInfo?.flag || ""}\n\n${getDialectGreeting(dialect)}${trialInfo}`);
                
                // Show birth chart summary after onboarding
                setTimeout(() => {
                  const birthChartSummary = generateBirthChartSummary(updatedUser);
                  addBotMessage(birthChartSummary);
                  
                  // Show available commands after birth chart
                  setTimeout(() => {
                    addBotMessage(
                      "يمكنك استخدام الأوامر التالية:\n" +
                      "/horoscope - لقراءتك اليومية 🔮\n" +
                      "/love - لتوقعات الحب والعلاقات ❤️\n" +
                      "/career - لتوقعات العمل والمهنة 💼\n" +
                      "/health - لتوقعات الصحة والعافية 🌿\n" +
                      "/ask - لطرح سؤال مخصص ❓"
                    );
                  }, 1500);
                }, 1500);
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
    const inTrial = isInTrialPeriod(user.firstLoginDate);
    const trialEndDate = user.firstLoginDate ? 
      new Date(new Date(user.firstLoginDate).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("ar") :
      "";
    
    const tierInfo = SUBSCRIPTION_TIERS.find(t => t.id === user.subscriptionTier)!;
    
    const zodiacSign = getZodiacSign(user.birthDate);
    const zodiacEmoji = getZodiacEmoji(zodiacSign);
    
    addBotMessage(
      `بياناتك 📋\n\n` +
      `اللهجة: ${dialectInfo?.nameArabic} ${dialectInfo?.flag || ""} 🗣️\n` +
      `تاريخ الميلاد: ${new Date(user.birthDate).toLocaleDateString("ar")} 📅\n` +
      `وقت الميلاد: ${user.birthTime} ⏰\n` +
      `مكان الميلاد: ${user.birthPlace} 📍\n` +
      `البرج: ${zodiacSign} ${zodiacEmoji}\n` +
      `نوع الاشتراك: ${tierInfo.arabicName} ${tierInfo.icon} ⭐\n` +
      (inTrial ? `تنتهي فترة التجربة المجانية في: ${trialEndDate} 📆\n` : "") +
      (user.subscriptionTier === 0 && !inTrial ? `الأسئلة المتبقية اليوم: ${3 - user.messageCountToday}/3 📝\n` : "") +
      (user.subscriptionTier > 0 && tierInfo.questionsPerMonth ? `الأسئلة المتبقية هذا الشهر: ${tierInfo.questionsPerMonth - user.totalMessagesThisMonth}/${tierInfo.questionsPerMonth} 📝\n` : "")
    );
    
    // Add birth chart after user data
    setTimeout(() => {
      const birthChartSummary = generateBirthChartSummary(user);
      addBotMessage(birthChartSummary);
    }, 1000);
  };
  
  const changeDialect = () => {
    setDialogContent(
      <DialectSelector
        onSelect={(dialect) => {
          updateUserDialect(dialect);
          setUser(prev => prev ? { ...prev, dialect } : null);
          setIsDialogOpen(false);
          
          const dialectInfo = getDialectInfo(dialect);
          addBotMessage(`تم تغيير اللهجة بنجاح إلى ${dialectInfo?.nameArabic} ${dialectInfo?.flag || ""}`);
        }}
        selectedDialect={user?.dialect}
      />
    );
    setIsDialogOpen(true);
  };
  
  const showSubscriptions = (isLimitReached = false) => {
    if (!user) return;
    
    const isTrialEnded = !isInTrialPeriod(user.firstLoginDate);
    
    setDialogContent(
      <SubscriptionCard 
        currentTier={user.subscriptionTier} 
        onSubscribe={(tier) => {
          setUser(prev => prev ? { ...prev, subscriptionTier: tier } : null);
          setIsDialogOpen(false);
          addBotMessage(`تم تحديث اشتراكك بنجاح ✨ شكراً لدعمك.`);
        }}
        isTrialEnded={isTrialEnded}
      />
    );
    setIsDialogOpen(true);
  };
  
  const showHoroscope = (type: HoroscopeType) => {
    if (!user || !user.birthDate || !user.dialect) {
      addBotMessage("لم تكمل إعداد ملفك الشخصي بعد. الرجاء كتابة /start للبدء.");
      return;
    }
    
    const inTrial = isInTrialPeriod(user.firstLoginDate);
    
    if (!inTrial && !canAccessHoroscopeType(user.subscriptionTier, type, user.firstLoginDate)) {
      addBotMessage(getUpgradeMessage(
        user.subscriptionTier,
        type === "daily" ? "daily" : "all_topics",
        true
      ));
      setDialogContent(
        <SubscriptionCard 
          currentTier={user.subscriptionTier} 
          onSubscribe={(tier) => {
            setUser(prev => prev ? { ...prev, subscriptionTier: tier } : null);
            setIsDialogOpen(false);
            addBotMessage(`تم ترقية اشتراكك بنجاح ✨ شكراً لدعمك.`);
            
            setTimeout(() => showHoroscope(type), 1000);
          }}
          isTrialEnded={true}
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
    
    const forecastRange = getForecastRange(user.subscriptionTier);
    const forecastInfo = `(توقعات لـ ${forecastRange})`;
    
    const dialectInfo = getDialectInfo(user.dialect);
    addBotMessage(`${horoscope.title} ${typeEmojis[type]} ${dialectInfo?.flag || ""} ${forecastInfo}\n\n${horoscope.content}\n\nالرقم المحظوظ: ${horoscope.luckyNumber} 🔮\nالنجم المحظوظ: ${horoscope.luckyStar} 🌟\nاللون المحظوظ: ${horoscope.luckyColor} 🎨`);
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
          handleUserMessage(question);
        }}
        onUpgrade={() => {
          setIsDialogOpen(false);
          showSubscriptions();
        }}
      />
    );
    setIsDialogOpen(true);
  };
  
  const getSubscriptionStatus = () => {
    if (!user) return null;
    
    const inTrial = isInTrialPeriod(user.firstLoginDate);
    
    if (inTrial) {
      const trialEndDate = user.firstLoginDate ? 
        new Date(new Date(user.firstLoginDate).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("ar") :
        "";
      
      return (
        <Badge variant="outline" className="mx-auto">
          تجربة مجانية - تنتهي في {trialEndDate}
        </Badge>
      );
    }
    
    if (user.subscriptionTier === 0) {
      return (
        <Badge variant="outline" className="mx-auto">
          {3 - user.messageCountToday}/3 أسئلة متبقية اليوم
        </Badge>
      );
    }
    
    const tierInfo = SUBSCRIPTION_TIERS.find(t => t.id === user.subscriptionTier);
    if (tierInfo && tierInfo.questionsPerMonth) {
      return (
        <Badge variant="outline" className="mx-auto">
          {tierInfo.questionsPerMonth - user.totalMessagesThisMonth}/{tierInfo.questionsPerMonth} سؤال متبقي هذا الشهر
        </Badge>
      );
    }
    
    return null;
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
          
          {getSubscriptionStatus() && (
            <div className="mb-4 flex justify-center">
              {getSubscriptionStatus()}
            </div>
          )}
          
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
              
              {getSubscriptionStatus() && (
                <div className="mt-2">
                  {getSubscriptionStatus()}
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-center">📋 الأوامر المتاحة</h3>
              <CommandButtons 
                onCommand={(cmd) => {
                  setActiveTab("chat");
                  handleCommand(cmd);
                }}
                subscriptionTier={user?.subscriptionTier}
                isTrialEnded={user ? !isInTrialPeriod(user.firstLoginDate) : false}
              />
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
                    onClick={() => showSubscriptions()}
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

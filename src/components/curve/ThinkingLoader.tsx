import { Brain } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const thinkingPhrases = [
  "意图理解中...",
  "检索知识库...",
  "分子结构对比中...",
  "生成分析报告...",
];

const ThinkingLoader = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % thinkingPhrases.length);
    }, 1500);
    return () => clearInterval(phraseTimer);
  }, []);

  return (
    <div className="flex items-start gap-4 p-4">
      {/* 核心：引力波与呼吸头像 */}
      <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center">
        {/* 引力波：绝对定位的 div，使用 animate-ping */}
        <div 
          className="absolute inset-0 rounded-xl bg-[#123aff] opacity-20 animate-ping"
          style={{ animationDuration: '2s' }}
        />
        
        {/* 核心头像：白色圆角矩形，使用 animate-pulse */}
        <div 
          className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-100 z-10 animate-pulse"
          style={{ 
            animationDuration: '1.5s',
            boxShadow: '0 0 15px rgba(18, 58, 255, 0.2)' 
          }}
        >
          <Brain className="w-5 h-5" style={{ color: '#123aff' }} />
        </div>
      </div>

      {/* 文案区域：向上滑入切换 */}
      <div className="flex-1 flex items-center h-10">
        <div className="relative w-full h-6 overflow-hidden">
          {thinkingPhrases.map((phrase, index) => (
            <div
              key={phrase}
              className={cn(
                "absolute inset-0 text-sm text-slate-500 font-medium flex items-center transition-all duration-500 ease-in-out",
                index === phraseIndex
                  ? "opacity-100 translate-y-0"
                  : index < phraseIndex 
                    ? "opacity-0 -translate-y-4"
                    : "opacity-0 translate-y-4"
              )}
            >
              {phrase}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThinkingLoader;

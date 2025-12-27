import { Brain, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const thinkingPhrases = [
  "正在思考中...",
  "分析问题...",
  "整理思路...",
  "构建回复...",
  "深度分析...",
];

const ThinkingLoader = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [dots, setDots] = useState(1);

  // Rotate through phrases
  useEffect(() => {
    const phraseTimer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % thinkingPhrases.length);
    }, 2500);
    return () => clearInterval(phraseTimer);
  }, []);

  // Animate dots
  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((prev) => (prev % 3) + 1);
    }, 400);
    return () => clearInterval(dotTimer);
  }, []);

  return (
    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-primary/5 via-muted/30 to-primary/5 rounded-xl border border-primary/20 animate-fade-in">
      {/* Animated brain icon */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary animate-pulse" />
        </div>
        
        {/* Orbiting sparkle */}
        <div className="absolute -inset-1 animate-spin" style={{ animationDuration: "3s" }}>
          <Sparkles className="w-3 h-3 text-primary/60 absolute -top-1 left-1/2 -translate-x-1/2" />
        </div>
        
        {/* Ping effect */}
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full animate-ping opacity-75" />
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full" />
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Thinking phrase with transition */}
        <div className="relative h-5 overflow-hidden">
          {thinkingPhrases.map((phrase, index) => (
            <span
              key={phrase}
              className={cn(
                "absolute left-0 text-sm font-medium text-foreground transition-all duration-300",
                index === phraseIndex
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-4"
              )}
            >
              {phrase.replace("...", "")}
              <span className="text-primary">{".".repeat(dots)}</span>
            </span>
          ))}
        </div>

        {/* Animated progress bars */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full animate-thinking-bar"
                style={{ width: "60%" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary/40 via-primary/70 to-primary/40 rounded-full animate-thinking-bar"
                style={{ width: "40%", animationDelay: "200ms" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-0.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 rounded-full animate-thinking-bar"
                style={{ width: "75%", animationDelay: "400ms" }}
              />
            </div>
          </div>
        </div>

        {/* Bouncing dots */}
        <div className="mt-3 flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThinkingLoader;

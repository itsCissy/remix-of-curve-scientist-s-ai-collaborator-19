import { Brain } from "lucide-react";
import ShinyText from "./ShinyText";

interface ThinkingLoaderProps {
  /** 是否为内联模式（在消息内容区域显示） */
  inline?: boolean;
}

const ThinkingLoader = ({ inline = false }: ThinkingLoaderProps) => {
  if (inline) {
    // 内联模式：简洁的思考指示器
    return (
      <div className="flex items-center gap-2 animate-message-enter">
        <div className="animate-pulse-soft">
          <Brain className="w-4 h-4 text-slate-400" />
        </div>
        <ShinyText
          text="Thinking..."
          speed={2}
          delay={0}
          spread={120}
          textColor="#94a3b8"
          shineColor="#cbd5e1"
          direction="left"
          className="text-sm"
        />
      </div>
    );
  }

  // 独立模式：完整的思考加载器
  return (
    <div className="flex items-start gap-4 p-4 animate-message-enter">
      <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center">
        <div className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-100 animate-pulse-soft">
          <Brain className="w-5 h-5" style={{ color: '#123aff' }} />
        </div>
      </div>
      <div className="flex-1 flex items-center h-10">
        <ShinyText
          text="Thinking..."
          speed={2}
          delay={0}
          spread={120}
          textColor="#475569"
          shineColor="#A2A8B7"
          direction="left"
          className="text-sm font-medium"
        />
      </div>
    </div>
  );
};

export default ThinkingLoader;

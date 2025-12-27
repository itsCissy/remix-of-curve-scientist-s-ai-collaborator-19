import { Eye, ChevronDown, Send } from "lucide-react";
import AgentAvatar from "./AgentAvatar";

const ChatInput = () => {
  return (
    <div className="px-6 py-4">
      <div className="max-w-[900px] mx-auto">
        <div className="bg-card rounded-xl shadow-input border border-border overflow-hidden">
          {/* Input area */}
          <div className="px-4 py-3">
            <input
              type="text"
              placeholder="Send to Curve"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/50">
            <button className="p-2 rounded-lg hover:bg-curve-hover transition-colors text-muted-foreground hover:text-foreground">
              <Eye className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {/* Agent Selector */}
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-curve-hover transition-colors text-sm">
                <AgentAvatar size="sm" />
                <span className="text-foreground font-medium">Xtalpi Agent</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Send Button */}
              <button className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;

import { useState, KeyboardEvent } from "react";
import { Eye, ChevronDown, Send, Loader2 } from "lucide-react";
import AgentAvatar from "./AgentAvatar";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-6 py-4">
      <div className="max-w-[900px] mx-auto">
        <div className="bg-card rounded-xl shadow-input border border-border overflow-hidden">
          {/* Input area */}
          <div className="px-4 py-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，按 Enter 发送..."
              disabled={isLoading}
              rows={1}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[24px] max-h-[200px]"
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 200) + "px";
              }}
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
                <span className="text-foreground font-medium">Curve Agent</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;

import { useState, KeyboardEvent } from "react";
import { Eye, Send, Loader2 } from "lucide-react";
import AgentSelector from "./AgentSelector";
import { Agent } from "@/lib/agents";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  selectedAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
}

const ChatInput = ({ onSend, isLoading, selectedAgent, onSelectAgent }: ChatInputProps) => {
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
              <AgentSelector
                selectedAgent={selectedAgent}
                onSelectAgent={onSelectAgent}
              />

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

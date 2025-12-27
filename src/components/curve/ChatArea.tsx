import { useState, useRef, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import UserMessage from "./UserMessage";
import AgentMessage from "./AgentMessage";
import ChatInput from "./ChatInput";
import { Message, parseMessageContent, generateId } from "@/lib/messageUtils";
import { useToast } from "@/hooks/use-toast";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const ChatArea = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = "";
    
    const upsertAssistant = (nextChunk: string) => {
      assistantContent += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: assistantContent, isStreaming: true }
              : m
          );
        }
        return [
          ...prev,
          {
            id: generateId(),
            role: "assistant" as const,
            content: assistantContent,
            timestamp: new Date(),
            isStreaming: true,
          },
        ];
      });
    };

    try {
      const messagesToSend = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: messagesToSend }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          toast({
            title: "请求过于频繁",
            description: errorData.error || "请稍后再试",
            variant: "destructive",
          });
        } else if (resp.status === 402) {
          toast({
            title: "额度不足",
            description: errorData.error || "请充值后再试",
            variant: "destructive",
          });
        } else {
          toast({
            title: "发送失败",
            description: errorData.error || "请稍后重试",
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      if (!resp.body) {
        throw new Error("No response body");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            /* ignore */
          }
        }
      }

      // Mark streaming as done
      setMessages((prev) =>
        prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
      );
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "发送失败",
        description: "网络错误，请检查连接后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
      <ChatHeader projectName="Curve Agent" />

      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
        <div className="max-w-[900px] mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🧪</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                欢迎使用 Curve Agent
              </h2>
              <p className="text-muted-foreground max-w-md">
                我是专业的 AI 研究助手，可以帮助你进行分子结构分析、科学研究和数据分析。
                发送消息开始对话吧！
              </p>
            </div>
          ) : (
            messages.map((message) =>
              message.role === "user" ? (
                <UserMessage key={message.id} content={message.content} />
              ) : (
                <AgentMessage
                  key={message.id}
                  content={message.content}
                  parsedContent={parseMessageContent(message.content)}
                  isStreaming={message.isStreaming}
                />
              )
            )
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
};

export default ChatArea;

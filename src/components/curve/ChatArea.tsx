import { useState, useRef, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import UserMessage from "./UserMessage";
import AgentMessage from "./AgentMessage";
import ChatInput, { UploadedFile } from "./ChatInput";
import AgentSwitchDialog from "./AgentSwitchDialog";
import { Message as LocalMessage, parseMessageContent, generateId } from "@/lib/messageUtils";
import { Agent, DEFAULT_AGENT } from "@/lib/agents";
import { useToast } from "@/hooks/use-toast";
import { useMessages } from "@/hooks/useProjects";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface ChatAreaProps {
  projectId: string | null;
  projectName: string;
}

const ChatArea = ({ projectId, projectName }: ChatAreaProps) => {
  const { messages: dbMessages, addMessage, clearMessages, isLoading: messagesLoading } = useMessages(projectId);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(DEFAULT_AGENT);
  const [pendingAgent, setPendingAgent] = useState<Agent | null>(null);
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Sync database messages to local state
  useEffect(() => {
    const mapped: LocalMessage[] = dbMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      timestamp: new Date(m.created_at),
      attachments: m.files ? m.files.attachments : undefined,
    }));
    setLocalMessages(mapped);
  }, [dbMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const handleAgentChange = (agent: Agent) => {
    if (agent.id === selectedAgent.id) return;
    
    if (localMessages.length > 0) {
      setPendingAgent(agent);
      setShowSwitchDialog(true);
    } else {
      setSelectedAgent(agent);
      toast({
        title: "已切换 Agent",
        description: `当前使用: ${agent.name}`,
      });
    }
  };

  const handleSwitchConfirm = async (keepHistory: boolean) => {
    if (!pendingAgent) return;
    
    if (!keepHistory) {
      await clearMessages();
      setLocalMessages([]);
    }
    
    setSelectedAgent(pendingAgent);
    toast({
      title: "已切换 Agent",
      description: `当前使用: ${pendingAgent.name}${keepHistory ? "，已保留对话记录" : ""}`,
    });
    
    setPendingAgent(null);
    setShowSwitchDialog(false);
  };

  const handleSend = async (input: string, files?: UploadedFile[]) => {
    if ((!input.trim() && (!files || files.length === 0)) || isLoading) return;
    if (!projectId) {
      toast({
        title: "请先选择或创建项目",
        description: "需要一个项目来保存对话",
        variant: "destructive",
      });
      return;
    }

    // Build message content with file references
    let messageContent = input.trim();
    const attachments: { name: string; type: string; size: number; preview?: string }[] = [];
    
    if (files && files.length > 0) {
      files.forEach((f) => {
        attachments.push({
          name: f.file.name,
          type: f.file.type,
          size: f.file.size,
          preview: f.preview,
        });
      });
    }

    const userMessage: LocalMessage = {
      id: generateId(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
      attachments,
    };

    // Add to local state immediately for UX
    setLocalMessages((prev) => [...prev, userMessage]);
    
    // Save to database
    await addMessage({
      role: "user",
      content: messageContent,
      agent_id: selectedAgent.id,
      files: attachments.length > 0 ? { attachments } : null,
    });

    setIsLoading(true);

    let assistantContent = "";
    
    const upsertAssistant = (nextChunk: string) => {
      assistantContent += nextChunk;
      setLocalMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.isStreaming) {
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
      const messagesToSend = [...localMessages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: messagesToSend,
          agentId: selectedAgent.id,
        }),
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

      // Mark streaming as done and save to database
      setLocalMessages((prev) =>
        prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
      );

      // Save assistant message to database
      if (assistantContent) {
        await addMessage({
          role: "assistant",
          content: assistantContent,
          agent_id: selectedAgent.id,
        });
      }
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
      <ChatHeader projectName={projectName} />

      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
        <div className="max-w-[900px] mx-auto space-y-6">
          {localMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">{selectedAgent.icon}</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                欢迎使用 {selectedAgent.name}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {selectedAgent.description}。发送消息开始对话吧！
              </p>
            </div>
          ) : (
            localMessages.map((message) =>
              message.role === "user" ? (
                <UserMessage 
                  key={message.id} 
                  content={message.content}
                  attachments={message.attachments}
                />
              ) : (
                <AgentMessage
                  key={message.id}
                  content={message.content}
                  parsedContent={parseMessageContent(message.content)}
                  isStreaming={message.isStreaming}
                  files={message.files}
                />
              )
            )
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput 
        onSend={handleSend} 
        isLoading={isLoading}
        selectedAgent={selectedAgent}
        onSelectAgent={handleAgentChange}
      />

      <AgentSwitchDialog
        open={showSwitchDialog}
        onOpenChange={setShowSwitchDialog}
        fromAgent={selectedAgent}
        toAgent={pendingAgent ?? selectedAgent}
        messageCount={localMessages.length}
        onConfirm={handleSwitchConfirm}
      />
    </div>
  );
};

export default ChatArea;

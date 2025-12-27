import { useState, useRef, useEffect, useCallback } from "react";
import ChatHeader from "./ChatHeader";
import UserMessage from "./UserMessage";
import AgentMessage from "./AgentMessage";
import ChatInput, { UploadedFile } from "./ChatInput";
import AgentSwitchDialog from "./AgentSwitchDialog";
import BranchTreeView from "./BranchTreeView";
import CreateBranchDialog from "./CreateBranchDialog";
import MergeBranchDialog from "./MergeBranchDialog";
import { Message as LocalMessage, parseMessageContent, generateId } from "@/lib/messageUtils";
import { Agent, DEFAULT_AGENT } from "@/lib/agents";
import { useToast } from "@/hooks/use-toast";
import { useMessages } from "@/hooks/useProjects";
import { useBranches, useCollaborator } from "@/hooks/useBranches";
import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface ChatAreaProps {
  projectId: string | null;
  projectName: string;
}

const ChatArea = ({ projectId, projectName }: ChatAreaProps) => {
  const { messages: dbMessages, addMessage, clearMessages, isLoading: messagesLoading } = useMessages(projectId);
  const { 
    branches, 
    currentBranch, 
    ensureMainBranch, 
    createBranch, 
    switchBranch,
    mergeBranch,
    deleteBranch,
    renameBranch,
  } = useBranches(projectId);
  const { collaborator, allCollaborators, ensureCollaborator } = useCollaborator(projectId);
  
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(DEFAULT_AGENT);
  const [pendingAgent, setPendingAgent] = useState<Agent | null>(null);
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [showBranchTree, setShowBranchTree] = useState(false);
  const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeBranchId, setMergeBranchId] = useState<string | null>(null);
  const [mergeBranchConclusion, setMergeBranchConclusion] = useState<string | undefined>(undefined);
  const [branchPointMessageId, setBranchPointMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Calculate message count and content by branch
  const [messageCountByBranch, setMessageCountByBranch] = useState<Record<string, number>>({});
  const [messagesByBranch, setMessagesByBranch] = useState<Record<string, { content: string; role: string }[]>>({});

  // Fetch message data only when entering branch tree view, not on every message change
  const fetchBranchMessageData = useCallback(async () => {
    if (!projectId || branches.length === 0) return;
    
    const counts: Record<string, number> = {};
    const messagesData: Record<string, { content: string; role: string }[]> = {};
    
    for (const branch of branches) {
      if (branch.is_main) {
        // Main branch includes messages with null branch_id (legacy messages)
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("project_id", projectId)
          .or(`branch_id.eq.${branch.id},branch_id.is.null`);
        counts[branch.id] = count || 0;
        
        // Get messages for main branch
        const { data: messages } = await supabase
          .from("messages")
          .select("content, role")
          .eq("project_id", projectId)
          .or(`branch_id.eq.${branch.id},branch_id.is.null`)
          .order("created_at", { ascending: true })
          .limit(10);
        
        messagesData[branch.id] = messages || [];
      } else {
        // Non-main branches only include their specific messages
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("branch_id", branch.id);
        counts[branch.id] = count || 0;
        
        const { data: messages } = await supabase
          .from("messages")
          .select("content, role")
          .eq("branch_id", branch.id)
          .order("created_at", { ascending: true })
          .limit(10);
        
        messagesData[branch.id] = messages || [];
      }
    }
    
    setMessageCountByBranch(counts);
    setMessagesByBranch(messagesData);
  }, [projectId, branches]);

  // Fetch branch data only when showing branch tree view
  useEffect(() => {
    if (showBranchTree) {
      fetchBranchMessageData();
    }
  }, [showBranchTree, fetchBranchMessageData]);

  // Sync database messages to local state, filtered by current branch
  useEffect(() => {
    const filtered = currentBranch
      ? dbMessages.filter((m) => m.branch_id === currentBranch.id || !m.branch_id)
      : dbMessages;
    
    const mapped: LocalMessage[] = filtered.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      timestamp: new Date(m.created_at),
      attachments: m.files ? m.files.attachments : undefined,
      collaboratorId: m.collaborator_id,
    }));
    setLocalMessages(mapped);
  }, [dbMessages, currentBranch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  // Ensure main branch exists when project is loaded
  useEffect(() => {
    if (projectId) {
      ensureMainBranch();
      ensureCollaborator();
    }
  }, [projectId, ensureMainBranch, ensureCollaborator]);

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

  const handleCreateBranch = (messageId: string) => {
    setBranchPointMessageId(messageId);
    setShowCreateBranchDialog(true);
  };

  const handleConfirmCreateBranch = async (name: string, inheritContext?: boolean) => {
    if (!branchPointMessageId) return;
    
    const newBranch = await createBranch(
      branchPointMessageId,
      name,
      undefined, // description is no longer used
      collaborator?.id
    );
    
    if (newBranch) {
      switchBranch(newBranch.id);
    }
    
    setBranchPointMessageId(null);
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

    // Ensure we have a branch
    let branchId = currentBranch?.id;
    if (!branchId) {
      const mainBranch = await ensureMainBranch();
      branchId = mainBranch?.id;
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
      collaboratorId: collaborator?.id,
    };

    // Add to local state immediately for UX
    setLocalMessages((prev) => [...prev, userMessage]);
    
    // Save to database with branch and collaborator info
    await supabase.from("messages").insert({
      project_id: projectId,
      role: "user",
      content: messageContent,
      agent_id: selectedAgent.id,
      files: attachments.length > 0 ? { attachments } : null,
      branch_id: branchId,
      collaborator_id: collaborator?.id,
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

      // Save assistant message to database with branch info
      if (assistantContent) {
        await supabase.from("messages").insert({
          project_id: projectId,
          role: "assistant",
          content: assistantContent,
          agent_id: selectedAgent.id,
          branch_id: branchId,
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

  // Get collaborator for a message
  const getCollaboratorForMessage = (collaboratorId?: string) => {
    if (!collaboratorId) return null;
    return allCollaborators.find((c) => c.id === collaboratorId) || null;
  };

  // Handle merge branch request
  const handleMergeBranch = (branchId: string, conclusion?: string) => {
    setMergeBranchId(branchId);
    setMergeBranchConclusion(conclusion);
    setShowMergeDialog(true);
  };

  const handleConfirmMerge = async (mergeType: "messages" | "summary", summary?: string) => {
    if (!mergeBranchId) return;
    await mergeBranch(mergeBranchId, mergeType, summary);
    setMergeBranchId(null);
    setMergeBranchConclusion(undefined);
  };

  // Get the branch name for merge dialog
  const getMergeBranchName = () => {
    if (!mergeBranchId) return "";
    const branch = branches.find(b => b.id === mergeBranchId);
    return branch?.name || "";
  };

  const getMainBranchName = () => {
    const mainBranch = branches.find(b => b.is_main);
    return mainBranch?.name || "主线";
  };

  // Handle creating branch from branch view
  const handleCreateBranchFromView = async (parentBranchId: string, name: string, inheritContext: boolean) => {
    // Find a message from parent branch to use as branch point
    const parentMessages = messagesByBranch[parentBranchId] || [];
    const lastMessage = parentMessages[parentMessages.length - 1];
    
    // Get a message ID from the database for the branch point
    const { data: messagesData } = await supabase
      .from("messages")
      .select("id")
      .eq("branch_id", parentBranchId)
      .order("created_at", { ascending: false })
      .limit(1);
    
    const branchPointId = messagesData?.[0]?.id || null;
    
    const newBranch = await createBranch(
      branchPointId,
      name,
      inheritContext ? "继承上下文" : "独立分支",
      collaborator?.id
    );
    
    if (newBranch) {
      // If inheriting context, copy messages from parent
      if (inheritContext && branchPointId) {
        // The branch already handles context inheritance through branch_point_message_id
      }
      switchBranch(newBranch.id);
      setShowBranchTree(false);
    }
  };

  // Show branch tree view
  if (showBranchTree) {
    return (
      <>
        <BranchTreeView
          branches={branches}
          collaborators={allCollaborators}
          currentBranchId={currentBranch?.id || null}
          onSelectBranch={(branchId) => {
            switchBranch(branchId);
            setShowBranchTree(false);
          }}
          onDeleteBranch={deleteBranch}
          onRenameBranch={renameBranch}
          onMergeBranch={handleMergeBranch}
          onBack={() => setShowBranchTree(false)}
          messageCountByBranch={messageCountByBranch}
          messagesByBranch={messagesByBranch}
          onCreateBranch={handleCreateBranchFromView}
        />
        <MergeBranchDialog
          open={showMergeDialog}
          onOpenChange={setShowMergeDialog}
          sourceBranchName={getMergeBranchName()}
          targetBranchName={getMainBranchName()}
          sourceConclusion={mergeBranchConclusion}
          onConfirm={handleConfirmMerge}
        />
      </>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
      <ChatHeader 
        projectName={projectName}
        currentBranch={currentBranch}
        collaborators={allCollaborators}
        onShowBranchTree={() => setShowBranchTree(true)}
      />

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
                  messageId={message.id}
                  onCreateBranch={handleCreateBranch}
                  collaborator={getCollaboratorForMessage(message.collaboratorId)}
                />
              ) : (
                <AgentMessage
                  key={message.id}
                  content={message.content}
                  parsedContent={parseMessageContent(message.content)}
                  isStreaming={message.isStreaming}
                  files={message.files}
                  messageId={message.id}
                  onCreateBranch={handleCreateBranch}
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

      <CreateBranchDialog
        open={showCreateBranchDialog}
        onOpenChange={setShowCreateBranchDialog}
        onConfirm={handleConfirmCreateBranch}
        parentBranchName={currentBranch?.name}
      />
    </div>
  );
};

export default ChatArea;
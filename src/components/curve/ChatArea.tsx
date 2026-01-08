import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bot } from "lucide-react";
import UserMessage from "./UserMessage";
import { useNavigation } from "@/contexts/NavigationContext";
import AgentMessage from "./AgentMessage";
import ChatInput, { UploadedFile } from "./ChatInput";
import AgentSwitchDialog from "./AgentSwitchDialog";
import BranchTreeView from "./BranchTreeView";
import CreateBranchDialog from "./CreateBranchDialog";
import MergeBranchDialog from "./MergeBranchDialog";
import SaveSkillDialog from "./SaveSkillDialog";
import FileCenter from "./FileCenter";
import { Message as LocalMessage, parseMessageContent, generateId, ParsedContent } from "@/lib/messageUtils";
import { cn } from "@/lib/utils";
import { Agent, DEFAULT_AGENT, AVAILABLE_AGENTS } from "@/lib/agents";
import { useToast } from "@/hooks/use-toast";
import { useMessages } from "@/hooks/useProjects";
import { useBranches, useCollaborator } from "@/hooks/useBranches";
import { useFileAssets, extractFilesFromContent, detectCategory } from "@/hooks/useFileAssets";
import { supabase, isLocalMode } from "@/integrations/supabase/client";
import { useSmartFolder } from "@/hooks/useSmartFolder";
import { streamChat } from "@/lib/localAI";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface ChatAreaProps {
  projectId: string | null;
  projectName: string;
}

const ChatArea = ({ projectId, projectName }: ChatAreaProps) => {
  console.log("[ChatArea] render", { projectId, projectName });
  const navigate = useNavigate();
  const { 
    setBreadcrumbItems, 
    setOnShowBranchTree, 
    setOnShowFileCenter, 
    setFileUnreadCount,
    setOnSendToAgent,
    setOnNavigateToMessage,
    setFolderBranchId,
    setFolderBranchName,
    contentWidth,
    pendingSkillInjection,
    clearSkillInjection,
  } = useNavigation();
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
  const { assets, isLoading: assetsLoading, deleteAsset, unreadCount, resetUnreadCount } = useFileAssets(projectId);
  const { archiveContent } = useSmartFolder({ 
    projectId,
    branchId: currentBranch?.id || null,
  });
  
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(DEFAULT_AGENT);
  const [pendingAgent, setPendingAgent] = useState<Agent | null>(null);
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [showBranchTree, setShowBranchTree] = useState(false);
  const [showFileCenter, setShowFileCenter] = useState(false);
  const [fileCenterSource, setFileCenterSource] = useState<"chat" | "branch">("chat");
  const [showCreateBranchDialog, setShowCreateBranchDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeBranchId, setMergeBranchId] = useState<string | null>(null);
  const [mergeBranchConclusion, setMergeBranchConclusion] = useState<string | undefined>(undefined);
  const [branchPointMessageId, setBranchPointMessageId] = useState<string | null>(null);
  const [showSaveSkillDialog, setShowSaveSkillDialog] = useState(false);
  const [saveSkillContent, setSaveSkillContent] = useState<string>("");
  const [externalContent, setExternalContent] = useState<string>("");
  const [agentSwitched, setAgentSwitched] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // AbortController for canceling streaming responses
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentProjectIdRef = useRef<string | null>(null);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up streaming timeout
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
        streamingTimeoutRef.current = null;
      }
      
      // Abort any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Handle skill injection from NavigationContext
  useEffect(() => {
    if (pendingSkillInjection) {
      setExternalContent(pendingSkillInjection.content);

      // Auto-switch agent if needed
      if (pendingSkillInjection.targetAgentId && 
          pendingSkillInjection.targetAgentId !== selectedAgent.id) {
        const targetAgent = AVAILABLE_AGENTS.find(
          (a) => a.id === pendingSkillInjection.targetAgentId
        );
        if (targetAgent) {
          setSelectedAgent(targetAgent);
          setAgentSwitched(true);
          // Reset flash state after animation
          setTimeout(() => setAgentSwitched(false), 700);
        }
      }

      toast({
        title: "技能已加载",
        description: `「${pendingSkillInjection.skillName}」指令已填充到输入框`,
      });

      clearSkillInjection();
    }
  }, [pendingSkillInjection, selectedAgent.id, clearSkillInjection, toast]);

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

  // Strict project ID binding: filter messages by current projectId
  useEffect(() => {
    // Project ID scoping: only render messages that strictly match current projectId
    if (!projectId) {
      setLocalMessages([]);
      return;
    }
    
    // Frontend secondary interception: force filter by projectId before rendering
    // This ensures messages not belonging to current project never enter DOM
    const projectMessages = dbMessages.filter((m) => {
      // Strict validation: reject messages that don't match current projectId
      if (m.project_id !== projectId) {
        console.warn(`Rejecting message ${m.id} - project_id mismatch: ${m.project_id} !== ${projectId}`);
        return false;
      }
      return true;
    });
    
    // Additional validation: double-check all messages belong to current project
    const scopedMessages = projectMessages.filter(m => m.project_id === projectId);
    
    const filtered = currentBranch
      ? scopedMessages.filter((m) => m.branch_id === currentBranch.id || !m.branch_id)
      : scopedMessages;
    
    const mapped: LocalMessage[] = filtered.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      timestamp: new Date(m.created_at),
      attachments: m.files ? m.files.attachments : undefined,
      collaboratorId: m.collaborator_id,
    }));
    
    // Only update if projectId matches (prevent stale data from previous project)
    if (currentProjectIdRef.current === projectId) {
      setLocalMessages(mapped);
    }
  }, [dbMessages, currentBranch, projectId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 动态计算内容区域最大宽度，避免右栏遮挡
  const computedContentMaxWidth = (() => {
    const fallback = 960;
    if (!contentWidth || contentWidth <= 0) return fallback;
    // 预留左右内边距（约 32px）并限制上限
    return Math.min(1100, Math.max(640, contentWidth - 32));
  })();

  const scrollToMessage = useCallback((messageId: string) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Add a highlight effect
      messageElement.classList.add("ring-2", "ring-[#123aff]", "ring-offset-2", "rounded-lg");
      setTimeout(() => {
        messageElement.classList.remove("ring-2", "ring-[#123aff]", "ring-offset-2", "rounded-lg");
      }, 2000);
    }
  }, []);

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

  // Store handleSend in a ref for global search access
  const handleSendRef = useRef<typeof handleSend | null>(null);
  
  const { setIsBranchTreeView, setOnBackFromBranchTree } = useNavigation();

  // Update navigation context
  useEffect(() => {
    // Only show branch name in breadcrumb if it's not the main branch
    const breadcrumb: Array<{ label: string; onClick?: () => void }> = [];
    if (currentBranch && !currentBranch.is_main) {
      breadcrumb.push({ label: currentBranch.name });
    }
    setBreadcrumbItems(breadcrumb);
    setOnShowBranchTree(() => () => setShowBranchTree(true));
    setOnShowFileCenter(() => () => {
      resetUnreadCount();
      setFileCenterSource("chat");
      setShowFileCenter(true);
    });
    setFileUnreadCount(unreadCount);
    
    // Update branch tree view state
    setIsBranchTreeView(showBranchTree);
    setOnBackFromBranchTree(() => () => setShowBranchTree(false));
  }, [projectName, currentBranch, unreadCount, showBranchTree, setBreadcrumbItems, setOnShowBranchTree, setOnShowFileCenter, setFileUnreadCount, resetUnreadCount, setIsBranchTreeView, setOnBackFromBranchTree]);

  // Register scrollToMessage function for folder navigation
  useEffect(() => {
    setOnNavigateToMessage(() => scrollToMessage);
  }, [scrollToMessage, setOnNavigateToMessage]);

  // Strict project ID scoping: force reset when projectId changes
  useEffect(() => {
    console.log("[ChatArea] projectId change effect", {
      previousProjectId: currentProjectIdRef.current,
      nextProjectId: projectId,
      localMessagesCount: localMessages.length,
    });
    // Check if projectId actually changed
    if (currentProjectIdRef.current === projectId) return;
    
    const previousProjectId = currentProjectIdRef.current;
    currentProjectIdRef.current = projectId;
    
    // Force reset: immediately clear localMessages when projectId changes
    // This prevents rendering stale messages from previous project
    setLocalMessages([]);
    
    // If switching from one project to another, reset UI state and terminate streaming
    if (previousProjectId !== null && projectId !== previousProjectId) {
      // 1. Terminate streaming response immediately
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // 2. Clear streaming timeout
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
        streamingTimeoutRef.current = null;
      }
      
      setIsLoading(false);
      
      // 2. Reset UI state
      setSelectedAgent(DEFAULT_AGENT);
      setShowBranchTree(false);
      setShowFileCenter(false);
      setFolderBranchId(undefined);
      setFolderBranchName(undefined);
      setShowCreateBranchDialog(false);
      setShowMergeDialog(false);
      setBranchPointMessageId(null);
      setPendingAgent(null);
    }
    
    // For new projects (projectId is null)
    if (!projectId) {
      setIsLoading(false);
    }
  }, [projectId, setFolderBranchId, setFolderBranchName]);

  // Register handleSend function for global search
  useEffect(() => {
    handleSendRef.current = handleSend;
    if (projectId) {
      setOnSendToAgent((query: string) => {
        if (query?.trim() && handleSendRef.current) {
          handleSendRef.current(query);
        }
      });
    } else {
      setOnSendToAgent(undefined);
    }
  }, [projectId, setOnSendToAgent]);

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

  const handleSaveAsSkill = (messageId: string, content: string) => {
    setSaveSkillContent(content);
    setShowSaveSkillDialog(true);
  };

  const handleConfirmSaveSkill = (name: string, description: string) => {
    // TODO: Persist skill to database or skills store
    toast({
      title: "技能已保存",
      description: `"${name}" 已添加到 Skills Hub`,
    });
    setShowSaveSkillDialog(false);
    setSaveSkillContent("");
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
    if ((!input?.trim()) && (!files || files.length === 0)) {
      if (isLoading) return;
      return;
    }
    if (isLoading) return;
    if (!projectId) {
      toast({
        title: "请先选择或创建项目",
        description: "需要一个项目来保存对话",
        variant: "destructive",
      });
      return;
    }

    // 标记当前项目，避免 streaming 校验时因未初始化导致丢包
    currentProjectIdRef.current = projectId;

    // Ensure we have a branch
    let branchId = currentBranch?.id;
    if (!branchId) {
      const mainBranch = await ensureMainBranch();
      branchId = mainBranch?.id;
    }

    // Build message content with file references
    let messageContent = input?.trim() || "";
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
    // 立即进入 loading / thinking 状态，避免等待网络请求时无动效
    setIsLoading(true);
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Store current projectId to validate responses
    const requestProjectId = projectId;

    // Immediately create an empty assistant message to show "Thinking..."
    const assistantMessageId = generateId();
    setLocalMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant" as const,
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    // 设置超时保护：60秒后自动清理 streaming 状态
    streamingTimeoutRef.current = setTimeout(() => {
      console.warn("Streaming timeout - cleaning up");
      setLocalMessages((prev) => prev.filter(m => !m.isStreaming));
      setIsLoading(false);
      toast({
        title: "请求超时",
        description: "AI 响应超时，请重新发送消息",
        variant: "destructive",
      });
    }, 60000);

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

    let assistantContent = "";
    
    const upsertAssistant = (nextChunk: string) => {
      // Validate projectId hasn't changed during streaming
      if (currentProjectIdRef.current !== requestProjectId) {
        console.warn("Project changed during streaming, ignoring chunk");
        return;
      }
      
      assistantContent += nextChunk;
      setLocalMessages((prev) => {
        // Double-check projectId before updating
        if (currentProjectIdRef.current !== requestProjectId) {
          return prev;
        }
        
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.isStreaming) {
          return prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: assistantContent, isStreaming: true }
              : m
          );
        }
        return prev;
      });
    };

    try {
      const messagesToSend = [...localMessages, userMessage].map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

      // 本地模式：使用 streamChat（直接调用 OpenAI API 或模拟响应）
      if (isLocalMode()) {
        await new Promise<void>((resolve, reject) => {
          streamChat({
            messages: messagesToSend,
            agentId: selectedAgent.id,
            onChunk: (chunk) => {
              if (currentProjectIdRef.current !== requestProjectId) return;
              upsertAssistant(chunk);
            },
            onDone: () => {
              if (currentProjectIdRef.current !== requestProjectId) {
                console.warn("Project changed before saving message, aborting");
                return;
              }
              resolve();
            },
            onError: (error) => {
              reject(error);
            },
            signal: abortController.signal,
          });
        });
      } else {
        // 远程模式：调用 Supabase Edge Function
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
          signal: abortController.signal,
        });

        if (!resp.ok) {
          // Check if request was aborted
          if (abortController.signal.aborted || currentProjectIdRef.current !== requestProjectId) {
            return;
          }
          
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
          
          // 重置 streaming 状态 - 移除未完成的消息，避免僵尸消息
          setLocalMessages((prev) => prev.filter(m => !m.isStreaming));
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
            if (line.startsWith(":") || !line || !line.trim()) continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6)?.trim() || "";
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
        if (textBuffer?.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || !raw || !raw.trim()) continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6)?.trim() || "";
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

        // Validate projectId before saving
        if (currentProjectIdRef.current !== requestProjectId) {
          console.warn("Project changed before saving message, aborting");
          return;
        }
      }

      // Mark streaming as done and save to database
      setLocalMessages((prev) =>
        prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
      );

      // Save assistant message to database with branch info
      if (assistantContent && currentProjectIdRef.current === requestProjectId) {
        const { data: savedMessage } = await supabase.from("messages").insert({
          project_id: projectId,
          role: "assistant",
          content: assistantContent,
          agent_id: selectedAgent.id,
          branch_id: branchId,
        }).select().single();

        // Extract and save files from assistant response
        if (savedMessage && projectId) {
          const extractedFiles = extractFilesFromContent(assistantContent);
          for (const file of extractedFiles) {
            await supabase.from("file_assets").insert({
              project_id: projectId,
              branch_id: branchId,
              message_id: savedMessage.id,
              name: file.name,
              type: file.type,
              category: detectCategory(file.type, file.name),
              content: file.content,
              size: file.size,
            });
          }
          
          // Archive tables and images to smart folder
          if (savedMessage.id) {
            try {
              const parsed = parseMessageContent(assistantContent);
              archiveContent(parsed, savedMessage.id);
            } catch (error) {
              console.error("Failed to archive content:", error);
            }
          }
        }
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name === 'AbortError' || abortController.signal.aborted) {
        console.log("Request aborted due to project change");
        // 即使是 abort，也要清理 streaming 消息
        setLocalMessages((prev) => prev.filter(m => !m.isStreaming));
        return;
      }
      
      // Ignore errors if projectId changed
      if (currentProjectIdRef.current !== requestProjectId) {
        // 清理 streaming 消息
        setLocalMessages((prev) => prev.filter(m => !m.isStreaming));
        return;
      }
      
      console.error("Chat error:", error);
      
      // 移除未完成的 streaming 消息，避免僵尸消息
      setLocalMessages((prev) => prev.filter(m => !m.isStreaming));
      
      // 区分不同类型的错误
      let errorTitle = "发送失败";
      let errorDescription = "未知错误";
      
      if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        // 真正的网络错误（无法连接）
        errorTitle = "网络错误";
        errorDescription = "无法连接到服务器，请检查网络连接";
      } else if (error?.message?.includes('timeout')) {
        // 超时错误
        errorTitle = "请求超时";
        errorDescription = "服务器响应超时，请稍后重试";
      } else if (error?.message) {
        // 其他错误，显示具体信息
        errorDescription = error.message;
      } else {
        // 兜底错误
        errorDescription = "请稍后重试";
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      // 清除超时定时器
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
        streamingTimeoutRef.current = null;
      }
      
      // Only update loading state if still on same project
      if (currentProjectIdRef.current === requestProjectId) {
        setIsLoading(false);
      }
    }
  };

  // Get collaborator for a message
  const getCollaboratorForMessage = (collaboratorId?: string) => {
    if (!collaboratorId) return null;
    return allCollaborators.find((c) => c.id === collaboratorId) || null;
  };

  // Track edited message IDs
  const [editedMessageIds, setEditedMessageIds] = useState<Set<string>>(new Set());

  // Handle edit message - deletes subsequent messages and re-triggers agent
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!projectId || isLoading) return;
    
    // Find the message index
    const messageIndex = localMessages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    const originalMessage = localMessages[messageIndex];
    
    // Get all message IDs after this one (to delete)
    const messagesToDelete = localMessages.slice(messageIndex + 1).map(m => m.id);
    
    // Delete subsequent messages from database
    if (messagesToDelete.length > 0) {
      await supabase
        .from("messages")
        .delete()
        .in("id", messagesToDelete);
    }
    
    // Update the edited message in database
    await supabase
      .from("messages")
      .update({ content: newContent })
      .eq("id", messageId);
    
    // Update local state - remove subsequent messages and update this one
    const updatedMessages = localMessages.slice(0, messageIndex + 1);
    updatedMessages[messageIndex] = {
      ...originalMessage,
      content: newContent,
    };
    setLocalMessages(updatedMessages);
    
    // Track this message as edited
    setEditedMessageIds(prev => new Set(prev).add(messageId));
    
    // Now re-trigger the agent response
    setIsLoading(true);
    
    let branchId = currentBranch?.id;
    if (!branchId) {
      const mainBranch = await ensureMainBranch();
      branchId = mainBranch?.id;
    }
    
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
      const messagesToSend = updatedMessages.map((m) => ({
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
        toast({
          title: "重新发送失败",
          description: errorData.error || "请稍后重试",
          variant: "destructive",
        });
        
        // 重置 streaming 状态 - 移除未完成的消息
        setLocalMessages((prev) => prev.filter(m => !m.isStreaming));
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
          if (line.startsWith(":") || !line || !line.trim()) continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6)?.trim() || "";
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
      if (textBuffer?.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || !raw || !raw.trim()) continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6)?.trim() || "";
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
      setLocalMessages((prev) =>
        prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
      );

      // Save assistant message to database
      if (assistantContent) {
        const { data: savedMessage } = await supabase.from("messages").insert({
          project_id: projectId,
          role: "assistant",
          content: assistantContent,
          agent_id: selectedAgent.id,
          branch_id: branchId,
        }).select().single();

        // Extract and save files from assistant response
        if (savedMessage && projectId) {
          const extractedFiles = extractFilesFromContent(assistantContent);
          for (const file of extractedFiles) {
            await supabase.from("file_assets").insert({
              project_id: projectId,
              branch_id: branchId,
              message_id: savedMessage.id,
              name: file.name,
              type: file.type,
              category: detectCategory(file.type, file.name),
              content: file.content,
              size: file.size,
            });
          }
          
          // Archive tables and images to smart folder
          if (savedMessage.id) {
            try {
              const parsed = parseMessageContent(assistantContent);
              archiveContent(parsed, savedMessage.id);
            } catch (error) {
              console.error("Failed to archive content:", error);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Edit resend error:", error);
      
      // 移除未完成的 streaming 消息
      setLocalMessages((prev) => prev.filter(m => !m.isStreaming));
      
      // 区分不同类型的错误
      let errorDescription = "未知错误";
      
      if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        errorDescription = "无法连接到服务器，请检查网络连接";
      } else if (error?.message?.includes('timeout')) {
        errorDescription = "服务器响应超时，请稍后重试";
      } else if (error?.message) {
        errorDescription = error.message;
      } else {
        errorDescription = "请稍后重试";
      }
      
      toast({
        title: "重新发送失败",
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  // Handle file center navigation
  const handleNavigateToMessage = useCallback(
    (messageId: string, branchId: string) => {
      setShowFileCenter(false);
      switchBranch(branchId);
      // TODO: Implement message highlighting
    },
    [switchBranch]
  );

  const handleNavigateToBranch = useCallback(
    (branchId: string) => {
      setShowFileCenter(false);
      switchBranch(branchId);
    },
    [switchBranch]
  );

  // Show file center view
  if (showFileCenter) {
    return (
      <div className="h-full w-full flex flex-col bg-background overflow-hidden">
        <FileCenter
          assets={assets}
          branches={branches}
          isLoading={assetsLoading}
          projectName={projectName}
          onDeleteAsset={deleteAsset}
          onNavigateToMessage={handleNavigateToMessage}
          onNavigateToBranch={handleNavigateToBranch}
          onBack={() => {
            setShowFileCenter(false);
            if (fileCenterSource === "branch") {
              setShowBranchTree(true);
            }
          }}
          backText={fileCenterSource === "branch" ? "返回视图" : "返回会话"}
        />
      </div>
    );
  }

  // Handle opening folder from branch card
  const handleOpenFolder = useCallback((branchId: string, branchName: string) => {
    setFolderBranchId(branchId);
    setFolderBranchName(branchName);
    // The folder will be opened automatically in MainLayout when folderBranchId changes
  }, [setFolderBranchId, setFolderBranchName]);

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
          onOpenFolder={handleOpenFolder}
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
    <div className="flex-1 flex flex-col h-full w-full bg-[#fafafa] overflow-hidden relative">
      {/* Messages area - scrollable with padding for input */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 scrollbar-thin w-full pb-32 min-w-0">
        <div
          className="mx-auto space-y-6 w-full min-w-0"
          style={{ maxWidth: computedContentMaxWidth }}
        >
          {/* Show empty state only when messages.length === 0 and isLoading === false */}
          {projectId && !messagesLoading && localMessages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                新项目，开始您的第一次科研对话
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                向 AI 助手提问，开始探索您的科研问题
              </p>
            </div>
          ) : !projectId ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                请先选择或创建项目
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                创建一个新项目来开始对话
              </p>
            </div>
          ) : messagesLoading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">加载对话历史...</p>
            </div>
          ) : (
            <>
              {localMessages.map((message) =>
                message.role === "user" ? (
                  <UserMessage 
                    key={message.id} 
                    content={message.content}
                    attachments={message.attachments}
                    messageId={message.id}
                    onCreateBranch={handleCreateBranch}
                    collaborator={getCollaboratorForMessage(message.collaboratorId)}
                    isEdited={editedMessageIds.has(message.id || "")}
                    onEditMessage={handleEditMessage}
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
                    onSaveAsSkill={handleSaveAsSkill}
                  />
                )
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar - absolute at bottom of chat container */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-8 pb-6 pt-4 bg-[#fafafa]">
        <div
          className="mx-auto"
          style={{ maxWidth: computedContentMaxWidth }}
        >
          <ChatInput 
            onSend={handleSend} 
            isLoading={isLoading}
            selectedAgent={selectedAgent}
            onSelectAgent={handleAgentChange}
            externalContent={externalContent}
            onClearExternalContent={() => setExternalContent("")}
            agentSwitched={agentSwitched}
          />
        </div>
      </div>

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

      <SaveSkillDialog
        open={showSaveSkillDialog}
        onOpenChange={setShowSaveSkillDialog}
        onConfirm={handleConfirmSaveSkill}
        defaultContent={saveSkillContent}
      />
    </div>
  );
};

export default ChatArea;
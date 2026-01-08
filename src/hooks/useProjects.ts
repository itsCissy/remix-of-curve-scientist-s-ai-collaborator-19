import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Project {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  author: string;
  context_path: string | null;
  selected_agents: string[];
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  role: "user" | "assistant";
  content: string;
  agent_id: string | null;
  files: any | null;
  created_at: string;
  branch_id: string | null;
  collaborator_id: string | null;
}

export const useProjects = () => {
  // Debug-only: identify hook instances to detect multiple copies across layout/pages
  const instanceIdRef = useRef<string>(`useProjects#${Math.random().toString(36).slice(2, 7)}`);
  const getInstanceId = () => instanceIdRef.current;
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      
      // Map data to ensure arrays are never null
      const mappedData: Project[] = (data || []).map(p => ({
        ...p,
        selected_agents: p.selected_agents || [],
        tags: p.tags || [],
        is_active: p.is_active ?? false,
      }));
      
      setProjects(mappedData);
      
      // Set active project
      const active = mappedData.find(p => p.is_active);
      setActiveProject(active || mappedData[0] || null);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("加载项目失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new project
  const createProject = async (projectData: {
    name: string;
    icon: string;
    description?: string;
    author?: string;
    context_path?: string;
    selected_agents?: string[];
    tags?: string[];
    selected_skills?: string[];
    uploaded_files?: any[];
  }): Promise<Project | null> => {
    try {
      console.log("[useProjects] createProject invoked", getInstanceId(), projectData);
      // First, deactivate all other projects
      await supabase
        .from("projects")
        .update({ is_active: false })
        .eq("is_active", true);

      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: projectData.name,
          icon: projectData.icon,
          description: projectData.description || null,
          author: projectData.author || "程希希",
          context_path: projectData.context_path || null,
          selected_agents: projectData.selected_agents || ["xtalpi"],
          tags: projectData.tags || [],
          is_active: true,
          // Note: selected_skills and uploaded_files are stored in separate tables
          // They will be handled by the UI layer after project creation
        })
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [data, ...prev.map(p => ({ ...p, is_active: false }))]);
      setActiveProject(data);
      console.log("[useProjects] createProject success", getInstanceId(), data);
      
      // Decouple new project from old session: clear any cached conversation state
      try {
        // Clear localStorage/sessionStorage if any conversation ID is cached
        localStorage.removeItem("last_active_conversation_id");
        sessionStorage.removeItem("last_active_conversation_id");
        localStorage.removeItem("activeConversationId");
        sessionStorage.removeItem("activeConversationId");
      } catch (e) {
        // Ignore storage errors
      }
      
      toast.success(`项目 "${projectData.name}" 创建成功`);
      return data;
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("创建项目失败");
      return null;
    }
  };

  // Update a project
  const updateProject = async (id: string, updates: Partial<Project>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setProjects(prev => 
        prev.map(p => p.id === id ? { ...p, ...updates } : p)
      );
      
      if (activeProject?.id === id) {
        setActiveProject(prev => prev ? { ...prev, ...updates } : null);
      }
      
      return true;
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("更新项目失败");
      return false;
    }
  };

  // Delete a project
  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      
      if (activeProject?.id === id) {
        setActiveProject(projects.find(p => p.id !== id) || null);
      }
      
      toast.success("项目已删除");
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("删除项目失败");
      return false;
    }
  };

  // Set active project
  const setActive = async (id: string): Promise<boolean> => {
    try {
      console.log("[useProjects] setActive invoked", getInstanceId(), id);
      // Deactivate all
      await supabase
        .from("projects")
        .update({ is_active: false })
        .eq("is_active", true);

      // Activate selected
      const { error } = await supabase
        .from("projects")
        .update({ is_active: true })
        .eq("id", id);

      if (error) throw error;

      setProjects(prev => 
        prev.map(p => ({ ...p, is_active: p.id === id }))
      );
      
      const project = projects.find(p => p.id === id);
      if (project) {
        setActiveProject({ ...project, is_active: true });
      }
      
      // Clear cached conversation state when switching projects
      localStorage.removeItem("last_active_conversation_id");
      sessionStorage.removeItem("last_active_conversation_id");
      localStorage.removeItem("activeConversationId");
      sessionStorage.removeItem("activeConversationId");
      
      console.log("[useProjects] setActive success", getInstanceId(), id);
      return true;
    } catch (error) {
      console.error("Error setting active project:", error);
      return false;
    }
  };

  // Initial fetch
  useEffect(() => {
    console.log("[useProjects] mounted", getInstanceId());
    fetchProjects();
  }, [fetchProjects]);

  // Realtime subscription for projects
  useEffect(() => {
    const channel = supabase
      .channel("projects-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => {
          console.log("[useProjects] realtime event", getInstanceId());
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      console.log("[useProjects] unmounted", getInstanceId());
    };
  }, [fetchProjects]);

  return {
    projects,
    isLoading,
    activeProject,
    createProject,
    updateProject,
    deleteProject,
    setActive,
    refetch: fetchProjects,
  };
};

export const useMessages = (projectId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch messages for a project - strict project ID filtering
  const fetchMessages = useCallback(async () => {
    if (!projectId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    const currentProjectId = projectId; // Capture projectId for validation
    
    try {
      // Explicitly bind projectId in API request
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("project_id", currentProjectId) // API parameter binding
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Frontend secondary interception: force filter by projectId
      // Frontend secondary interception: force filter by projectId
      // Ensure messages not belonging to current project never enter state
      const projectMessages = (data || []).filter((m: any) => {
        // Strict validation: reject messages that don't match current projectId
        if (m.project_id !== currentProjectId) {
          console.warn(`Rejecting message ${m.id} - project_id mismatch: ${m.project_id} !== ${currentProjectId}`);
          return false;
        }
        return true;
      });
      
      // Double-check: ensure all messages belong to current project
      const validMessages = projectMessages.filter((m: any) => m.project_id === currentProjectId);
      
      // Only update if projectId hasn't changed during fetch
      if (currentProjectId === projectId) {
        setMessages(validMessages as Message[]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Only clear messages if still on same project
      if (currentProjectId === projectId) {
        setMessages([]);
      }
    } finally {
      // Only update loading state if still on same project
      if (currentProjectId === projectId) {
        setIsLoading(false);
      }
    }
  }, [projectId]);

  // Add a new message
  const addMessage = async (message: {
    role: "user" | "assistant";
    content: string;
    agent_id?: string;
    files?: any;
  }): Promise<Message | null> => {
    if (!projectId) return null;

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          project_id: projectId,
          role: message.role,
          content: message.content,
          agent_id: message.agent_id || null,
          files: message.files || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      const typedData = data as Message;
      
      // Validate project_id before adding to state
      if (typedData.project_id !== projectId) {
        console.warn(`Rejecting addMessage - project_id mismatch: ${typedData.project_id} !== ${projectId}`);
        return null;
      }
      
      setMessages(prev => [...prev, typedData]);
      return typedData;
    } catch (error) {
      console.error("Error adding message:", error);
      return null;
    }
  };

  // Clear all messages for current project
  const clearMessages = async (): Promise<boolean> => {
    if (!projectId) return false;

    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("project_id", projectId);

      if (error) throw error;
      
      setMessages([]);
      toast.success("会话已清空");
      return true;
    } catch (error) {
      console.error("Error clearing messages:", error);
      toast.error("清空会话失败");
      return false;
    }
  };

  // Force reset messages when projectId changes - strict project ID scoping
  useEffect(() => {
    // Immediately clear messages when projectId changes to prevent stale data
    setMessages([]);
    setIsLoading(false);
    
    // Clear conversation IDs from storage when project changes
    localStorage.removeItem("last_active_conversation_id");
    sessionStorage.removeItem("last_active_conversation_id");
    localStorage.removeItem("activeConversationId");
    sessionStorage.removeItem("activeConversationId");
    
    // Then fetch messages for the new project
    if (projectId) {
      fetchMessages();
    }
  }, [projectId, fetchMessages]);

  // Set up realtime subscription for all events (INSERT, UPDATE, DELETE)
  useEffect(() => {
    if (!projectId) {
      setMessages([]);
      return;
    }

    const channel = supabase
      .channel(`messages-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          // Strict client-side validation: only process messages for current projectId
          if (payload.eventType === "INSERT") {
            const newMessage = payload.new as Message;
            // API payload guard: validate project_id matches current projectId
            if (newMessage.project_id !== projectId) {
              console.warn(`Rejecting realtime INSERT - project_id mismatch: ${newMessage.project_id} !== ${projectId}`);
              return;
            }
            setMessages(prev => {
              // Additional check: ensure message belongs to current project
              if (newMessage.project_id !== projectId) return prev;
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setMessages(prev => prev.filter(m => m.id !== deletedId));
          } else if (payload.eventType === "UPDATE") {
            const updatedMessage = payload.new as Message;
            // API payload guard: validate project_id matches current projectId
            if (updatedMessage.project_id !== projectId) {
              console.warn(`Rejecting realtime UPDATE - project_id mismatch: ${updatedMessage.project_id} !== ${projectId}`);
              return;
            }
            setMessages(prev => prev.map(m => {
              // Additional validation: only update if project_id matches
              if (m.id === updatedMessage.id && updatedMessage.project_id === projectId) {
                return updatedMessage;
              }
              return m;
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    messages,
    isLoading,
    addMessage,
    clearMessages,
    refetch: fetchMessages,
  };
};

import { useState, useEffect, useCallback } from "react";
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
  }): Promise<Project | null> => {
    try {
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
        })
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [data, ...prev.map(p => ({ ...p, is_active: false }))]);
      setActiveProject(data);
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
      
      return true;
    } catch (error) {
      console.error("Error setting active project:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchProjects();
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

  // Fetch messages for a project
  const fetchMessages = useCallback(async () => {
    if (!projectId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Type assertion since we know the structure
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
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

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Set up realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`messages-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
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

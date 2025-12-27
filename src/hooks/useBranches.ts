import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Branch {
  id: string;
  project_id: string;
  parent_branch_id: string | null;
  branch_point_message_id: string | null;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  is_main: boolean;
}

export interface Collaborator {
  id: string;
  project_id: string;
  name: string;
  avatar_color: string;
  browser_id: string;
  created_at: string;
}

// Generate or retrieve browser ID for temporary user identification
const getBrowserId = (): string => {
  let browserId = localStorage.getItem("curve_browser_id");
  if (!browserId) {
    browserId = `browser_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("curve_browser_id", browserId);
  }
  return browserId;
};

// Generate a random color for the collaborator avatar
const getRandomColor = (): string => {
  const colors = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const useBranches = (projectId: string | null) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBranches = useCallback(async () => {
    if (!projectId) {
      setBranches([]);
      setCurrentBranch(null);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const typedData = (data || []) as Branch[];
      setBranches(typedData);

      // Set current branch to main or first branch
      const main = typedData.find((b) => b.is_main);
      setCurrentBranch(main || typedData[0] || null);
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Create main branch if it doesn't exist
  const ensureMainBranch = async (): Promise<Branch | null> => {
    if (!projectId) return null;

    // First check local state
    const localExisting = branches.find((b) => b.is_main);
    if (localExisting) return localExisting;

    try {
      // Always check database first to avoid race conditions
      // (limit(1) ensures this won't error even if old data had duplicate main branches)
      const { data: dbExisting, error: fetchError } = await supabase
        .from("branches")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_main", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (dbExisting) {
        const typedData = dbExisting as Branch;
        setBranches((prev) => {
          if (prev.find((b) => b.id === typedData.id)) return prev;
          return [...prev, typedData];
        });
        setCurrentBranch(typedData);
        return typedData;
      }

      // Only create if no main branch exists in database
      const { data, error } = await supabase
        .from("branches")
        .insert({
          project_id: projectId,
          name: "主线",
          is_main: true,
        })
        .select()
        .single();

      if (error) throw error;

      const typedData = data as Branch;
      setBranches((prev) => [...prev, typedData]);
      setCurrentBranch(typedData);
      return typedData;
    } catch (error: any) {
      // If two callers race, the DB unique index may reject the second insert.
      // In that case, re-fetch and return the existing main branch.
      if (error?.code === "23505") {
        const { data: existing } = await supabase
          .from("branches")
          .select("*")
          .eq("project_id", projectId)
          .eq("is_main", true)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (existing) {
          const typed = existing as Branch;
          setBranches((prev) => {
            if (prev.find((b) => b.id === typed.id)) return prev;
            return [...prev, typed];
          });
          setCurrentBranch(typed);
          return typed;
        }
      }

      console.error("Error creating main branch:", error);
      return null;
    }
  };

  // Create a new branch from a specific message
  const createBranch = async (
    messageId: string,
    name: string,
    description?: string,
    collaboratorId?: string
  ): Promise<Branch | null> => {
    if (!projectId || !currentBranch) return null;

    try {
      const { data, error } = await supabase
        .from("branches")
        .insert({
          project_id: projectId,
          parent_branch_id: currentBranch.id,
          branch_point_message_id: messageId,
          name,
          description: description || null,
          created_by: collaboratorId || null,
          is_main: false,
        })
        .select()
        .single();

      if (error) throw error;

      const typedData = data as Branch;
      setBranches((prev) => [...prev, typedData]);
      toast.success(`分支 "${name}" 创建成功`);
      return typedData;
    } catch (error) {
      console.error("Error creating branch:", error);
      toast.error("创建分支失败");
      return null;
    }
  };

  // Switch to a different branch
  const switchBranch = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
    }
  };

  // Merge a branch into the main branch
  const mergeBranch = async (
    sourceBranchId: string,
    mergeType: "messages" | "summary",
    summary?: string
  ): Promise<boolean> => {
    if (!projectId) return false;

    const sourceBranch = branches.find((b) => b.id === sourceBranchId);
    const mainBranch = branches.find((b) => b.is_main);

    if (!sourceBranch || !mainBranch) {
      toast.error("无法找到源分支或主线分支");
      return false;
    }

    if (sourceBranch.is_main) {
      toast.error("无法合并主线分支");
      return false;
    }

    try {
      if (mergeType === "messages") {
        // Copy all messages from source branch to main branch
        const { data: messages, error: fetchError } = await supabase
          .from("messages")
          .select("*")
          .eq("branch_id", sourceBranchId)
          .order("created_at", { ascending: true });

        if (fetchError) throw fetchError;

        if (messages && messages.length > 0) {
          const messagesToInsert = messages.map((m) => ({
            project_id: m.project_id,
            role: m.role,
            content: m.content,
            agent_id: m.agent_id,
            files: m.files,
            branch_id: mainBranch.id,
            collaborator_id: m.collaborator_id,
          }));

          const { error: insertError } = await supabase
            .from("messages")
            .insert(messagesToInsert);

          if (insertError) throw insertError;
        }
      } else if (mergeType === "summary" && summary) {
        // Add a summary message to the main branch
        const summaryContent = `**[从分支 "${sourceBranch.name}" 合并的结论]**\n\n${summary}`;
        
        const { error: insertError } = await supabase
          .from("messages")
          .insert({
            project_id: projectId,
            role: "assistant",
            content: summaryContent,
            branch_id: mainBranch.id,
          });

        if (insertError) throw insertError;
      }

      toast.success(`分支 "${sourceBranch.name}" 已合并到主线`);
      return true;
    } catch (error) {
      console.error("Error merging branch:", error);
      toast.error("合并分支失败");
      return false;
    }
  };

  // Delete a branch (cannot delete main branch)
  const deleteBranch = async (branchId: string): Promise<boolean> => {
    const branch = branches.find((b) => b.id === branchId);
    if (!branch || branch.is_main) {
      toast.error("无法删除主线分支");
      return false;
    }

    try {
      const { error } = await supabase
        .from("branches")
        .delete()
        .eq("id", branchId);

      if (error) throw error;

      setBranches((prev) => prev.filter((b) => b.id !== branchId));
      
      if (currentBranch?.id === branchId) {
        const main = branches.find((b) => b.is_main);
        setCurrentBranch(main || null);
      }
      
      toast.success("分支已删除");
      return true;
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast.error("删除分支失败");
      return false;
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`branches-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "branches",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchBranches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchBranches]);

  return {
    branches,
    currentBranch,
    isLoading,
    ensureMainBranch,
    createBranch,
    switchBranch,
    mergeBranch,
    deleteBranch,
    refetch: fetchBranches,
  };
};

export const useCollaborator = (projectId: string | null) => {
  const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
  const [allCollaborators, setAllCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const browserId = getBrowserId();

  const fetchCollaborators = useCallback(async () => {
    if (!projectId) {
      setAllCollaborators([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("collaborators")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      setAllCollaborators((data || []) as Collaborator[]);
    } catch (error) {
      console.error("Error fetching collaborators:", error);
    }
  }, [projectId]);

  const ensureCollaborator = useCallback(async (): Promise<Collaborator | null> => {
    if (!projectId) return null;

    setIsLoading(true);
    try {
      // Check if collaborator already exists for this browser
      const { data: existing, error: fetchError } = await supabase
        .from("collaborators")
        .select("*")
        .eq("project_id", projectId)
        .eq("browser_id", browserId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        const typedData = existing as Collaborator;
        setCollaborator(typedData);
        return typedData;
      }

      // Don't auto-create new collaborators - return null if not found
      // Users need to be invited first
      return null;
    } catch (error) {
      console.error("Error ensuring collaborator:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [projectId, browserId]);

  const updateCollaboratorName = async (name: string): Promise<boolean> => {
    if (!collaborator) return false;

    try {
      const { error } = await supabase
        .from("collaborators")
        .update({ name })
        .eq("id", collaborator.id);

      if (error) throw error;

      setCollaborator((prev) => (prev ? { ...prev, name } : null));
      setAllCollaborators((prev) =>
        prev.map((c) => (c.id === collaborator.id ? { ...c, name } : c))
      );
      return true;
    } catch (error) {
      console.error("Error updating collaborator name:", error);
      return false;
    }
  };

  useEffect(() => {
    if (projectId) {
      ensureCollaborator();
      fetchCollaborators();
    }
  }, [projectId, ensureCollaborator, fetchCollaborators]);

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`collaborators-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "collaborators",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchCollaborators();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchCollaborators]);

  return {
    collaborator,
    allCollaborators,
    isLoading,
    ensureCollaborator,
    updateCollaboratorName,
    refetch: fetchCollaborators,
  };
};

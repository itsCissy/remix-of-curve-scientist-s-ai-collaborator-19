import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FileAsset {
  id: string;
  project_id: string;
  branch_id: string | null;
  message_id: string | null;
  name: string;
  type: string;
  category: string;
  content: string | null;
  size: string | null;
  url: string | null;
  created_at: string;
  // Joined fields
  branch_name?: string;
  message_content?: string;
}

export function useFileAssets(projectId: string | null) {
  const [assets, setAssets] = useState<FileAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAssets = useCallback(async () => {
    if (!projectId) {
      setAssets([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("file_assets")
        .select(`
          *,
          branches:branch_id (name),
          messages:message_id (content)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const processedAssets = (data || []).map((asset: any) => ({
        ...asset,
        branch_name: asset.branches?.name || "未知分支",
        message_content: asset.messages?.content || null,
      }));

      setAssets(processedAssets);
    } catch (error) {
      console.error("Error fetching file assets:", error);
      toast.error("加载文件资产失败");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const createAsset = useCallback(async (asset: Omit<FileAsset, "id" | "created_at" | "branch_name" | "message_content">) => {
    try {
      const { data, error } = await supabase
        .from("file_assets")
        .insert({
          project_id: asset.project_id,
          branch_id: asset.branch_id,
          message_id: asset.message_id,
          name: asset.name,
          type: asset.type,
          category: asset.category,
          content: asset.content,
          size: asset.size,
          url: asset.url,
        })
        .select()
        .single();

      if (error) throw error;
      
      setUnreadCount(prev => prev + 1);
      return data;
    } catch (error) {
      console.error("Error creating file asset:", error);
      return null;
    }
  }, []);

  const deleteAsset = useCallback(async (assetId: string) => {
    try {
      const { error } = await supabase
        .from("file_assets")
        .delete()
        .eq("id", assetId);

      if (error) throw error;

      setAssets(prev => prev.filter(a => a.id !== assetId));
      toast.success("文件已删除");
      return true;
    } catch (error) {
      console.error("Error deleting file asset:", error);
      toast.error("删除文件失败");
      return false;
    }
  }, []);

  const deleteAssetsByBranch = useCallback(async (branchId: string) => {
    try {
      const { error } = await supabase
        .from("file_assets")
        .delete()
        .eq("branch_id", branchId);

      if (error) throw error;

      setAssets(prev => prev.filter(a => a.branch_id !== branchId));
      return true;
    } catch (error) {
      console.error("Error deleting file assets by branch:", error);
      return false;
    }
  }, []);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Real-time subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`file_assets_${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "file_assets",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            fetchAssets();
            setUnreadCount(prev => prev + 1);
          } else if (payload.eventType === "DELETE") {
            setAssets(prev => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchAssets]);

  return {
    assets,
    isLoading,
    unreadCount,
    createAsset,
    deleteAsset,
    deleteAssetsByBranch,
    resetUnreadCount,
    refetch: fetchAssets,
  };
}

// File extraction utilities
export function detectCategory(type: string, name: string): string {
  const lowerName = name.toLowerCase();
  
  // Molecular structures
  if (["pdb", "mol", "sdf", "mol2", "xyz"].includes(type) || 
      lowerName.includes("molecule") || lowerName.includes("structure")) {
    return "structures";
  }
  
  // Reports
  if (["pdf", "md", "html", "doc", "docx"].includes(type) ||
      lowerName.includes("report") || lowerName.includes("analysis")) {
    return "reports";
  }
  
  // Default to data
  return "data";
}

export function extractFilesFromContent(content: string): Array<{
  name: string;
  type: string;
  content: string;
  size: string;
}> {
  const files: Array<{
    name: string;
    type: string;
    content: string;
    size: string;
  }> = [];

  // Extract explicitly tagged files
  const fileTagRegex = /<file\s+name="([^"]+)"(?:\s+size="([^"]+)")?(?:\s+url="([^"]+)")?>([^<]*)<\/file>/g;
  let match;
  while ((match = fileTagRegex.exec(content)) !== null) {
    const [, name, size, , fileContent] = match;
    const ext = name.split(".").pop()?.toLowerCase() || "unknown";
    files.push({
      name,
      type: ext,
      content: fileContent?.trim() || "",
      size: size || calculateSize(fileContent || ""),
    });
  }

  // Extract code blocks that look like data files
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let codeMatch;
  let csvIndex = 1;
  let jsonIndex = 1;
  
  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    const [, lang, blockContent] = codeMatch;
    const trimmedContent = blockContent.trim();
    
    // Detect CSV content
    if (lang === "csv" || (trimmedContent.includes(",") && trimmedContent.split("\n").length > 2)) {
      const lines = trimmedContent.split("\n");
      const firstLine = lines[0];
      // Check if looks like CSV header
      if (firstLine.includes(",") && !firstLine.includes("{")) {
        files.push({
          name: `data_${csvIndex++}.csv`,
          type: "csv",
          content: trimmedContent,
          size: calculateSize(trimmedContent),
        });
      }
    }
    
    // Detect JSON content
    if (lang === "json" || (trimmedContent.startsWith("{") || trimmedContent.startsWith("["))) {
      try {
        JSON.parse(trimmedContent);
        files.push({
          name: `data_${jsonIndex++}.json`,
          type: "json",
          content: trimmedContent,
          size: calculateSize(trimmedContent),
        });
      } catch {
        // Not valid JSON, skip
      }
    }
    
    // Detect PDB content
    if (lang === "pdb" || trimmedContent.includes("ATOM") && trimmedContent.includes("HETATM")) {
      files.push({
        name: `structure_${files.length + 1}.pdb`,
        type: "pdb",
        content: trimmedContent,
        size: calculateSize(trimmedContent),
      });
    }
  }

  return files;
}

function calculateSize(content: string): string {
  const bytes = new Blob([content]).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

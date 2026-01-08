import { useState, useEffect, useCallback, useRef } from "react";
import { ArchivedTable, ArchivedImage } from "@/components/curve/SmartFolderPanel";
import { ParsedContent, parseMessageContent } from "@/lib/messageUtils";
import { supabase } from "@/integrations/supabase/client";

interface UseSmartFolderOptions {
  projectId: string | null;
  branchId?: string | null;
  onNewContent?: () => void;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at?: string;
}

export const useSmartFolder = ({ projectId, branchId, onNewContent }: UseSmartFolderOptions) => {
  const [tables, setTables] = useState<ArchivedTable[]>([]);
  const [images, setImages] = useState<ArchivedImage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const hasScannedRef = useRef<Set<string>>(new Set()); // Track scanned project+branch combinations

  // Extract tables from parsed content
  const extractTables = useCallback((content: ParsedContent, messageId: string): ArchivedTable[] => {
    const extracted: ArchivedTable[] = [];
    
    // Check for molecule data (tables)
    if (content.moleculeData?.molecules && content.moleculeData.molecules.length > 0) {
      const molecules = content.moleculeData.molecules;
      const headers = Object.keys(molecules[0]);
      
      // Convert to CSV
      const csvContent = [
        headers.join(","),
        ...molecules.map((m) => headers.map((h) => m[h] || "").join(",")),
      ].join("\n");
      
      extracted.push({
        id: `table_${messageId}_${Date.now()}`,
        title: content.moleculeData.description || "分子数据对比表",
        content: csvContent,
        timestamp: new Date(),
        messageId,
      });
    }
    
    const normalContent = content.normalContent || "";
    let tableIndex = 0;
    
    // 1. Check for HTML table tags
    const htmlTableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let match;
    while ((match = htmlTableRegex.exec(normalContent)) !== null) {
      const tableHtml = match[0];
      // Convert HTML table to markdown-like format for storage
      const tableText = tableHtml
        .replace(/<thead[^>]*>/gi, '')
        .replace(/<\/thead>/gi, '')
        .replace(/<tbody[^>]*>/gi, '')
        .replace(/<\/tbody>/gi, '')
        .replace(/<tr[^>]*>/gi, '|')
        .replace(/<\/tr>/gi, '|\n')
        .replace(/<th[^>]*>/gi, '')
        .replace(/<\/th>/gi, '|')
        .replace(/<td[^>]*>/gi, '')
        .replace(/<\/td>/gi, '|')
        .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
        .replace(/\|\|/g, '|') // Clean up double pipes
        .trim();
      
      if (tableText.length > 10) { // Only add if has meaningful content
        extracted.push({
          id: `table_${messageId}_html_${tableIndex++}_${Date.now()}`,
          title: `对比表格 ${tableIndex}`,
          content: tableText,
          timestamp: new Date(),
          messageId,
        });
      }
    }
    
    // 2. Check for markdown tables (enhanced regex to handle SMILES highlights and custom IDs)
    // Support tables with: |---|---| format, with optional leading/trailing spaces
    // Also handle tables with inline code/links/SMILES highlights
    const markdownTableRegex = /(?:\n|^)\s*\|[^\n]*\|(?:\s*\n\s*\|[-\s|:]+\|)?(?:\s*\n\s*\|[^\n]*\|)+/g;
    while ((match = markdownTableRegex.exec(normalContent)) !== null) {
      const tableContent = match[0].trim();
      // Skip if already captured as HTML table or if too short
      if (tableContent.length < 20) continue;
      
      // Clean up the table content (remove SMILES highlight tags, keep structure)
      const cleanedContent = tableContent
        .replace(/<smiles[^>]*>([^<]+)<\/smiles>/gi, '$1') // Remove SMILES tags but keep content
        .replace(/`([^`]+)`/g, '$1') // Remove backticks
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // Remove markdown links, keep text
      
      extracted.push({
        id: `table_${messageId}_md_${tableIndex++}_${Date.now()}`,
        title: `对比表格 ${tableIndex}`,
        content: cleanedContent,
        timestamp: new Date(),
        messageId,
      });
    }
    
    // 3. Check for CSV-like content in code blocks or plain text
    const csvLikeRegex = /(?:^|\n)([A-Za-z_][A-Za-z0-9_,\s]+\n(?:[A-Za-z0-9_,\s\.-]+\n)+)/;
    const csvMatch = normalContent.match(csvLikeRegex);
    if (csvMatch && !extracted.some(t => t.content.includes(csvMatch[1].split('\n')[0]))) {
      const firstLine = csvMatch[1].split('\n')[0].toLowerCase();
      // Check if it looks like molecule data
      if (firstLine.includes('smiles') || firstLine.includes('similarity') || firstLine.includes('mw')) {
        extracted.push({
          id: `table_${messageId}_csv_${tableIndex++}_${Date.now()}`,
          title: "分子数据对比表",
          content: csvMatch[1].trim(),
          timestamp: new Date(),
          messageId,
        });
      }
    }
    
    return extracted;
  }, []);

  // Validate SMILES string
  const isValidSmiles = (smiles: string): boolean => {
    if (!smiles || typeof smiles !== 'string') return false;
    const trimmed = smiles.trim();
    if (trimmed.length < 1 || trimmed.length > 1000) return false;
    // Basic SMILES validation: should contain organic atoms (C, N, O, S, P, F, Cl, Br, I)
    const hasOrganicAtoms = /[CNOSPF]|Cl|Br/.test(trimmed);
    return hasOrganicAtoms;
  };

  // Extract images from parsed content
  const extractImages = useCallback((content: ParsedContent, messageId: string): ArchivedImage[] => {
    const extracted: ArchivedImage[] = [];
    
    // Get normalContent once at the start
    const normalContent = content.normalContent || "";
    
    // Check for image URLs in content
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    let imageIndex = 0;
    
    while ((match = imageRegex.exec(normalContent)) !== null) {
      const [, alt, url] = match;
      
      // Determine image type
      let type: "structure" | "chart" | "other" = "other";
      if (alt?.toLowerCase().includes("structure") || alt?.toLowerCase().includes("分子") || alt?.toLowerCase().includes("结构")) {
        type = "structure";
      } else if (alt?.toLowerCase().includes("chart") || alt?.toLowerCase().includes("图表") || alt?.toLowerCase().includes("对比")) {
        type = "chart";
      }
      
      extracted.push({
        id: `image_${messageId}_${imageIndex++}_${Date.now()}`,
        title: alt || `图片 ${imageIndex}`,
        url,
        type,
        timestamp: new Date(),
        messageId,
      });
    }
    
    // Check for base64 images
    const base64Regex = /data:image\/([^;]+);base64,([^"'\s]+)/g;
    while ((match = base64Regex.exec(normalContent)) !== null) {
      const [, format, data] = match;
      extracted.push({
        id: `image_${messageId}_${imageIndex++}_${Date.now()}`,
        title: `结构图 ${imageIndex}`,
        url: `data:image/${format};base64,${data}`,
        type: "structure",
        timestamp: new Date(),
        messageId,
      });
    }
    
    // Extract SMILES from molecule data and generate structure previews
    if (content.moleculeData?.molecules && content.moleculeData.molecules.length > 0) {
      const molecules = content.moleculeData.molecules;
      const seenSmiles = new Set<string>();
      
      for (const molecule of molecules) {
        const smiles = molecule.smiles;
        if (smiles && isValidSmiles(smiles) && !seenSmiles.has(smiles.trim())) {
          seenSmiles.add(smiles.trim());
          const encodedSmiles = encodeURIComponent(smiles.trim());
          const structureUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/PNG?image_size=300x300`;
          
          extracted.push({
            id: `image_${messageId}_smiles_${imageIndex++}_${Date.now()}`,
            title: molecule.id || `分子结构 ${imageIndex}`,
            url: structureUrl,
            type: "structure",
            timestamp: new Date(),
            messageId,
          });
        }
      }
    }
    
    // Extract SMILES from table content (markdown tables, CSV, etc.)
    // Look for SMILES patterns in table-like structures
    const smilesInTablesRegex = /(?:smiles|SMILES)[\s|:]*([CNOSPF()=\[\]]+[CNOSPF()=\[\].\d]*)/gi;
    const smilesMatches = new Set<string>();
    let smilesMatch;
    
    while ((smilesMatch = smilesInTablesRegex.exec(normalContent)) !== null) {
      const potentialSmiles = smilesMatch[1]?.trim();
      if (potentialSmiles && isValidSmiles(potentialSmiles) && !smilesMatches.has(potentialSmiles)) {
        smilesMatches.add(potentialSmiles);
        const encodedSmiles = encodeURIComponent(potentialSmiles);
        const structureUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/PNG?image_size=300x300`;
        
        extracted.push({
          id: `image_${messageId}_table_smiles_${imageIndex++}_${Date.now()}`,
          title: `分子结构: ${potentialSmiles.slice(0, 20)}`,
          url: structureUrl,
          type: "structure",
          timestamp: new Date(),
          messageId,
        });
      }
    }
    
    // Extract chart data (ECharts/Recharts JSON configurations)
    // Use a safer approach: look for chart-related keywords and try to parse JSON blocks
    try {
      // Method 1: Look for JSON code blocks that might contain chart configs
      const codeBlockRegex = /```(?:json|javascript|typescript)?\s*\n([\s\S]*?)\n```/g;
      let codeBlockMatch;
      while ((codeBlockMatch = codeBlockRegex.exec(normalContent)) !== null) {
        try {
          const codeContent = codeBlockMatch[1].trim();
          // Try to parse as JSON
          const chartConfig = JSON.parse(codeContent);
          // Check if it looks like a chart config
          if (chartConfig && typeof chartConfig === 'object' && 
              (chartConfig.type === 'bar' || chartConfig.type === 'line' || 
               chartConfig.type === 'pie' || chartConfig.type === 'scatter' ||
               chartConfig.type === 'area' || chartConfig.series || chartConfig.data)) {
            const chartDataStr = JSON.stringify(chartConfig);
            const chartDataUrl = `data:application/json;base64,${btoa(chartDataStr)}`;
            
            extracted.push({
              id: `image_${messageId}_chart_${imageIndex++}_${Date.now()}`,
              title: `图表: ${chartConfig.type || "数据图表"}`,
              url: chartDataUrl,
              type: "chart",
              timestamp: new Date(),
              messageId,
            });
          }
        } catch (e) {
          // Skip invalid JSON, continue to next code block
          continue;
        }
      }
      
      // Method 2: Look for inline JSON objects (more careful parsing)
      // Find potential JSON objects by looking for balanced braces
      const findJsonObjects = (text: string): string[] => {
        const results: string[] = [];
        let depth = 0;
        let start = -1;
        
        for (let i = 0; i < text.length; i++) {
          if (text[i] === '{') {
            if (depth === 0) start = i;
            depth++;
          } else if (text[i] === '}') {
            depth--;
            if (depth === 0 && start !== -1) {
              const candidate = text.slice(start, i + 1);
              // Check if it contains chart-related keywords
              if (candidate.includes('"type"') && 
                  (candidate.includes('"bar"') || candidate.includes('"line"') || 
                   candidate.includes('"pie"') || candidate.includes('series') ||
                   candidate.includes('data'))) {
                results.push(candidate);
              }
            }
          }
        }
        return results;
      };
      
      const jsonCandidates = findJsonObjects(normalContent);
      for (const candidate of jsonCandidates) {
        try {
          const chartConfig = JSON.parse(candidate);
          if (chartConfig && typeof chartConfig === 'object') {
            const chartDataStr = JSON.stringify(chartConfig);
            const chartDataUrl = `data:application/json;base64,${btoa(chartDataStr)}`;
            
            extracted.push({
              id: `image_${messageId}_chart_inline_${imageIndex++}_${Date.now()}`,
              title: `图表: ${chartConfig.type || "数据图表"}`,
              url: chartDataUrl,
              type: "chart",
              timestamp: new Date(),
              messageId,
            });
          }
        } catch (e) {
          // Skip invalid JSON
          continue;
        }
      }
    } catch (e) {
      // If extraction fails, continue without chart extraction
      console.warn("Chart extraction error:", e);
    }
    
    return extracted;
  }, []);

  // Archive content from a message
  const archiveContent = useCallback((content: ParsedContent, messageId: string) => {
    // Only archive if branchId matches (or if no branchId is set, archive to current branch)
    const newTables = extractTables(content, messageId);
    const newImages = extractImages(content, messageId);
    
    if (newTables.length > 0 || newImages.length > 0) {
      setTables((prev) => [...prev, ...newTables]);
      setImages((prev) => [...prev, ...newImages]);
      setUnreadCount((prev) => prev + newTables.length + newImages.length);
      onNewContent?.();
    }
  }, [extractTables, extractImages, onNewContent]);

  // Reset unread count
  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Download table as CSV
  const downloadTable = useCallback((table: ArchivedTable) => {
    const blob = new Blob([table.content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${table.title || "table"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // Download image as PNG
  const downloadImage = useCallback((image: ArchivedImage) => {
    const link = document.createElement("a");
    link.href = image.url;
    link.download = `${image.title || "image"}.png`;
    link.click();
  }, []);

  // Sync history messages to folder (scan all historical messages)
  const syncHistoryToFolder = useCallback(async () => {
    if (!projectId) return;
    
    // Create unique key for project+branch combination
    const scanKey = branchId ? `${projectId}_${branchId}` : `${projectId}_main`;
    if (hasScannedRef.current.has(scanKey)) {
      return; // Already scanned this project+branch combination
    }

    setIsScanning(true);
    try {
      // Build query with branch filter
      let query = supabase
        .from("messages")
        .select("id, content, role, created_at, branch_id")
        .eq("project_id", projectId)
        .eq("role", "assistant");
      
      // Filter by branchId if provided
      if (branchId) {
        query = query.eq("branch_id", branchId);
      } else {
        // If no branchId, get messages from main branch or messages without branch_id
        query = query.or("branch_id.is.null,branch_id.eq.main");
      }
      
      const { data: messages, error } = await query.order("created_at", { ascending: true });

      if (error) throw error;

      if (!messages || messages.length === 0) {
        hasScannedRef.current.add(projectId);
        setIsScanning(false);
        return;
      }

      // Process each message
      const allTables: ArchivedTable[] = [];
      const allImages: ArchivedImage[] = [];
      const seenIds = new Set<string>(); // Prevent duplicates

      for (const message of messages as Message[]) {
        try {
          const parsed = parseMessageContent(message.content);
          const extractedTables = extractTables(parsed, message.id);
          const extractedImages = extractImages(parsed, message.id);

          // Add tables with deduplication
          for (const table of extractedTables) {
            const uniqueKey = `${message.id}_${table.content.slice(0, 50)}`;
            if (!seenIds.has(uniqueKey)) {
              seenIds.add(uniqueKey);
              // Use message timestamp if available
              if (message.created_at) {
                table.timestamp = new Date(message.created_at);
              }
              allTables.push(table);
            }
          }

          // Add images with deduplication
          for (const image of extractedImages) {
            const uniqueKey = `${message.id}_${image.url}`;
            if (!seenIds.has(uniqueKey)) {
              seenIds.add(uniqueKey);
              if (message.created_at) {
                image.timestamp = new Date(message.created_at);
              }
              allImages.push(image);
            }
          }
        } catch (error) {
          console.warn(`Failed to parse message ${message.id}:`, error);
          // Continue processing other messages
        }
      }

      // Update state with all extracted content
      if (allTables.length > 0 || allImages.length > 0) {
        setTables((prev) => {
          // Merge with existing, avoiding duplicates
          const existingIds = new Set(prev.map(t => t.id));
          const newTables = allTables.filter(t => !existingIds.has(t.id));
          return [...prev, ...newTables];
        });

        setImages((prev) => {
          const existingIds = new Set(prev.map(i => i.id));
          const newImages = allImages.filter(i => !existingIds.has(i.id));
          return [...prev, ...newImages];
        });

        setUnreadCount((prev) => prev + allTables.length + allImages.length);
        onNewContent?.();
      }

      // Mark this project+branch combination as scanned
      hasScannedRef.current.add(scanKey);
    } catch (error) {
      console.error("Failed to sync history to folder:", error);
    } finally {
      setIsScanning(false);
    }
  }, [projectId, branchId, extractTables, extractImages, onNewContent]);

  // Reset tables and images when project or branch changes
  useEffect(() => {
    setTables([]);
    setImages([]);
    setUnreadCount(0);
    // Clear scan status for this project+branch combination
    const scanKey = branchId ? `${projectId}_${branchId}` : `${projectId}_main`;
    hasScannedRef.current.delete(scanKey);
  }, [projectId, branchId]);

  return {
    tables,
    images,
    unreadCount,
    isScanning,
    archiveContent,
    resetUnreadCount,
    downloadTable,
    downloadImage,
    syncHistoryToFolder,
  };
};


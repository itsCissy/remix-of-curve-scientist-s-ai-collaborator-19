import { detectFileType, FileAttachment } from "@/components/curve/FileViewer";

export interface MessageAttachment {
  name: string;
  type: string;
  size: number;
  preview?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  files?: FileAttachment[];
  attachments?: MessageAttachment[];
  collaboratorId?: string;
}

export interface ParsedContent {
  reasoning?: string;
  tools?: string[];
  conclusion?: string;
  normalContent: string;
  files?: FileAttachment[];
}

export function parseMessageContent(content: string): ParsedContent {
  const result: ParsedContent = {
    normalContent: content,
  };

  // Extract reasoning
  const reasoningMatch = content.match(/<reasoning>([\s\S]*?)<\/reasoning>/);
  if (reasoningMatch) {
    result.reasoning = reasoningMatch[1].trim();
  }

  // Extract tools
  const toolsMatch = content.match(/<tools>([\s\S]*?)<\/tools>/);
  if (toolsMatch) {
    const toolsContent = toolsMatch[1].trim();
    result.tools = toolsContent
      .split('\n')
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  // Extract conclusion
  const conclusionMatch = content.match(/<conclusion>([\s\S]*?)<\/conclusion>/);
  if (conclusionMatch) {
    result.conclusion = conclusionMatch[1].trim();
  }

  // Extract files - format: <file name="filename.ext" size="1.2KB">content</file>
  const filesRegex = /<file\s+name="([^"]+)"(?:\s+size="([^"]+)")?(?:\s+url="([^"]+)")?>([^<]*)<\/file>/g;
  let filesMatch;
  const files: FileAttachment[] = [];
  
  while ((filesMatch = filesRegex.exec(content)) !== null) {
    const [, name, size, url, fileContent] = filesMatch;
    files.push({
      name,
      type: detectFileType(name),
      size: size || undefined,
      url: url || undefined,
      content: fileContent?.trim() || undefined,
    });
  }

  if (files.length > 0) {
    result.files = files;
  }

  // Get normal content (remove all tags)
  let normalContent = content
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '')
    .replace(/<tools>[\s\S]*?<\/tools>/g, '')
    .replace(/<conclusion>[\s\S]*?<\/conclusion>/g, '')
    .replace(/<file\s+[^>]*>[\s\S]*?<\/file>/g, '')
    .trim();

  result.normalContent = normalContent;

  return result;
}

export function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

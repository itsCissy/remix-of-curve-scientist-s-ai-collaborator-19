export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ParsedContent {
  reasoning?: string;
  tools?: string[];
  conclusion?: string;
  normalContent: string;
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

  // Get normal content (remove all tags)
  let normalContent = content
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '')
    .replace(/<tools>[\s\S]*?<\/tools>/g, '')
    .replace(/<conclusion>[\s\S]*?<\/conclusion>/g, '')
    .trim();

  result.normalContent = normalContent;

  return result;
}

export function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

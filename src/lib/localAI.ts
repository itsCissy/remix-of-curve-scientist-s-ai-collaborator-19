/**
 * 本地 AI 服务
 * 支持直接调用 OpenAI 兼容的 API
 */

import { AVAILABLE_AGENTS, Agent, DEFAULT_AGENT } from './agents';

// AI 配置 - 从环境变量或 localStorage 读取
interface AIConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
}

export function getAIConfig(): AIConfig {
  // 优先从 localStorage 读取（支持运行时配置）
  const storedConfig = localStorage.getItem('curve_ai_config');
  if (storedConfig) {
    try {
      return JSON.parse(storedConfig);
    } catch (e) {
      console.error('Failed to parse AI config from localStorage:', e);
    }
  }
  
  // 从环境变量读取
  return {
    apiKey: import.meta.env.VITE_AI_API_KEY || '',
    apiUrl: import.meta.env.VITE_AI_API_URL || 'https://api.openai.com/v1/chat/completions',
    model: import.meta.env.VITE_AI_MODEL || 'gpt-3.5-turbo',
  };
}

export function saveAIConfig(config: AIConfig) {
  localStorage.setItem('curve_ai_config', JSON.stringify(config));
}

export function clearAIConfig() {
  localStorage.removeItem('curve_ai_config');
}

export function isAIConfigured(): boolean {
  const config = getAIConfig();
  return !!config.apiKey;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatStreamOptions {
  messages: Message[];
  agentId?: string;
  onChunk: (chunk: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export async function streamChat(options: ChatStreamOptions) {
  const { messages, agentId, onChunk, onDone, onError, signal } = options;
  const config = getAIConfig();
  
  if (!config.apiKey) {
    // 如果没有配置 API Key，使用模拟响应
    simulateResponse(messages, onChunk, onDone, signal);
    return;
  }
  
  // 获取 Agent 系统提示词
  const agent = AVAILABLE_AGENTS.find(a => a.id === agentId) || DEFAULT_AGENT;
  const systemPrompt = agent.systemPrompt;
  
  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
      signal,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    if (!response.body) {
      throw new Error('No response body');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || !line || !line.trim()) continue;
        if (!line.startsWith('data: ')) continue;
        
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          onDone();
          return;
        }
        
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
    
    onDone();
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return;
    }
    onError(error as Error);
  }
}

// 模拟 AI 响应（当没有配置 API Key 时使用）
function simulateResponse(
  messages: Message[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  signal?: AbortSignal
) {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const query = lastUserMessage?.content || '';
  
  const responses = [
    `<reasoning>
正在分析您的问题："${query.slice(0, 50)}${query.length > 50 ? '...' : ''}"

这是一个本地演示模式的响应。要使用真实的 AI 功能，请配置您的 OpenAI API Key：

1. 在 \`.env.local\` 中设置：
   \`\`\`
   VITE_AI_API_KEY=sk-your-api-key
   VITE_AI_API_URL=https://api.openai.com/v1/chat/completions
   VITE_AI_MODEL=gpt-4
   \`\`\`

2. 或者在应用设置中配置 API Key
</reasoning>

<conclusion>
**本地演示模式**

当前系统运行在本地存储模式，AI 功能需要配置 API Key 才能使用。

您的消息已保存到本地 IndexedDB 数据库中。

**如需启用 AI 功能：**
1. 获取 OpenAI API Key（从 https://platform.openai.com）
2. 在环境变量或设置中配置
3. 刷新页面

如有其他问题，请随时告诉我！
</conclusion>`,
  ];
  
  const response = responses[0];
  let index = 0;
  
  const intervalId = setInterval(() => {
    if (signal?.aborted) {
      clearInterval(intervalId);
      return;
    }
    
    if (index < response.length) {
      // 每次输出 3-10 个字符，模拟流式效果
      const chunkSize = Math.floor(Math.random() * 8) + 3;
      const chunk = response.slice(index, index + chunkSize);
      onChunk(chunk);
      index += chunkSize;
    } else {
      clearInterval(intervalId);
      onDone();
    }
  }, 30);
}

export default { streamChat, getAIConfig, saveAIConfig, clearAIConfig, isAIConfigured };




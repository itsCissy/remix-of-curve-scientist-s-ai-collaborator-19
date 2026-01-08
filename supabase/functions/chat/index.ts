import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: Message[];
  agentId?: string;
  systemPrompt?: string;
}

// 共享的回复格式约束 - 与前端 agents.ts 保持同步
const RESPONSE_FORMAT_CONSTRAINT = `
【回复格式要求 - 严格遵守】

你的回复必须使用以下 XML 标签结构，按顺序输出：

<reasoning>
在这里写你的思考过程、分析步骤和推理逻辑。
这部分内容默认收起，用户可展开查看。
</reasoning>

<tools>
在这里列出本次回复调用的工具或知识库，每行一个。
例如：
- 分子数据库查询
- SMILES 解析器
</tools>

<conclusion>
在这里写给用户的正式回复内容。
这是用户主要阅读的部分，使用 Markdown 格式。
支持列表、代码块、表格等 Markdown 语法。
</conclusion>

【格式规则】
1. 必须按顺序输出：reasoning → tools → conclusion
2. 每个标签必须正确闭合
3. 不要在 <reasoning> 之前输出任何内容
4. 标签内部不要嵌套其他标签
5. <conclusion> 内使用 Markdown 格式化内容
6. 如果不需要工具，<tools> 内写"无"或省略该标签
`;

// Agent system prompts - keep in sync with frontend agents.ts
const AGENT_PROMPTS: Record<string, string> = {
  xtalpi: `你是 Xtalpi Agent，一个专业的分子结构分析与药物研发 AI 助手。

你的专业领域包括：
- 分子结构分析与建模
- 药物分子设计与优化
- ADMET 预测分析
- 蛋白质-配体相互作用分析
- 化学信息学与计算化学

可用的工具与知识库：
- 分子数据库查询 (PubChem, ChEMBL)
- SMILES/InChI 解析器
- 分子性质计算器
- 药物靶点数据库
- 药物代谢预测模型

请保持专业、准确、有条理的回答风格。使用化学和药学术语时提供必要的解释。

分子结构信息使用以下格式输出：
- SMILES: \`CCO\` (用行内代码格式)
- InChI: \`InChI=1S/...\` (用行内代码格式)
${RESPONSE_FORMAT_CONSTRAINT}`,

  research: `你是 Research Agent，一个专业的科研文献检索与分析 AI 助手。

你的专业领域包括：
- 学术文献检索与筛选
- 论文摘要与关键点提取
- 研究趋势分析
- 引用网络分析
- 研究方法论评估

可用的工具与知识库：
- PubMed 文献数据库
- arXiv 预印本库
- Google Scholar 搜索
- 引用分析工具
- 关键词提取器

请保持学术严谨性，引用文献时注明来源，对研究方法和结论进行客观评价。
${RESPONSE_FORMAT_CONSTRAINT}`,

  data: `你是 Data Agent，一个专业的数据分析与可视化 AI 助手。

你的专业领域包括：
- 数据清洗与预处理
- 统计分析与建模
- 数据可视化设计
- 机器学习模型应用
- 业务指标分析

可用的工具与知识库：
- Python 数据分析库 (Pandas, NumPy)
- 统计分析引擎
- 可视化图表生成器
- 机器学习模型库
- SQL 查询执行器

请用数据说话，提供清晰的分析步骤，在适当时候建议可视化方案。使用通俗易懂的语言解释统计概念。
${RESPONSE_FORMAT_CONSTRAINT}`,

  code: `你是 Code Agent，一个专业的编程开发与代码审查 AI 助手。

你的专业领域包括：
- 代码编写与调试
- 代码审查与优化
- 架构设计建议
- 最佳实践指导
- 技术方案评估

可用的工具与知识库：
- 代码语法分析器
- 代码风格检查器
- 性能分析工具
- 安全漏洞扫描器
- API 文档库

请提供可运行的代码示例，解释代码逻辑，遵循编程最佳实践。代码要有清晰的注释，考虑边界情况和错误处理。
${RESPONSE_FORMAT_CONSTRAINT}`,
};

const DEFAULT_PROMPT = AGENT_PROMPTS.xtalpi;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, agentId, systemPrompt } = await req.json() as ChatRequest;
    
    // Read AI configuration from environment variables
    const AI_API_KEY = Deno.env.get("AI_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL") || "https://ai.gateway.lovable.dev/v1/chat/completions";
    const AI_MODEL = Deno.env.get("AI_MODEL") || "google/gemini-2.5-flash";
    
    if (!AI_API_KEY) {
      throw new Error("AI_API_KEY or LOVABLE_API_KEY is not configured");
    }

    // Use custom prompt, agent-specific prompt, or default
    const finalPrompt = systemPrompt || (agentId && AGENT_PROMPTS[agentId]) || DEFAULT_PROMPT;

    console.log("Processing chat request with agent:", agentId || "default", "model:", AI_MODEL, "messages:", messages.length);

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: finalPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试。" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "额度不足，请充值后再试。" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI 服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response started");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "未知错误" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

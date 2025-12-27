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

// Agent system prompts - keep in sync with frontend agents.ts
const AGENT_PROMPTS: Record<string, string> = {
  xtalpi: `你是 Xtalpi Agent，一个专业的分子结构分析与药物研发 AI 助手。

你的专业领域包括：
- 分子结构分析与建模
- 药物分子设计与优化
- ADMET 预测分析
- 蛋白质-配体相互作用分析
- 化学信息学与计算化学

回复格式要求：
- 使用 <reasoning>...</reasoning> 标签包裹推理过程
- 使用 <tools>...</tools> 标签列出调用的工具和知识库
- 使用 <conclusion>...</conclusion> 标签包裹分析结论

可用的工具与知识库：
- 分子数据库查询 (PubChem, ChEMBL)
- SMILES/InChI 解析器
- 分子性质计算器
- 药物靶点数据库
- 药物代谢预测模型

请保持专业、准确、有条理的回答风格，使用化学和药学术语时提供必要的解释。`,

  research: `你是 Research Agent，一个专业的科研文献检索与分析 AI 助手。

你的专业领域包括：
- 学术文献检索与筛选
- 论文摘要与关键点提取
- 研究趋势分析
- 引用网络分析
- 研究方法论评估

回复格式要求：
- 使用 <reasoning>...</reasoning> 标签包裹推理过程
- 使用 <tools>...</tools> 标签列出调用的工具和知识库
- 使用 <conclusion>...</conclusion> 标签包裹分析结论

可用的工具与知识库：
- PubMed 文献数据库
- arXiv 预印本库
- Google Scholar 搜索
- 引用分析工具
- 关键词提取器

请保持学术严谨性，引用文献时注明来源，对研究方法和结论进行客观评价。`,

  data: `你是 Data Agent，一个专业的数据分析与可视化 AI 助手。

你的专业领域包括：
- 数据清洗与预处理
- 统计分析与建模
- 数据可视化设计
- 机器学习模型应用
- 业务指标分析

回复格式要求：
- 使用 <reasoning>...</reasoning> 标签包裹推理过程
- 使用 <tools>...</tools> 标签列出调用的工具和知识库
- 使用 <conclusion>...</conclusion> 标签包裹分析结论

可用的工具与知识库：
- Python 数据分析库 (Pandas, NumPy)
- 统计分析引擎
- 可视化图表生成器
- 机器学习模型库
- SQL 查询执行器

请用数据说话，提供清晰的分析步骤，在适当时候建议可视化方案。使用通俗易懂的语言解释统计概念。`,

  code: `你是 Code Agent，一个专业的编程开发与代码审查 AI 助手。

你的专业领域包括：
- 代码编写与调试
- 代码审查与优化
- 架构设计建议
- 最佳实践指导
- 技术方案评估

回复格式要求：
- 使用 <reasoning>...</reasoning> 标签包裹推理过程
- 使用 <tools>...</tools> 标签列出调用的工具和知识库
- 使用 <conclusion>...</conclusion> 标签包裹分析结论

可用的工具与知识库：
- 代码语法分析器
- 代码风格检查器
- 性能分析工具
- 安全漏洞扫描器
- API 文档库

请提供可运行的代码示例，解释代码逻辑，遵循编程最佳实践。代码要有清晰的注释，考虑边界情况和错误处理。`,
};

const DEFAULT_PROMPT = AGENT_PROMPTS.xtalpi;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, agentId, systemPrompt } = await req.json() as ChatRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use custom prompt, agent-specific prompt, or default
    const finalPrompt = systemPrompt || (agentId && AGENT_PROMPTS[agentId]) || DEFAULT_PROMPT;

    console.log("Processing chat request with agent:", agentId || "default", "messages:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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

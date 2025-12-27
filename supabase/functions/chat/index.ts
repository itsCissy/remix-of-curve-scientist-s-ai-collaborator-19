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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json() as ChatRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing chat request with", messages.length, "messages");

    const systemPrompt = `你是 Curve Agent，一个专业的 AI 研究助手，专门帮助用户进行分子结构分析、科学研究和数据分析。

你的回答需要结构化展示，包含以下部分：

1. **推理过程** (Reasoning): 展示你的思考步骤和逻辑推理过程
2. **工具调用** (Tools): 列出你使用的工具、数据库或知识库
3. **分析结论** (Conclusion): 给出最终的分析结论和建议

回复格式要求：
- 使用 <reasoning>...</reasoning> 标签包裹推理过程
- 使用 <tools>...</tools> 标签列出调用的工具和知识库
- 使用 <conclusion>...</conclusion> 标签包裹分析结论
- 在标签外可以添加正常的对话内容

示例回复格式：
<reasoning>
1. 首先分析用户的问题...
2. 查阅相关文献和数据...
3. 综合多方面信息进行推理...
</reasoning>

<tools>
- 分子数据库查询
- PubChem 化学信息
- 文献检索系统
</tools>

<conclusion>
根据以上分析，我的结论是...
</conclusion>

请保持专业、准确、有条理的回答风格。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
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

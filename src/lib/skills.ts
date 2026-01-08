import {
  Beaker,
  BookOpenCheck,
  Search,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  content: string;
  targetAgentId?: string; // Bound Agent ID for auto-switching
}

export const AVAILABLE_SKILLS: Skill[] = [
  {
    id: "literature",
    name: "文献综述助手",
    description: "以研究问题为核心，输出结构化综述大纲与引用片段。",
    icon: BookOpenCheck,
    content:
      "请围绕以下研究主题进行系统综述，输出包含研究背景、关键发现、对比分析与后续研究空白的摘要：\n- 主题：{{研究主题}}\n- 目标期刊：{{目标期刊}}\n- 重点关注：实验设计、数据规模、基准、结论可靠性\n- 额外要求：列出三条可行的实验复现清单。",
    targetAgentId: "research",
  },
  {
    id: "molecule",
    name: "分子性质速查",
    description: "根据 SMILES 计算基础理化性质并生成可视化描述。",
    icon: Beaker,
    content:
      "给定 SMILES 列表，计算并整理核心理化性质（LogP、TPSA、HBD、HBA、MW），并输出风险提示：\n- 输入：{{SMILES 列表}}\n- 输出：表格 + 关键性质结论\n- 结果使用中文说明，并添加一条实验注意事项。",
    targetAgentId: "xtalpi",
  },
  {
    id: "search",
    name: "精准检索",
    description: "语义与关键词混合策略，返回可操作的查询式。",
    icon: Search,
    content:
      "针对给定主题，生成 3-5 条高精度检索式（含布尔组合与 MeSH 词），并给出数据库选择建议：\n- 主题：{{检索主题}}\n- 检索库：PubMed / arXiv / CNKI\n- 输出：检索式 + 预期命中内容概要。",
    targetAgentId: "research",
  },
  {
    id: "orchestration",
    name: "智能编排",
    description: "用指令片段拼装可复用的交互模版。",
    icon: Wand2,
    content:
      "基于当前任务，将意图拆分为多个可重用指令片段，输出 Markdown 模版：\n- 步骤列表（含前置条件与依赖）\n- 用户需提供的输入项\n- 结果校验 checklist（简洁）。",
    targetAgentId: "code",
  },
];

// Helper to get skill by ID
export function getSkillById(id: string): Skill | undefined {
  return AVAILABLE_SKILLS.find((skill) => skill.id === id);
}


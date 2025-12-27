export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const AVAILABLE_AGENTS: Agent[] = [
  {
    id: "xtalpi",
    name: "Xtalpi Agent",
    description: "分子结构分析与药物研发助手",
    icon: "🧪",
    color: "bg-violet-500",
  },
  {
    id: "research",
    name: "Research Agent",
    description: "科研文献检索与分析助手",
    icon: "📚",
    color: "bg-blue-500",
  },
  {
    id: "data",
    name: "Data Agent",
    description: "数据分析与可视化助手",
    icon: "📊",
    color: "bg-emerald-500",
  },
  {
    id: "code",
    name: "Code Agent",
    description: "编程开发与代码审查助手",
    icon: "💻",
    color: "bg-amber-500",
  },
];

export const DEFAULT_AGENT = AVAILABLE_AGENTS[0];

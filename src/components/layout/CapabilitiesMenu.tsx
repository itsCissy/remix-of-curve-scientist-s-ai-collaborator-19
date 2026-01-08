import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Bot,
  Workflow,
  Sparkles,
  Settings2,
} from "lucide-react";
import { useNavigation } from "@/contexts/NavigationContext";
import { AVAILABLE_SKILLS, getSkillById } from "@/lib/skills";

type MenuPosition = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

type TabKey = "agent" | "workflow" | "skills";

interface MenuItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  path: string;
}

interface CapabilitiesMenuProps {
  position: MenuPosition;
  onNavigate: (path: string) => void;
  onClose: () => void;
}

const tabs: { id: TabKey; label: string }[] = [
  { id: "agent", label: "Agent" },
  { id: "workflow", label: "Workflow" },
  { id: "skills", label: "Skills" },
];

const agentItems: MenuItem[] = [
  {
    id: "agent-center",
    label: "Agent",
    description: "管理与配置对话 Agent",
    icon: Bot,
    path: "/agent",
  },
  {
    id: "agent-templates",
    label: "Agent 模板",
    description: "快速启用预设能力组合",
    icon: Sparkles,
    path: "/agent",
  },
];

const workflowItems: MenuItem[] = [
  {
    id: "workflow",
    label: "Workflow",
    description: "搭建与复用科研自动化流程",
    icon: Workflow,
    path: "/workflow",
  },
  {
    id: "workflow-observe",
    label: "执行记录",
    description: "查看运行日志与可视化编排",
    icon: Settings2,
    path: "/workflow",
  },
];

const CapabilitiesMenu = ({ position, onNavigate, onClose }: CapabilitiesMenuProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("agent");
  const { injectSkill } = useNavigation();

  // Handle skill click - inject into chat input
  const handleSkillClick = (skillId: string) => {
    const skill = getSkillById(skillId);
    if (!skill) return;

    injectSkill({
      content: skill.content,
      targetAgentId: skill.targetAgentId,
      skillName: skill.name,
    });

    // Navigate to home if not already there
    if (window.location.pathname !== "/") {
      onNavigate("/");
    }

    onClose();
  };

  const renderItems = (items: MenuItem[]) => (
    <div className="flex flex-col gap-1 px-3 py-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            onNavigate(item.path);
            onClose();
          }}
          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-slate-100"
        >
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
            <item.icon className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground">{item.label}</div>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div
      data-capabilities-menu
      style={{
        position: "fixed",
        ...position,
        zIndex: 9999,
      }}
      className="min-w-[280px] max-w-[320px] bg-white/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl overflow-hidden animate-fade-in"
    >
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100",
              activeTab === tab.id ? "text-[#123aff]" : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {activeTab === "agent" && renderItems(agentItems)}
        {activeTab === "workflow" && renderItems(workflowItems)}
        {activeTab === "skills" && (
          <>
            <div className="flex flex-col gap-1 px-3 py-2">
              {AVAILABLE_SKILLS.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => handleSkillClick(skill.id)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-slate-100"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                    <skill.icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{skill.name}</div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{skill.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-border mt-1">
              <button
                onClick={() => {
                  onNavigate("/skills-hub");
                  onClose();
                }}
                className="w-full h-10 text-sm font-medium text-[#123aff] hover:bg-slate-100 transition-colors flex items-center justify-center"
              >
                管理所有技能
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CapabilitiesMenu;


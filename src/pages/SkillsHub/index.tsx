import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  PanelLeft,
  Settings2,
  Sparkles,
  Trash2,
  Plus,
} from "lucide-react";
import AgentSelector from "@/components/curve/AgentSelector";
import { Agent, AVAILABLE_AGENTS } from "@/lib/agents";
import { AVAILABLE_SKILLS, Skill } from "@/lib/skills";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Use shared skills data
const skills = AVAILABLE_SKILLS;

type ViewMode = "grid" | "edit";

const SkillsHub = () => {
  // View mode: "grid" for overview, "edit" for deep editing
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AVAILABLE_AGENTS[0]);
  const [draft, setDraft] = useState<string>("");
  const [hoveredSkillId, setHoveredSkillId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedSkill = useMemo(
    () => (selectedSkillId ? skills.find((skill) => skill.id === selectedSkillId) : null),
    [selectedSkillId]
  );

  const adjustTextareaHeight = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [draft]);

  useEffect(() => {
    if (selectedSkill) {
      setDraft(selectedSkill.content);
    }
  }, [selectedSkill]);

  // Enter edit mode for a specific skill
  const handleEnterEditMode = (skillId: string) => {
    setSelectedSkillId(skillId);
    setViewMode("edit");
  };

  // Return to grid view
  const handleBackToGrid = () => {
    setViewMode("grid");
    setSelectedSkillId(null);
    setDraft("");
  };

  // Copy skill
  const handleCopySkill = (skill: Skill, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(skill.content);
    toast.success(`已复制「${skill.name}」到剪贴板`);
  };

  // Trigger delete confirmation
  const handleDeleteClick = (skill: Skill, e: React.MouseEvent) => {
    e.stopPropagation();
    setSkillToDelete(skill);
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (skillToDelete) {
      // TODO: Actually delete from database/store
      toast.success(`已删除技能「${skillToDelete.name}」`);
      setShowDeleteDialog(false);
      setSkillToDelete(null);
    }
  };

  // Settings click - enter edit mode
  const handleSettingsClick = (skillId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleEnterEditMode(skillId);
  };

  const handleCancel = () => {
    if (selectedSkill) {
      setDraft(selectedSkill.content);
      adjustTextareaHeight();
    }
  };

  const handleSave = () => {
    toast.success("技能已保存");
  };

  // Switch skill in edit mode
  const handleSwitchSkill = (skillId: string) => {
    setSelectedSkillId(skillId);
  };

  // ============ GRID VIEW ============
  if (viewMode === "grid") {
    return (
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Skills Hub</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              科研技能的集中管理与指令编排
            </p>
          </div>
          <button
            className="h-9 px-4 rounded-lg bg-[#123aff] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#123aff]/90 transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={1.8} />
            新建技能
          </button>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {skills.map((skill) => {
              const isHovered = hoveredSkillId === skill.id;
              return (
                <div
                  key={skill.id}
                  className="relative group rounded-xl border border-border bg-white p-4 transition-all hover:shadow-md hover:border-slate-300 cursor-pointer"
                  onMouseEnter={() => setHoveredSkillId(skill.id)}
                  onMouseLeave={() => setHoveredSkillId(null)}
                  onClick={() => handleEnterEditMode(skill.id)}
                >
                  {/* Skill Icon */}
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 mb-3">
                    <skill.icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>

                  {/* Skill Title */}
                  <h3 className="text-sm font-semibold text-foreground mb-1.5 line-clamp-1">
                    {skill.name}
                  </h3>

                  {/* Skill Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {skill.description}
                  </p>

                  {/* Hover Actions */}
                  <div
                    className={cn(
                      "absolute top-3 right-3 flex items-center gap-1 transition-opacity duration-200",
                      isHovered ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <button
                      onClick={(e) => handleCopySkill(skill, e)}
                      className="p-1.5 rounded-md bg-white border border-border text-slate-500 hover:text-[#123aff] hover:bg-[rgba(18,58,255,0.08)] hover:border-[#123aff]/30 transition-colors"
                      title="复制"
                    >
                      <Copy className="w-4 h-4" strokeWidth={1.8} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(skill, e)}
                      className="p-1.5 rounded-md bg-white border border-border text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                    </button>
                    <button
                      onClick={(e) => handleSettingsClick(skill.id, e)}
                      className="p-1.5 rounded-md bg-white border border-border text-slate-500 hover:text-[#123aff] hover:bg-[rgba(18,58,255,0.08)] hover:border-[#123aff]/30 transition-colors"
                      title="配置"
                    >
                      <Settings2 className="w-4 h-4" strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {skills.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                暂无技能
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                创建你的第一个科研技能模版
              </p>
              <button className="h-9 px-4 rounded-lg bg-[#123aff] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#123aff]/90 transition-colors">
                <Plus className="w-4 h-4" strokeWidth={1.8} />
                新建技能
              </button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-red-100">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <AlertDialogTitle className="text-lg">确认删除技能</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-muted-foreground">
                您确定要删除技能{" "}
                <span className="font-medium text-foreground">
                  「{skillToDelete?.name}」
                </span>{" "}
                吗？
                <br />
                <span className="text-sm text-slate-500 mt-2 block">
                  此操作不可撤销，技能的所有配置将被永久删除。
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel className="h-9 px-4 bg-white text-foreground border-border hover:bg-white hover:border-slate-300">
                取消
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="h-9 px-4 bg-[#123aff] text-white hover:bg-[#123aff]/90"
              >
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ============ EDIT MODE (Three-Column Layout) ============
  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header with Back Button */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToGrid}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#123aff] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.8} />
            返回总览
          </button>
          <div className="h-5 w-px bg-border" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {selectedSkill?.name || "编辑技能"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              深度配置模式
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-4 h-4" strokeWidth={1.5} />
          <span>沉浸式三栏编辑体验</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Skill Navigation */}
        <aside className="w-[260px] border-r border-border bg-[#f9f9fb] overflow-y-auto">
          <div className="p-3 space-y-2">
            {skills.map((skill) => (
              <button
                key={skill.id}
                onClick={() => handleSwitchSkill(skill.id)}
                className={cn(
                  "w-full text-left rounded-lg border transition-colors p-3 flex items-start gap-3 hover:border-slate-200",
                  selectedSkillId === skill.id
                    ? "bg-[#f0f2ff] border-[#123aff] border-l-[4px]"
                    : "bg-white border-transparent"
                )}
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <skill.icon className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      selectedSkillId === skill.id ? "text-[#123aff]" : "text-foreground"
                    )}
                  >
                    {skill.name}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {skill.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Middle: Instruction Editor */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <PanelLeft className="w-4 h-4" strokeWidth={1.5} />
                <span>指令模版</span>
              </div>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onInput={adjustTextareaHeight}
                placeholder="在这里编排你的科研技能指令，支持粘贴片段与片段组合。"
                className="w-full bg-transparent border border-transparent focus:border-[#123aff] focus:ring-2 focus:ring-[#123aff]/10 rounded-xl px-4 py-3 text-sm leading-6 resize-none outline-none placeholder:text-muted-foreground"
                rows={4}
              />
              <div className="mt-3 text-xs text-muted-foreground">
                输入框会随内容自动伸缩，保持 Gemini 式的纯净编辑体验。
              </div>
            </div>
          </div>
        </main>

        {/* Right: Configuration Panel */}
        <aside className="w-[280px] min-w-[260px] border-l border-border bg-[#fbfbfc] flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">配置面板</h3>
            <p className="text-xs text-muted-foreground mt-1">
              绑定 Agent 与执行参数，保持布局比例统一。
            </p>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">绑定 Agent</div>
              <AgentSelector
                selectedAgent={selectedAgent}
                onSelectAgent={(agent) => setSelectedAgent(agent)}
              />
            </div>
            <div className="rounded-lg border border-border/60 bg-white p-3">
              <div className="text-sm font-medium text-foreground mb-1.5">
                变量提示
              </div>
              <p className="text-xs text-muted-foreground leading-5">
                在指令中保持输入占位符清晰，例如 <code>{`{主题}`}</code>、
                <code>{`{数据源}`}</code>，便于复用与协作。
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-white p-3">
              <div className="text-sm font-medium text-foreground mb-1.5">
                输出校验
              </div>
              <p className="text-xs text-muted-foreground leading-5">
                在保存前确认输出格式（表格、要点、引用），并确保语言风格与团队规范一致。
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer Action Bar */}
      <div className="border-t border-border bg-white px-6 py-3 flex items-center justify-end gap-3">
        <button
          onClick={handleCancel}
          className="h-9 px-4 rounded-lg border border-border text-sm text-foreground bg-white hover:bg-white hover:border-slate-300 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="h-9 px-4 rounded-lg border border-[#123aff] bg-[#123aff] text-white transition-colors hover:bg-[#123aff]/90"
        >
          保存
        </button>
      </div>
    </div>
  );
};

export default SkillsHub;

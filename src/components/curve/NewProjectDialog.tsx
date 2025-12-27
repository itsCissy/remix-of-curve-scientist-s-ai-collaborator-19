import { useState } from "react";
import { X, FolderOpen, Plus, ChevronDown, Beaker, Atom, FlaskConical, Microscope, Dna, Pill } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import IconPicker from "./IconPicker";
import AgentAvatar from "./AgentAvatar";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const availableAgents = [
  { id: "xtalpi", name: "Xtalpi Agent", description: "通用科学分析" },
  { id: "molecule", name: "Molecule Agent", description: "分子结构分析" },
  { id: "crystal", name: "Crystal Agent", description: "晶体结构预测" },
  { id: "synthesis", name: "Synthesis Agent", description: "合成路线设计" },
];

const suggestedTags = [
  "分子分析", "晶体结构", "药物设计", "ADMET", "合成路线", 
  "高通量筛选", "蛋白质", "小分子", "VAST", "HTE"
];

const NewProjectDialog = ({ open, onOpenChange }: NewProjectDialogProps) => {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🔬");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [contextPath, setContextPath] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(availableAgents[0]);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleCreate = () => {
    console.log({ projectName, projectDescription, selectedIcon, contextPath, selectedAgent, tags });
    onOpenChange(false);
    resetForm();
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setProjectName("");
    setProjectDescription("");
    setSelectedIcon("🔬");
    setContextPath("");
    setSelectedAgent(availableAgents[0]);
    setTags([]);
    setTagInput("");
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-card border-border max-h-[90vh] overflow-hidden" hideCloseButton>
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Beaker className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  新建科学项目
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">配置项目信息与上下文环境</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] scrollbar-thin">
          <div className="px-6 py-5 space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Atom className="w-4 h-4 text-primary" />
                基本信息
              </div>
              
              <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                {/* Icon Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-14 h-14 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-2xl transition-colors hover:bg-muted/50"
                  >
                    {selectedIcon}
                  </button>
                  {showIconPicker && (
                    <IconPicker
                      selectedIcon={selectedIcon}
                      onSelect={(icon) => {
                        setSelectedIcon(icon);
                        setShowIconPicker(false);
                      }}
                      onClose={() => setShowIconPicker(false)}
                    />
                  )}
                </div>

                {/* Project Name */}
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">
                    项目名称 <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="例如：分子结构分析实验"
                    className="h-10 bg-muted/30 border-border focus-visible:ring-primary"
                  />
                </div>
              </div>

              {/* Project Description */}
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">项目描述</label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="描述项目目标、研究方向或实验计划..."
                  className="min-h-[80px] resize-none bg-muted/30 border-border focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Context Configuration Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FolderOpen className="w-4 h-4 text-primary" />
                上下文配置
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">数据目录路径</label>
                <div className="flex gap-2">
                  <Input
                    value={contextPath}
                    onChange={(e) => setContextPath(e.target.value)}
                    placeholder="/opt/nfs-share/your-project-data"
                    className="flex-1 h-10 bg-muted/30 border-border focus-visible:ring-primary font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" className="h-10 w-10 border-border hover:bg-muted">
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">指定 Agent 可访问的数据文件目录</p>
              </div>
            </div>

            {/* Agent Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FlaskConical className="w-4 h-4 text-primary" />
                默认 Agent
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AgentAvatar size="sm" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">{selectedAgent.name}</div>
                      <div className="text-xs text-muted-foreground">{selectedAgent.description}</div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showAgentDropdown ? "rotate-180" : ""}`} />
                </button>

                {showAgentDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAgentDropdown(false)} />
                    <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                      {availableAgents.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => {
                            setSelectedAgent(agent);
                            setShowAgentDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                            selectedAgent.id === agent.id ? "bg-primary/5" : ""
                          }`}
                        >
                          <AgentAvatar size="sm" />
                          <div className="text-left">
                            <div className="text-sm font-medium text-foreground">{agent.name}</div>
                            <div className="text-xs text-muted-foreground">{agent.description}</div>
                          </div>
                          {selectedAgent.id === agent.id && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Dna className="w-4 h-4 text-primary" />
                项目标签
              </div>

              {/* Selected Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-2.5 py-1 bg-primary/10 text-primary border-0 hover:bg-primary/20"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1.5 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Tag Input */}
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="输入标签后按 Enter 添加"
                  className="flex-1 h-9 bg-muted/30 border-border focus-visible:ring-primary text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => tagInput.trim() && addTag(tagInput.trim())}
                  className="h-9 border-border hover:bg-muted"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Suggested Tags */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">常用标签</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTags.filter(t => !tags.includes(t)).slice(0, 6).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="px-2.5 py-1 text-xs rounded-md bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <div className="text-xs text-muted-foreground">
            <Microscope className="w-3.5 h-3.5 inline-block mr-1" />
            创建后可在项目设置中修改配置
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="hover:bg-muted"
            >
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!projectName.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
            >
              创建项目
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;

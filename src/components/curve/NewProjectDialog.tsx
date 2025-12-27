import { useState, useRef, DragEvent } from "react";
import { X, FolderOpen, Plus, ChevronDown, Beaker, Atom, FlaskConical, Microscope, Dna, Upload, FileText, Trash2, Check, Sparkles } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import IconPicker from "./IconPicker";
import AgentAvatar from "./AgentAvatar";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreate?: (projectData: { name: string; icon: string; description: string }) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  agents: string[];
}

const availableAgents = [
  { id: "xtalpi", name: "Xtalpi Agent", description: "通用科学分析", color: "from-blue-500 to-cyan-500" },
  { id: "molecule", name: "Molecule Agent", description: "分子结构分析", color: "from-purple-500 to-pink-500" },
  { id: "crystal", name: "Crystal Agent", description: "晶体结构预测", color: "from-amber-500 to-orange-500" },
  { id: "synthesis", name: "Synthesis Agent", description: "合成路线设计", color: "from-green-500 to-emerald-500" },
];

const projectTemplates: ProjectTemplate[] = [
  { id: "molecule", name: "分子分析", description: "分子结构分析与性质预测", icon: "🧬", tags: ["分子分析", "ADMET"], agents: ["molecule"] },
  { id: "crystal", name: "晶体预测", description: "晶体结构预测与多晶型分析", icon: "💎", tags: ["晶体结构"], agents: ["crystal"] },
  { id: "drug", name: "药物设计", description: "药物分子设计与优化", icon: "💊", tags: ["药物设计", "小分子"], agents: ["molecule", "synthesis"] },
  { id: "synthesis", name: "合成路线", description: "化学合成路线规划", icon: "⚗️", tags: ["合成路线"], agents: ["synthesis"] },
  { id: "hte", name: "高通量实验", description: "高通量实验设计与分析", icon: "🔬", tags: ["高通量筛选", "HTE"], agents: ["xtalpi"] },
  { id: "custom", name: "自定义项目", description: "从空白开始创建项目", icon: "📋", tags: [], agents: ["xtalpi"] },
];

const suggestedTags = [
  "分子分析", "晶体结构", "药物设计", "ADMET", "合成路线", 
  "高通量筛选", "蛋白质", "小分子", "VAST", "HTE"
];

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const NewProjectDialog = ({ open, onOpenChange, onProjectCreate }: NewProjectDialogProps) => {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🔬");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [contextPath, setContextPath] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>(["xtalpi"]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (projectName.trim()) {
      onProjectCreate?.({
        name: projectName.trim(),
        icon: selectedIcon,
        description: projectDescription,
      });
    }
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
    setSelectedAgents(["xtalpi"]);
    setTags([]);
    setTagInput("");
    setSelectedTemplate(null);
    setUploadedFiles([]);
  };

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template.id);
    setSelectedIcon(template.icon);
    setTags(template.tags);
    setSelectedAgents(template.agents);
    if (template.id !== "custom") {
      setProjectDescription(template.description);
    }
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFiles(files);
    }
  };

  const addFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type || "unknown",
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
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
            {/* Template Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                项目模板
              </div>
              <div className="grid grid-cols-3 gap-2">
                {projectTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`relative p-3 rounded-lg border text-left transition-all ${
                      selectedTemplate === template.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    {selectedTemplate === template.id && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                    <div className="text-xl mb-1">{template.icon}</div>
                    <div className="text-xs font-medium text-foreground">{template.name}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>

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

            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Upload className="w-4 h-4 text-primary" />
                数据文件上传
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.json,.sdf,.mol,.pdb,.cif,.smiles,.txt"
                />
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-foreground font-medium">拖拽文件到此处上传</p>
                <p className="text-xs text-muted-foreground mt-1">或点击选择文件</p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  支持 CSV, Excel, JSON, SDF, MOL, PDB, CIF, SMILES 等格式
                </p>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 border border-border"
                    >
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

            {/* Multi-Agent Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FlaskConical className="w-4 h-4 text-primary" />
                  协作 Agent
                </div>
                <span className="text-xs text-muted-foreground">
                  已选择 {selectedAgents.length} 个
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {availableAgents.map((agent) => {
                  const isSelected = selectedAgents.includes(agent.id);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center`}>
                          <AgentAvatar size="sm" />
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{agent.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{agent.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">选择多个 Agent 可实现协作分析，提升研究效率</p>
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

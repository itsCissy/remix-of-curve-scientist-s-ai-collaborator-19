import { useState, useMemo } from "react";
import { Clock, RefreshCw, SquarePen, Smartphone, Search, X } from "lucide-react";
import CurveLogo from "./CurveLogo";
import ProjectItem from "./ProjectItem";
import UserAvatar from "./UserAvatar";
import NewProjectDialog from "./NewProjectDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import RenameDialog from "./RenameDialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface Project {
  icon: string;
  name: string;
  author: string;
  isActive?: boolean;
}

const initialProjects: Project[] = [
  { icon: "📋", name: "test", author: "程希希", isActive: true },
  { icon: "📋", name: "Tool Test 251226", author: "xinos" },
  { icon: "📋", name: "HTE&VAST TEST_PY", author: "张佩宇" },
  { icon: "📋", name: "筛选测试", author: "谈绿" },
  { icon: "📋", name: "筛选测试", author: "谈绿" },
  { icon: "📋", name: "VAST TEST 4", author: "严泽伊" },
  { icon: "🎯", name: "VAST TEST 3", author: "王兆伦" },
  { icon: "😊", name: "VAST TEST 2", author: "王兆伦" },
  { icon: "🐷", name: "VAST TEST", author: "王兆伦" },
  { icon: "📋", name: "test", author: "canyang.liu" },
  { icon: "📦", name: "HTE tool test", author: "xinos" },
  { icon: "🚀", name: "数据协议", author: "熊智" },
  { icon: "💜", name: "测试 LangGhain", author: "黄金丽" },
  { icon: "✏️", name: "测试", author: "yansen.lei" },
  { icon: "💜", name: "TEST Cal Agent", author: "黄金丽" },
];

const Sidebar = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ name: string; index: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase().trim();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.author.toLowerCase().includes(query)
    );
  }, [searchQuery, projects]);

  const handleProjectCreate = (projectData: { name: string; icon: string; description: string }) => {
    const newProject: Project = {
      icon: projectData.icon,
      name: projectData.name,
      author: "程希希", // Current user
      isActive: true,
    };
    
    // Set all projects as inactive and add new one at the top
    setProjects(prev => [
      newProject,
      ...prev.map(p => ({ ...p, isActive: false }))
    ]);
    
    toast.success(`项目 "${projectData.name}" 创建成功`);
  };

  const handleRename = (projectName: string, index: number) => {
    setSelectedProject({ name: projectName, index });
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = (newName: string) => {
    if (selectedProject) {
      setProjects(prev => 
        prev.map((p, i) => 
          i === selectedProject.index ? { ...p, name: newName } : p
        )
      );
      toast.success(`项目已重命名为: ${newName}`);
    }
    setRenameDialogOpen(false);
    setSelectedProject(null);
  };

  const handleDelete = (projectName: string, index: number) => {
    setSelectedProject({ name: projectName, index });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedProject) {
      setProjects(prev => prev.filter((_, i) => i !== selectedProject.index));
      toast.success(`项目 "${selectedProject.name}" 已删除`);
    }
    setDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  const handleCopy = (projectName: string) => {
    toast.success(`已复制项目: ${projectName}`);
  };

  const handleExport = (projectName: string) => {
    toast.info(`导出项目: ${projectName}`);
  };

  const handleShare = (projectName: string) => {
    toast.info(`分享项目: ${projectName}`);
  };

  const handleFavorite = (projectName: string) => {
    toast.success(`已添加到收藏: ${projectName}`);
  };

  const handleOpen = (projectName: string, index: number) => {
    setProjects(prev => 
      prev.map((p, i) => ({ ...p, isActive: i === index }))
    );
    toast.info(`打开项目: ${projectName}`);
  };

  return (
    <>
      <div className="w-[280px] h-screen bg-card border-r border-curve-sidebar-border flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <CurveLogo />
          <button className="p-2 rounded-lg hover:bg-curve-hover transition-colors text-muted-foreground hover:text-foreground">
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* New Project Button */}
        <div className="px-3 mb-2">
          <button 
            onClick={() => setNewProjectOpen(true)}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium text-sm shadow-sm"
          >
            <SquarePen className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* All Projects Section */}
        <div className="px-3 py-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>所有项目</span>
              {searchQuery && (
                <span className="text-xs text-muted-foreground/70">
                  ({filteredProjects.length}/{projects.length})
                </span>
              )}
            </div>
            <button className="p-1 rounded hover:bg-curve-hover transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="px-3 mb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目名称或作者..."
              className="pl-8 pr-8 h-8 text-sm bg-background/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
          <div className="space-y-0.5">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => (
                <ProjectItem
                  key={`${project.name}-${index}`}
                  icon={project.icon}
                  name={project.name}
                  author={project.author}
                  isActive={project.isActive}
                  onRename={() => handleRename(project.name, index)}
                  onDelete={() => handleDelete(project.name, index)}
                  onCopy={() => handleCopy(project.name)}
                  onExport={() => handleExport(project.name)}
                  onShare={() => handleShare(project.name)}
                  onFavorite={() => handleFavorite(project.name)}
                  onOpen={() => handleOpen(project.name, index)}
                />
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>未找到匹配的项目</p>
                <p className="text-xs mt-1">尝试其他搜索关键词</p>
              </div>
            )}
          </div>
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-curve-sidebar-border">
          <UserAvatar name="程希希" />
        </div>
      </div>

      {/* New Project Dialog */}
      <NewProjectDialog 
        open={newProjectOpen} 
        onOpenChange={setNewProjectOpen}
        onProjectCreate={handleProjectCreate}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        projectName={selectedProject?.name || ""}
        onConfirm={handleDeleteConfirm}
      />

      {/* Rename Dialog */}
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentName={selectedProject?.name || ""}
        onConfirm={handleRenameConfirm}
      />
    </>
  );
};

export default Sidebar;

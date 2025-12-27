import { useState } from "react";
import { Clock, RefreshCw, SquarePen, Smartphone } from "lucide-react";
import CurveLogo from "./CurveLogo";
import ProjectItem from "./ProjectItem";
import UserAvatar from "./UserAvatar";
import NewProjectDialog from "./NewProjectDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import RenameDialog from "./RenameDialog";
import { toast } from "sonner";

const projects = [
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
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ name: string; index: number } | null>(null);

  const handleRename = (projectName: string, index: number) => {
    setSelectedProject({ name: projectName, index });
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = (newName: string) => {
    toast.success(`项目已重命名为: ${newName}`);
    setRenameDialogOpen(false);
    setSelectedProject(null);
  };

  const handleDelete = (projectName: string, index: number) => {
    setSelectedProject({ name: projectName, index });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedProject) {
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

  const handleOpen = (projectName: string) => {
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
            </div>
            <button className="p-1 rounded hover:bg-curve-hover transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
          <div className="space-y-0.5">
            {projects.map((project, index) => (
              <ProjectItem
                key={index}
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
                onOpen={() => handleOpen(project.name)}
              />
            ))}
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

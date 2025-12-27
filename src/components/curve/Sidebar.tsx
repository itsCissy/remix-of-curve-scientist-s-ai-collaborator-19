import { useState, useMemo } from "react";
import { FolderKanban, RefreshCw, SquarePen, PanelLeftClose, PanelLeft, Search, X, Loader2 } from "lucide-react";
import ProjectItem from "./ProjectItem";
import NewProjectDialog from "./NewProjectDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import RenameDialog from "./RenameDialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Project } from "@/hooks/useProjects";

interface SidebarProps {
  projects: Project[];
  isLoading: boolean;
  activeProject: Project | null;
  onCreateProject: (data: { name: string; icon: string; description: string }) => Promise<Project | null>;
  onDeleteProject: (id: string) => Promise<boolean>;
  onRenameProject: (id: string, name: string) => Promise<boolean>;
  onSelectProject: (id: string) => Promise<boolean>;
}

const Sidebar = ({ 
  projects, 
  isLoading, 
  activeProject,
  onCreateProject, 
  onDeleteProject, 
  onRenameProject,
  onSelectProject 
}: SidebarProps) => {
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);
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

  const handleProjectCreate = async (projectData: { name: string; icon: string; description: string }) => {
    await onCreateProject(projectData);
  };

  const handleRename = (project: Project) => {
    setSelectedProject({ id: project.id, name: project.name });
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = async (newName: string) => {
    if (selectedProject) {
      await onRenameProject(selectedProject.id, newName);
      toast.success(`项目已重命名为: ${newName}`);
    }
    setRenameDialogOpen(false);
    setSelectedProject(null);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject({ id: project.id, name: project.name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProject) {
      await onDeleteProject(selectedProject.id);
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

  const handleOpen = async (project: Project) => {
    await onSelectProject(project.id);
  };

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <div className={`${isCollapsed ? 'w-[52px]' : 'w-[280px]'} h-screen bg-card border-r border-curve-sidebar-border flex flex-col transition-all duration-200`}>
        {/* Header - Collapse Toggle at top when collapsed */}
        <div className={`p-2 flex ${isCollapsed ? 'flex-col items-center gap-1' : 'items-center gap-2 px-3'}`}>
          {/* Collapse Toggle - Always first when collapsed */}
          {isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(false)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-curve-hover transition-colors text-muted-foreground hover:text-foreground"
              title="展开侧边栏"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          
          {/* New Project Button */}
          {isCollapsed ? (
            <button 
              onClick={() => setNewProjectOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              title="New Project"
            >
              <SquarePen className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button 
                onClick={() => setNewProjectOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium text-sm shadow-sm flex-1"
                title="New Project"
              >
                <SquarePen className="w-4 h-4 flex-shrink-0" />
                <span>New Project</span>
              </button>
              <button 
                onClick={() => setIsCollapsed(true)}
                className="p-2 rounded-lg hover:bg-curve-hover transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                title="折叠侧边栏"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* All Projects Section */}
        {!isCollapsed && (
          <div className="px-3 py-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <div className="flex items-center gap-2 text-sm">
                <FolderKanban className="w-4 h-4" />
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
        )}

        {/* Search Input */}
        {!isCollapsed && (
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
        )}

        {/* Project List */}
        <div className={`flex-1 overflow-y-auto scrollbar-thin ${isCollapsed ? 'px-1.5' : 'px-2'}`}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <div className={`${isCollapsed ? 'space-y-1' : 'space-y-0.5'}`}>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    icon={project.icon}
                    name={project.name}
                    author={project.author}
                    isActive={project.id === activeProject?.id}
                    isCollapsed={isCollapsed}
                    onRename={() => handleRename(project)}
                    onDelete={() => handleDelete(project)}
                    onCopy={() => handleCopy(project.name)}
                    onExport={() => handleExport(project.name)}
                    onShare={() => handleShare(project.name)}
                    onFavorite={() => handleFavorite(project.name)}
                    onOpen={() => handleOpen(project)}
                  />
                ))
              ) : (
                !isCollapsed && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{projects.length === 0 ? "暂无项目" : "未找到匹配的项目"}</p>
                    <p className="text-xs mt-1">
                      {projects.length === 0 ? "点击上方按钮创建新项目" : "尝试其他搜索关键词"}
                    </p>
                  </div>
                )
              )}
            </div>
          )}
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

import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/curve/Sidebar";
import TopNavbar from "@/components/curve/TopNavbar";
import FileCenter from "@/components/curve/FileCenter";
import { useProjects } from "@/hooks/useProjects";
import { useFileAssets } from "@/hooks/useFileAssets";

const Files = () => {
  const navigate = useNavigate();
  const {
    projects,
    isLoading: projectsLoading,
    activeProject,
    createProject,
    deleteProject,
    updateProject,
    setActive,
  } = useProjects();

  const {
    assets,
    isLoading: assetsLoading,
    deleteAsset,
    resetUnreadCount,
  } = useFileAssets(activeProject?.id || null);

  // Reset unread count when viewing file center
  useEffect(() => {
    resetUnreadCount();
  }, [resetUnreadCount]);

  const handleNavigateToMessage = useCallback(
    (messageId: string, branchId: string) => {
      // Navigate to the main page with the message highlight info
      navigate(`/?branch=${branchId}&message=${messageId}&highlight=true`);
    },
    [navigate]
  );

  const handleRenameProject = async (id: string, name: string) => {
    return await updateProject(id, { name });
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        isLoading={projectsLoading}
        activeProject={activeProject}
        onCreateProject={createProject}
        onDeleteProject={deleteProject}
        onRenameProject={handleRenameProject}
        onSelectProject={setActive}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <TopNavbar />

        {/* File Center */}
        <div className="flex-1 overflow-hidden">
          <FileCenter
            assets={assets}
            isLoading={assetsLoading}
            onDeleteAsset={deleteAsset}
            onNavigateToMessage={handleNavigateToMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default Files;

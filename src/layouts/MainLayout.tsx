import { Outlet, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import TopNavbar from "@/components/curve/TopNavbar";
import Sidebar from "@/components/curve/Sidebar";
import SmartFolderPanel from "@/components/curve/SmartFolderPanel";
import { useProjects } from "@/hooks/useProjects";
import { useNavigation } from "@/contexts/NavigationContext";
import { useSmartFolder } from "@/hooks/useSmartFolder";
import { cn } from "@/lib/utils";

// Resizer Component - Draggable Divider
const Resizer = ({ 
  onResize, 
  currentWidth 
}: { 
  onResize: (newWidth: number) => void;
  currentWidth: number;
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const resizerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizerRef.current) return;
      
      // Get the parent container (the flex container)
      const parent = resizerRef.current.parentElement;
      if (!parent) return;
      
      const parentRect = parent.getBoundingClientRect();
      const newWidth = parentRect.right - e.clientX;
      const minWidth = 300;
      const maxWidth = parentRect.width * 0.6;
      const minLeftWidth = 400; // Minimum width for left content
      const maxFolderWidth = parentRect.width - minLeftWidth - 4; // 4px for resizer
      
      // Clamp folder width
      let clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      // Ensure left content doesn't go below minimum
      const leftWidth = parentRect.width - clampedWidth - 4;
      if (leftWidth < minLeftWidth) {
        clampedWidth = parentRect.width - minLeftWidth - 4;
      }
      
      // Also ensure folder doesn't exceed maximum
      if (clampedWidth > maxFolderWidth) {
        clampedWidth = maxFolderWidth;
      }
      
      onResize(clampedWidth);
    },
    [isResizing, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={resizerRef}
      onMouseDown={handleMouseDown}
      className={cn(
        "bg-border cursor-col-resize transition-colors flex-shrink-0 z-10",
        "hover:bg-[rgba(18,58,255,0.3)]",
        isResizing && "bg-[rgba(18,58,255,0.3)]"
      )}
      style={{ width: '3px' }}
    />
  );
};

const MainLayout = () => {
  const location = useLocation();
  const { 
    projects, 
    isLoading, 
    activeProject, 
    createProject, 
    updateProject, 
    deleteProject, 
    setActive 
  } = useProjects();

  const { 
    breadcrumbItems, 
    onShowBranchTree, 
    onShowFileCenter, 
    fileUnreadCount, 
    onNavigateToMessage,
    folderBranchId,
    folderBranchName,
    setFolderBranchId,
    setFolderBranchName,
    setIsFolderOpen: setNavigationFolderOpen,
    setContentWidth,
  } = useNavigation();
  
  // Smart folder state
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [folderWidth, setFolderWidth] = useState(400);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const { 
    tables, 
    images, 
    unreadCount: folderUnreadCount, 
    resetUnreadCount: resetFolderUnreadCount,
    downloadTable,
    downloadImage,
    syncHistoryToFolder,
  } = useSmartFolder({ 
    projectId: activeProject?.id || null,
    branchId: folderBranchId,
    onNewContent: () => {
      // Trigger visual feedback when new content is archived
    },
  });

  // Auto-open folder when branch is selected from branch tree view
  useEffect(() => {
    if (folderBranchId && !isFolderOpen) {
      setIsFolderOpen(true);
      resetFolderUnreadCount();
    }
  }, [folderBranchId, isFolderOpen, resetFolderUnreadCount]);

  // Sync folder open state to NavigationContext
  useEffect(() => {
    setNavigationFolderOpen(isFolderOpen);
  }, [isFolderOpen, setNavigationFolderOpen]);

  // Sync history when folder is first opened or branch changes
  useEffect(() => {
    if (isFolderOpen && activeProject?.id && syncHistoryToFolder) {
      syncHistoryToFolder();
    }
  }, [isFolderOpen, activeProject?.id, folderBranchId, syncHistoryToFolder]);

  // Observe left内容宽度，向 NavigationContext 同步，供子视图自适应
  useEffect(() => {
    if (!contentAreaRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) {
        setContentWidth(Math.floor(width));
      }
    });
    observer.observe(contentAreaRef.current);
    return () => observer.disconnect();
  }, [setContentWidth]);

  // Show sidebar on Project page (Index), Agent, Workflow, and Skills Hub pages
  const showSidebar = ["/", "/agent", "/workflow", "/skills-hub"].includes(location.pathname);
  
  // Show folder on all pages (project, agent, workflow)
  const showFolder = true;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar - extends to top */}
      {showSidebar && (
        <Sidebar 
          projects={projects}
          isLoading={isLoading}
          activeProject={activeProject}
          onCreateProject={createProject}
          onDeleteProject={deleteProject}
          onRenameProject={(id, name) => updateProject(id, { name })}
          onSelectProject={setActive}
        />
      )}
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Top Navigation Bar */}
        <TopNavbar 
          breadcrumbItems={breadcrumbItems}
          onShowBranchTree={onShowBranchTree}
          onShowFileCenter={onShowFileCenter}
          fileUnreadCount={fileUnreadCount}
          projects={projects}
          activeProject={activeProject}
          onSelectProject={setActive}
          onToggleFolder={() => {
            setIsFolderOpen((prev) => {
              if (!prev) {
                resetFolderUnreadCount();
                // Clear branch selection when opening from top navbar
                setFolderBranchId(null);
                setFolderBranchName(null);
              }
              return !prev;
            });
          }}
          folderUnreadCount={folderUnreadCount}
          isFolderOpen={isFolderOpen}
        />
        
        {/* Page Content - Grid Layout for adaptive widths */}
        <div
          className={cn(
            "flex-1 overflow-hidden w-full min-w-0",
            isFolderOpen
              ? "grid grid-rows-1"
              : "grid grid-cols-1"
          )}
          style={
            isFolderOpen
              ? { gridTemplateColumns: `minmax(0,1fr) 3px ${folderWidth}px` }
              : undefined
          }
        >
          {/* Left: Main Content Area */}
          <div
            ref={contentAreaRef}
            className="overflow-hidden min-w-0 transition-all duration-300"
            style={{ minWidth: isFolderOpen ? 360 : undefined }}
          >
            <Outlet context={{ activeProject }} />
          </div>

          {/* Resizer - Draggable Divider */}
          {isFolderOpen && (
            <Resizer
              onResize={(newWidth) => {
                setFolderWidth(newWidth);
              }}
              currentWidth={folderWidth}
            />
          )}

          {/* Right: Smart Folder Panel - Fixed Width */}
          {isFolderOpen && (
            <div 
              className="flex-shrink-0 overflow-hidden transition-all duration-300"
              style={{ width: `${folderWidth}px` }}
            >
              <SmartFolderPanel
                isOpen={isFolderOpen}
                onClose={() => {
                  setIsFolderOpen(false);
                  resetFolderUnreadCount();
                  // Clear branch selection when closing
                  setFolderBranchId(null);
                  setFolderBranchName(null);
                }}
                width={folderWidth}
                tables={tables}
                images={images}
                onDownloadTable={downloadTable}
                onDownloadImage={downloadImage}
                onNavigateToMessage={onNavigateToMessage}
                branchName={folderBranchName}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

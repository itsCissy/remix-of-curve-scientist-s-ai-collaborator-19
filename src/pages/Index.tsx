import { useState, useEffect } from "react";
import Sidebar from "@/components/curve/Sidebar";
import ChatArea from "@/components/curve/ChatArea";
import { useProjects, Project } from "@/hooks/useProjects";

const Index = () => {
  const { 
    projects, 
    isLoading, 
    activeProject, 
    createProject, 
    updateProject, 
    deleteProject, 
    setActive 
  } = useProjects();

  return (
    <>
      <Sidebar 
        projects={projects}
        isLoading={isLoading}
        activeProject={activeProject}
        onCreateProject={createProject}
        onDeleteProject={deleteProject}
        onRenameProject={(id, name) => updateProject(id, { name })}
        onSelectProject={setActive}
      />
      <ChatArea 
        projectId={activeProject?.id || null}
        projectName={activeProject?.name || "New Project"}
      />
    </>
  );
};

export default Index;

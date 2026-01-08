import { useOutletContext } from "react-router-dom";
import ChatArea from "@/components/curve/ChatArea";
import { Project } from "@/hooks/useProjects";

type OutletContext = {
  activeProject: Project | null;
};

const Index = () => {
  const { activeProject } = useOutletContext<OutletContext>();

  return (
    <ChatArea 
      key={activeProject?.id || null}
      projectId={activeProject?.id || null}
      projectName={activeProject?.name || "New Project"}
    />
  );
};

export default Index;

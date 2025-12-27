interface ProjectItemProps {
  icon: string;
  name: string;
  author: string;
  isActive?: boolean;
}

const ProjectItem = ({ icon, name, author, isActive = false }: ProjectItemProps) => {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 group ${
        isActive
          ? "bg-primary/10 text-foreground"
          : "hover:bg-curve-hover text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className="text-base flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm truncate ${isActive ? "font-medium" : ""}`}>
            {name}
          </span>
          <span className="text-xs text-muted-foreground truncate">{author}</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectItem;

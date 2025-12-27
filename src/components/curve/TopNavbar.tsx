import { FolderKanban, Bot, Workflow } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import CurveLogo from "./CurveLogo";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "project", label: "Project", icon: FolderKanban, path: "/" },
  { id: "agent", label: "Agent", icon: Bot, path: "/agent" },
  { id: "workflow", label: "Workflow", icon: Workflow, path: "/workflow" },
];

const TopNavbar = () => {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0">
      {/* Left: Logo */}
      <div className="flex items-center gap-6">
        <CurveLogo />
      </div>

      {/* Center: Navigation Tabs */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-colors hover:text-foreground hover:bg-muted/50"
            activeClassName="text-primary bg-primary/10 hover:text-primary hover:bg-primary/10"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Right: Placeholder for future actions */}
      <div className="w-[100px]" />
    </header>
  );
};

export default TopNavbar;

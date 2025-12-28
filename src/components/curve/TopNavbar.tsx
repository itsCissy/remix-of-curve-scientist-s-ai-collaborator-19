import { FolderKanban, Bot, Workflow, FolderOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import CurveLogo from "./CurveLogo";
import UserAvatar from "./UserAvatar";

interface TopNavbarProps {
  fileUnreadCount?: number;
}

const navItems = [
  { id: "project", label: "Project", icon: FolderKanban, path: "/" },
  { id: "files", label: "Files", icon: FolderOpen, path: "/files" },
  { id: "agent", label: "Agent", icon: Bot, path: "/agent" },
  { id: "workflow", label: "Workflow", icon: Workflow, path: "/workflow" },
];

const TopNavbar = ({ fileUnreadCount = 0 }: TopNavbarProps) => {
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-colors hover:text-foreground hover:bg-muted/50 relative"
            activeClassName="text-primary bg-primary/10 hover:text-primary hover:bg-primary/10"
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
            {item.id === "files" && fileUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full flex items-center justify-center">
                {fileUnreadCount > 99 ? "99+" : fileUnreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Right: User Avatar */}
      <div className="flex items-center">
        <UserAvatar name="程希希" size="sm" showName={false} />
      </div>
    </header>
  );
};

export default TopNavbar;

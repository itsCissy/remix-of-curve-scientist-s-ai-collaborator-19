import { useState } from "react";
import { createPortal } from "react-dom";
import { Bot, Workflow, ScrollText, Settings, Languages, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  isCollapsed?: boolean;
}

const menuItems = [
  { id: "agent", label: "Agent", icon: Bot },
  { id: "workflow", label: "Workflow", icon: Workflow },
  { id: "logs", label: "日志", icon: ScrollText },
  { id: "settings", label: "设置", icon: Settings },
  { id: "language", label: "语言切换", icon: Languages },
];

const UserAvatar = ({ name, size = "md", showName = true, isCollapsed = false }: UserAvatarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ bottom: number; left: number } | null>(null);

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      bottom: window.innerHeight - rect.top + 8,
      left: rect.left,
    });
    setMenuOpen(!menuOpen);
  };

  const handleMenuItemClick = (itemId: string) => {
    console.log(`Clicked: ${itemId}`);
    setMenuOpen(false);
    // TODO: Implement actual functionality for each menu item
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2.5 w-full p-1.5 -m-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-rose-200 to-rose-300 flex items-center justify-center overflow-hidden flex-shrink-0`}
        >
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=chengxixi&backgroundColor=ffd5dc"
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        {showName && !isCollapsed && (
          <span className="text-sm text-foreground font-medium flex-1 text-left">{name}</span>
        )}
        {!isCollapsed && (
          <ChevronUp className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            menuOpen && "rotate-180"
          )} />
        )}
      </button>

      {/* Menu Portal */}
      {menuOpen && menuPosition && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setMenuOpen(false)}
          />
          
          {/* Menu */}
          <div
            style={{
              position: 'fixed',
              bottom: menuPosition.bottom,
              left: menuPosition.left,
              zIndex: 9999,
            }}
            className="min-w-[200px] bg-popover border border-border rounded-lg shadow-xl py-1.5 animate-fade-in"
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default UserAvatar;

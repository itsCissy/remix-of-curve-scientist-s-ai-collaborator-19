import { useState } from "react";
import { createPortal } from "react-dom";
import { ScrollText, Settings, Languages, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  isCollapsed?: boolean;
  showMenu?: boolean;
}

const menuItems = [
  { id: "settings", label: "设置", icon: Settings },
  { id: "logs", label: "日志", icon: ScrollText },
  { id: "language", label: "语言切换", icon: Languages },
];

const UserAvatar = ({ name, size = "md", showName = true, isCollapsed = false, showMenu = true }: UserAvatarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!showMenu) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
    setMenuOpen(!menuOpen);
  };

  const handleMenuItemClick = (itemId: string) => {
    console.log(`Clicked: ${itemId}`);
    setMenuOpen(false);
    // TODO: Implement actual functionality for each menu item
  };

  const handleLogout = () => {
    console.log("Logout clicked");
    setMenuOpen(false);
    // TODO: Implement logout functionality
  };

  // Simple avatar without menu
  if (!showMenu) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-rose-200 to-rose-300 flex items-center justify-center overflow-hidden flex-shrink-0`}
      >
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=chengxixi&backgroundColor=ffd5dc"
          alt={name || "User"}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-rose-200 to-rose-300 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-background`}
        >
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=chengxixi&backgroundColor=ffd5dc"
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        {showName && !isCollapsed && (
          <span className="text-sm text-foreground font-medium">{name}</span>
        )}
        <ChevronDown className={cn(
          "w-3.5 h-3.5 text-muted-foreground transition-transform",
          menuOpen && "rotate-180"
        )} />
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
              top: menuPosition.top,
              right: menuPosition.right,
              zIndex: 9999,
            }}
            className="min-w-[200px] bg-popover border border-border rounded-lg shadow-xl py-1.5 animate-fade-in"
          >
            {/* User Info Header */}
            <div className="px-3 py-2.5 border-b border-border mb-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-200 to-rose-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=chengxixi&backgroundColor=ffd5dc"
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{name}</span>
                  <span className="text-xs text-muted-foreground">chengxixi@example.com</span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
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

            {/* Logout */}
            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default UserAvatar;

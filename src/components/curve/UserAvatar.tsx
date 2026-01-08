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
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null);

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!showMenu) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const menuHeight = 280; // Approximate menu height
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // If there's not enough space below but enough space above, show menu above
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      setMenuPosition({
        bottom: viewportHeight - rect.top + 8,
        // Always align left edge with button's left edge
        left: rect.left,
      });
    } else {
      // Show menu below (default)
      setMenuPosition({
        top: rect.bottom + 8,
        // Always align left edge with button's left edge
        left: rect.left,
      });
    }
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
        className={cn(
          "flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer flex-shrink-0 h-9 w-9 overflow-hidden shadow-sm",
          isCollapsed 
            ? "p-0 border border-border/50 hover:border-xtalpi-blue/50" 
            : "hover:bg-muted/50",
          menuOpen && isCollapsed && "border-xtalpi-blue ring-2 ring-xtalpi-blue/20"
        )}
      >
        {isCollapsed ? (
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=chengxixi&backgroundColor=ffd5dc"
            alt={name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div
            className={cn(
              `${sizeClasses[size]} rounded-full bg-gradient-to-br from-rose-200 to-rose-300 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-background`
            )}
          >
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=chengxixi&backgroundColor=ffd5dc"
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {showName && !isCollapsed && (
          <span className="text-sm text-foreground font-medium flex-1 text-left ml-2">{name}</span>
        )}
        {!isCollapsed && (
          <ChevronDown className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0",
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
              ...(menuPosition.top !== undefined && { top: menuPosition.top }),
              ...(menuPosition.bottom !== undefined && { bottom: menuPosition.bottom }),
              ...(menuPosition.left !== undefined && { left: menuPosition.left }),
              ...(menuPosition.right !== undefined && { right: menuPosition.right }),
              zIndex: 9999,
            }}
            className="min-w-[240px] bg-white/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl overflow-hidden animate-fade-in"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-200 to-rose-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=chengxixi&backgroundColor=ffd5dc"
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-foreground truncate">{name}</span>
                  <span className="text-xs text-muted-foreground truncate mt-0.5">chengxixi@example.com</span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-[#f0f2ff] hover:text-[#123aff] transition-colors text-left group"
                >
                  <item.icon className="w-4 h-4 text-slate-500 group-hover:text-[#123aff] flex-shrink-0 transition-colors" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Logout */}
            <div className="border-t border-border pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-[#f0f2ff] hover:text-[#123aff] transition-colors text-left group"
              >
                <LogOut className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-[#123aff] transition-colors" />
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

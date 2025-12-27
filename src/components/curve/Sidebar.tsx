import { Clock, RefreshCw, SquarePen, Smartphone } from "lucide-react";
import CurveLogo from "./CurveLogo";
import ProjectItem from "./ProjectItem";
import UserAvatar from "./UserAvatar";

const projects = [
  { icon: "📋", name: "test", author: "程希希", isActive: true },
  { icon: "📋", name: "Tool Test 251226", author: "xinos" },
  { icon: "📋", name: "HTE&VAST TEST_PY", author: "张佩宇" },
  { icon: "📋", name: "筛选测试", author: "谈绿" },
  { icon: "📋", name: "筛选测试", author: "谈绿" },
  { icon: "📋", name: "VAST TEST 4", author: "严泽伊" },
  { icon: "🎯", name: "VAST TEST 3", author: "王兆伦" },
  { icon: "😊", name: "VAST TEST 2", author: "王兆伦" },
  { icon: "🐷", name: "VAST TEST", author: "王兆伦" },
  { icon: "📋", name: "test", author: "canyang.liu" },
  { icon: "📦", name: "HTE tool test", author: "xinos" },
  { icon: "🚀", name: "数据协议", author: "熊智" },
  { icon: "💜", name: "测试 LangGhain", author: "黄金丽" },
  { icon: "✏️", name: "测试", author: "yansen.lei" },
  { icon: "💜", name: "TEST Cal Agent", author: "黄金丽" },
];

const Sidebar = () => {
  return (
    <div className="w-[280px] h-screen bg-card border-r border-curve-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <CurveLogo />
        <button className="p-2 rounded-lg hover:bg-curve-hover transition-colors text-muted-foreground hover:text-foreground">
          <Smartphone className="w-4 h-4" />
        </button>
      </div>

      {/* New Project Button */}
      <div className="px-3 mb-2">
        <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium text-sm shadow-sm">
          <SquarePen className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* History Section */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span>History</span>
          </div>
          <button className="p-1 rounded hover:bg-curve-hover transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto px-2 scrollbar-thin">
        <div className="space-y-0.5">
          {projects.map((project, index) => (
            <ProjectItem
              key={index}
              icon={project.icon}
              name={project.name}
              author={project.author}
              isActive={project.isActive}
            />
          ))}
        </div>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-curve-sidebar-border">
        <UserAvatar name="程希希" />
      </div>
    </div>
  );
};

export default Sidebar;

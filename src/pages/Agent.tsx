import { Bot, Plus, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Agent = () => {
  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Agent</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              创建和管理你的智能代理
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            创建 Agent
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            开始创建你的第一个 Agent
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Agent 是能够自主执行任务的智能助手，你可以自定义它的能力、知识库和行为方式。
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" />
              从模板创建
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              空白创建
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agent;

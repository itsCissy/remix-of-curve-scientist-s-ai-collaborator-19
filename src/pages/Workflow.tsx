import { Workflow as WorkflowIcon, Plus, Play, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";

const Workflow = () => {
  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Workflow</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              设计和编排你的自动化工作流
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            创建 Workflow
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <WorkflowIcon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            创建你的第一个工作流
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            通过可视化的方式编排复杂的自动化任务，连接多个 Agent 和工具来完成复杂的工作流程。
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" className="gap-2">
              <FileCode className="w-4 h-4" />
              导入工作流
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              新建工作流
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workflow;

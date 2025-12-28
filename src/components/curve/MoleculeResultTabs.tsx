import { useState } from "react";
import { cn } from "@/lib/utils";
import { TableIcon, LayoutGrid, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MoleculeDataTable from "./MoleculeDataTable";
import MoleculeGridView from "./MoleculeGridView";
import MoleculeDistributionChart from "./MoleculeDistributionChart";
import { MoleculeData } from "@/lib/moleculeDataUtils";

interface MoleculeResultTabsProps {
  data: MoleculeData[];
  className?: string;
  maxHeight?: number;
  description?: string;
}

const MoleculeResultTabs = ({ 
  data, 
  className,
  maxHeight = 450,
  description
}: MoleculeResultTabsProps) => {
  const [activeTab, setActiveTab] = useState("table");

  if (data.length === 0) {
    return null;
  }

  return (
    <div className={cn("mt-4 rounded-lg border border-border bg-card overflow-hidden", className)}>
      {/* Description header */}
      {description && (
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
          <TabsList className="h-9 bg-muted/50">
            <TabsTrigger 
              value="table" 
              className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <TableIcon className="w-3.5 h-3.5 mr-1.5" />
              数据表格
            </TabsTrigger>
            <TabsTrigger 
              value="grid" 
              className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
              结构矩阵
            </TabsTrigger>
            <TabsTrigger 
              value="chart" 
              className="h-7 px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              属性分布
            </TabsTrigger>
          </TabsList>
          
          <div className="text-xs text-muted-foreground">
            {data.length} 个分子
          </div>
        </div>

        <div className="p-4">
          <TabsContent value="table" className="mt-0">
            <MoleculeDataTable 
              data={data} 
              maxHeight={maxHeight - 80}
            />
          </TabsContent>
          
          <TabsContent value="grid" className="mt-0">
            <MoleculeGridView 
              data={data} 
              maxHeight={maxHeight - 80}
            />
          </TabsContent>
          
          <TabsContent value="chart" className="mt-0">
            <MoleculeDistributionChart data={data} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default MoleculeResultTabs;

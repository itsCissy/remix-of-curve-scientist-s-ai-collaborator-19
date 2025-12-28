import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Copy, Check, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import MoleculeStructure from "./MoleculeStructure";
import { MoleculeData } from "@/lib/moleculeDataUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MoleculeGridViewProps {
  data: MoleculeData[];
  className?: string;
  maxHeight?: number;
  pageSize?: number;
}

const MoleculeGridView = ({ 
  data, 
  className,
  maxHeight = 400,
  pageSize = 12
}: MoleculeGridViewProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalPages = Math.ceil(data.length / pageSize);

  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  const handleCopySmiles = useCallback(async (smiles: string, id: string) => {
    try {
      await navigator.clipboard.writeText(smiles);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    const columns = ['id', 'smiles', 'similarity', 'mw', 'logp'];
    const headers = columns.join(',');
    const rows = data.map(item => 
      columns.map(col => {
        const val = item[col];
        if (val === undefined || val === null) return '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return String(val);
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `molecules_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  const formatValue = (value: unknown, key: string) => {
    if (value === undefined || value === null) return '-';
    
    if (key === 'similarity' && typeof value === 'number') {
      return `${(value * 100).toFixed(1)}%`;
    }
    
    if (typeof value === 'number') {
      return value % 1 === 0 ? value : value.toFixed(2);
    }
    
    return String(value);
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
        暂无分子数据
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("space-y-3", className)}>
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-sm text-muted-foreground">
            共 <span className="font-medium text-foreground">{data.length}</span> 个分子
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            导出 CSV
          </Button>
        </div>

        {/* Grid */}
        <div 
          className="overflow-auto"
          style={{ maxHeight }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {paginatedData.map((item, index) => {
              const itemId = item.id || String(index);
              const isCopied = copiedId === itemId;
              
              return (
                <div
                  key={itemId}
                  className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-md transition-all duration-200"
                >
                  {/* Structure */}
                  <div className="p-2 bg-muted/30">
                    {item.smiles ? (
                      <MoleculeStructure 
                        smiles={item.smiles} 
                        size={120}
                        className="mx-auto"
                        compact
                      />
                    ) : (
                      <div className="w-[120px] h-[120px] mx-auto flex items-center justify-center text-muted-foreground text-xs">
                        无结构
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2 space-y-1.5">
                    {/* ID */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground truncate">
                        {item.id || `#${index + 1}`}
                      </span>
                      {item.smiles && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleCopySmiles(item.smiles!, itemId)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-muted-foreground" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            复制 SMILES
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Key metrics */}
                    <div className="flex flex-wrap gap-1">
                      {item.similarity !== undefined && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-medium">
                          相似度: {formatValue(item.similarity, 'similarity')}
                        </span>
                      )}
                      {item.mw !== undefined && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium">
                          MW: {formatValue(item.mw, 'mw')}
                        </span>
                      )}
                      {item.logp !== undefined && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                          LogP: {formatValue(item.logp, 'logp')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              第 {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, data.length)} 条，共 {data.length} 条
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2 text-muted-foreground">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default MoleculeGridView;

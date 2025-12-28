import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Copy, 
  Check,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MoleculeStructure from "./MoleculeStructure";
import { MoleculeData } from "@/lib/moleculeDataUtils";

interface MoleculeDataTableProps {
  data: MoleculeData[];
  className?: string;
  maxHeight?: number;
  pageSize?: number;
}

type SortDirection = "asc" | "desc" | null;
type SortField = keyof MoleculeData | null;

const MoleculeDataTable = ({ 
  data, 
  className,
  maxHeight = 400,
  pageSize = 20
}: MoleculeDataTableProps) => {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Get all available columns from data
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    
    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });
    
    // Priority order for columns
    const priorityOrder = ['id', 'smiles', 'similarity', 'mw', 'logp', 'hbd', 'hba', 'tpsa', 'rotatable_bonds'];
    const sortedKeys = Array.from(allKeys).sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.toLowerCase());
      const bIndex = priorityOrder.indexOf(b.toLowerCase());
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
    
    return sortedKeys;
  }, [data]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr) 
        : bStr.localeCompare(aStr);
    });
  }, [data, sortField, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field as SortField);
      setSortDirection('asc');
    }
    setCurrentPage(0);
  }, [sortField, sortDirection]);

  const handleExportCSV = useCallback(() => {
    const headers = columns.join(',');
    const rows = sortedData.map(item => 
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
  }, [columns, sortedData]);

  const handleCopySmiles = useCallback(async () => {
    const smilesList = sortedData
      .map(item => item.smiles)
      .filter(Boolean)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(smilesList);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [sortedData]);

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-primary" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  };

  const formatColumnName = (col: string) => {
    const nameMap: Record<string, string> = {
      'id': 'ID',
      'smiles': 'SMILES',
      'similarity': '相似度',
      'mw': '分子量',
      'logp': 'LogP',
      'hbd': 'HBD',
      'hba': 'HBA',
      'tpsa': 'TPSA',
      'rotatable_bonds': '可旋转键',
      'structure': '结构'
    };
    return nameMap[col.toLowerCase()] || col.charAt(0).toUpperCase() + col.slice(1);
  };

  const formatValue = (value: unknown, column: string) => {
    if (value === undefined || value === null) return '-';
    
    if (column.toLowerCase() === 'similarity' && typeof value === 'number') {
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
    <div className={cn("space-y-3", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm text-muted-foreground">
          共 <span className="font-medium text-foreground">{data.length}</span> 个分子
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySmiles}
            className="h-8 text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                复制 SMILES
              </>
            )}
          </Button>
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
      </div>

      {/* Table */}
      <div 
        className="border border-border rounded-lg overflow-hidden"
        style={{ maxHeight }}
      >
        <div className="overflow-auto" style={{ maxHeight: maxHeight - 2 }}>
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <TableRow className="hover:bg-transparent">
                {/* Structure column */}
                <TableHead className="w-[100px] text-center">
                  结构
                </TableHead>
                {columns.filter(col => col.toLowerCase() !== 'smiles').map((col) => (
                  <TableHead 
                    key={col}
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{formatColumnName(col)}</span>
                      {getSortIcon(col)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => (
                <TableRow 
                  key={item.id || index}
                  className="group"
                >
                  {/* Structure cell */}
                  <TableCell className="p-2">
                    {item.smiles && (
                      <MoleculeStructure 
                        smiles={item.smiles} 
                        size={80}
                        compact
                      />
                    )}
                  </TableCell>
                  {columns.filter(col => col.toLowerCase() !== 'smiles').map((col) => (
                    <TableCell key={col} className="text-sm">
                      {formatValue(item[col], col)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            第 {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, sortedData.length)} 条，共 {sortedData.length} 条
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
  );
};

export default MoleculeDataTable;

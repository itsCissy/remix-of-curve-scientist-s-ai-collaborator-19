import { useRef, useMemo } from "react";
import { X, Download, FileSpreadsheet, Image as ImageIcon, ChevronRight, ExternalLink, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseCSVData, MoleculeData } from "@/lib/moleculeDataUtils";
import SmilesHighlight from "./SmilesHighlight";

export interface ArchivedTable {
  id: string;
  title: string;
  content: string; // CSV or markdown table content
  timestamp: Date;
  messageId?: string;
}

export interface ArchivedImage {
  id: string;
  title: string;
  url: string;
  type: "structure" | "chart" | "other";
  timestamp: Date;
  messageId?: string;
}

interface SmartFolderPanelProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  tables: ArchivedTable[];
  images: ArchivedImage[];
  onDownloadTable: (table: ArchivedTable) => void;
  onDownloadImage: (image: ArchivedImage) => void;
  onNavigateToMessage?: (messageId: string) => void;
  branchName?: string | null;
}

// Parse table content to structured data
const parseTableContent = (content: string): MoleculeData[] => {
  try {
    // Try parsing as CSV first
    const csvData = parseCSVData(content);
    if (csvData.length > 0) {
      return csvData;
    }
    
    // Try parsing markdown table format
    const lines = content.trim().split('\n');
    if (lines.length < 3) return [];
    
    // Find table lines (lines starting with |)
    const tableLines = lines.filter(line => line.trim().startsWith('|'));
    if (tableLines.length < 3) return [];
    
    // Parse header
    const headerLine = tableLines[0];
    const headers = headerLine
      .split('|')
      .filter(cell => cell.trim())
      .map(cell => cell.trim().toLowerCase());
    
    // Skip separator line and parse data
    const molecules: MoleculeData[] = [];
    
    for (let i = 2; i < tableLines.length; i++) {
      const line = tableLines[i];
      const values = line
        .split('|')
        .filter(cell => cell.trim())
        .map(cell => cell.trim());
      
      const molecule: MoleculeData = {};
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (value === undefined || value === '') return;
        
        // Clean up backticks and SMILES tags
        const cleanValue = value.replace(/`/g, '').replace(/<smiles[^>]*>([^<]+)<\/smiles>/gi, '$1');
        
        // Try to parse as number
        const numericFields = ['similarity', 'mw', 'logp', 'hbd', 'hba', 'tpsa', 'rotatable_bonds', 'molecular_weight'];
        if (numericFields.includes(header)) {
          const numStr = cleanValue.replace('%', '');
          const num = parseFloat(numStr);
          if (!isNaN(num)) {
            molecule[header] = cleanValue.includes('%') ? num / 100 : num;
            return;
          }
        }
        
        molecule[header] = cleanValue;
      });
      
      if (Object.keys(molecule).length > 0) {
        molecules.push(molecule);
      }
    }
    
    return molecules;
  } catch (error) {
    console.warn("Failed to parse table content:", error);
    return [];
  }
};

// Render table with proper styling
const FolderTable = ({ 
  data, 
  title 
}: { 
  data: MoleculeData[];
  title: string;
}) => {
  if (data.length === 0) return null;

  // Get all column keys and reorder them
  const allKeys = useMemo(() => {
    const keys = new Set<string>();
    data.forEach(item => Object.keys(item).forEach(key => keys.add(key)));
    
    // Priority order - ID first, then Name, then SMILES, then others
    const priority = ['id', 'chembl_id', 'molecule_name', 'name', 'smiles'];
    const sortedKeys = Array.from(keys).sort((a, b) => {
      const aIdx = priority.findIndex(p => a.toLowerCase().includes(p));
      const bIdx = priority.findIndex(p => b.toLowerCase().includes(p));
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });
    return sortedKeys;
  }, [data]);

  const formatHeader = (key: string) => {
    const nameMap: Record<string, string> = {
      'chembl_id': 'ChEMBL_ID',
      'molecule_name': 'Molecule_Name',
      'smiles': 'SMILES',
      'similarity': 'Similarity',
      'tanimoto_similarity': 'Tanimoto_Similarity',
      'mw': 'MW',
      'molecular_weight': 'Molecular_Weight',
      'logp': 'LogP',
      'hbd': 'HBD',
      'hba': 'HBA',
      'reported_target': 'Reported_Target',
      'reported_target_id': 'Reported_Target_ID',
    };
    return nameMap[key.toLowerCase()] || key;
  };

  const isSmilesColumn = (key: string) => {
    return key.toLowerCase() === 'smiles';
  };

  const isIdColumn = (key: string) => {
    const idColumns = ['id', 'chembl_id', 'target_id', 'reported_target_id'];
    return idColumns.some(col => key.toLowerCase() === col || key.toLowerCase().endsWith('_id'));
  };

  const getColumnMinWidth = (key: string) => {
    if (isSmilesColumn(key)) return 'min-w-[300px]';
    if (isIdColumn(key)) return 'min-w-[120px]';
    if (key.toLowerCase().includes('name') || key.toLowerCase().includes('target')) return 'min-w-[180px]';
    return 'min-w-[100px]';
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border shadow-sm relative">
      <div className="min-w-full inline-block">
        <table className="table-auto border-collapse text-sm w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-20 shadow-sm">
            <tr>
              {allKeys.map((key) => (
                <th 
                  key={key} 
                  className={cn(
                    "px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap",
                    "border-b-2 border-r border-border",
                    "last:border-r-0",
                    getColumnMinWidth(key)
                  )}
                >
                  {formatHeader(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr 
                key={idx} 
                className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors border-b border-border"
              >
                {allKeys.map((key) => (
                  <td 
                    key={key} 
                    className={cn(
                      "px-4 py-3 text-left text-foreground",
                      "border-r border-border",
                      "last:border-r-0",
                      getColumnMinWidth(key),
                      isIdColumn(key) && "whitespace-nowrap font-medium"
                    )}
                  >
                    {isSmilesColumn(key) && row[key] ? (
                      <div className="max-w-[400px]">
                        <SmilesHighlight smiles={String(row[key])} />
                      </div>
                    ) : (
                      <span 
                        className={cn(
                          key.toLowerCase().includes('name') || key.toLowerCase().includes('target') 
                            ? "block truncate max-w-[250px]" 
                            : ""
                        )}
                        title={String(row[key] ?? '')}
                      >
                        {row[key] ?? '-'}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SmartFolderPanel = ({
  isOpen,
  onClose,
  width,
  tables,
  images,
  onDownloadTable,
  onDownloadImage,
  onNavigateToMessage,
  branchName,
}: SmartFolderPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="h-full bg-slate-50 border-l border-border flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300"
      style={{ width: `${width}px` }}
    >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" style={{ color: '#52525b' }} />
            <h2 className="text-sm font-semibold" style={{ color: '#123aff' }}>
              智能文件夹{branchName ? ` - ${branchName}` : ''}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            title="关闭文件夹"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-4 space-y-6 min-w-0 w-full">
            {/* Tables Section */}
            {tables.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" style={{ color: '#123aff' }} />
                    对比表格 ({tables.length})
                  </h3>
                </div>
                <div className="space-y-4">
                  {tables.map((table) => {
                    const parsedData = parseTableContent(table.content);
                    return (
                      <div
                        key={table.id}
                        className="group relative bg-white rounded-lg border border-border hover:border-[#123aff]/50 hover:shadow-sm transition-all min-w-0 w-full"
                      >
                        {/* Table Header */}
                        <div className="flex items-start justify-between gap-2 p-3 border-b border-border bg-slate-50/50">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-foreground truncate mb-1">
                              {table.title || "未命名表格"}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {table.timestamp.toLocaleString("zh-CN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })} · {parsedData.length} 行
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            {table.messageId && onNavigateToMessage && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToMessage(table.messageId!);
                                }}
                                className="h-7 w-7 p-0"
                                title="跳转到消息"
                              >
                                <ExternalLink className="w-3.5 h-3.5" style={{ color: '#123aff' }} />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDownloadTable(table);
                              }}
                              className="h-7 w-7 p-0"
                              title="下载 CSV"
                            >
                              <Download className="w-4 h-4" style={{ color: '#123aff' }} />
                            </Button>
                          </div>
                        </div>
                        {/* Table Content */}
                        <div className="p-3 w-full overflow-x-auto max-h-[400px] overflow-y-auto relative">
                          {parsedData.length > 0 ? (
                            <div className="w-full min-w-0">
                              <FolderTable data={parsedData} title={table.title} />
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground p-4 text-center">
                              无法解析表格数据
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Images Section */}
            {images.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" style={{ color: '#123aff' }} />
                    结构图表 ({images.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="group relative w-full bg-slate-50 rounded-lg border border-slate-200 hover:border-[#123aff]/50 hover:shadow-sm transition-all overflow-hidden cursor-pointer min-w-0"
                      style={{ 
                        aspectRatio: '1 / 1',
                        maxHeight: '280px'
                      }}
                      onClick={() => {
                        if (image.messageId && onNavigateToMessage) {
                          onNavigateToMessage(image.messageId);
                        }
                      }}
                    >
                      {image.type === "chart" && image.url.startsWith("data:application/json") ? (
                        <div className="w-full h-full flex items-center justify-center p-2 bg-gradient-to-br from-[#123aff]/5 to-[#123aff]/10">
                          <div className="text-center">
                            <BarChart3 className="w-10 h-10 mx-auto mb-1.5" style={{ color: '#123aff' }} />
                            <p className="text-xs font-medium text-foreground">{image.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">点击查看详情</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2 bg-slate-50">
                          <img
                            src={image.url}
                            alt={image.title}
                            className="w-full h-full object-contain"
                            style={{ 
                              objectFit: 'contain',
                              maxWidth: '100%',
                              maxHeight: '100%'
                            }}
                          />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-[#123aff]/5 transition-colors pointer-events-none" />
                      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
                        {image.messageId && onNavigateToMessage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 bg-white/95 hover:bg-white shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToMessage(image.messageId!);
                            }}
                            title="跳转到消息"
                          >
                            <ExternalLink className="w-3 h-3" style={{ color: '#123aff' }} />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 bg-white/95 hover:bg-white shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadImage(image);
                          }}
                          title="下载图片"
                        >
                          <Download className="w-3 h-3" style={{ color: '#123aff' }} />
                        </Button>
                      </div>
                      {/* Bottom label - always visible */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                        <p className="text-xs text-white truncate font-medium drop-shadow-sm">{image.title || "未命名图片"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {tables.length === 0 && images.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileSpreadsheet className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">暂无归档内容</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Agent 生成的表格和图表将自动归档到这里
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
    </div>
  );
};

export default SmartFolderPanel;


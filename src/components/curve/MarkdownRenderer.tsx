import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState, useCallback, ReactNode, Fragment, useMemo, useEffect, useRef } from "react";
import React from "react";
import { cn } from "@/lib/utils";
import SmilesHighlight, { isValidSmiles } from "./SmilesHighlight";
import { parseCSVData, MoleculeData } from "@/lib/moleculeDataUtils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const CopyButton = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 opacity-0 group-hover:opacity-100"
      title="复制代码"
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
};

// Check if CSV content contains molecule data
const isMoleculeCSV = (content: string): boolean => {
  const firstLine = content.split('\n')[0].toLowerCase();
  const moleculeHeaders = ['smiles', 'chembl', 'id', 'similarity', 'mw', 'molecular_weight', 'logp', 'molecule'];
  return moleculeHeaders.some(h => firstLine.includes(h));
};

// Archive animation component
const ArchiveAnimation = ({ tableRef }: { tableRef: React.RefObject<HTMLDivElement> }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const folderIconRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!tableRef.current) return;

    // 查找文件夹图标
    const findFolderIcon = () => {
      const folderButton = document.querySelector('[data-folder-icon]') as HTMLElement;
      return folderButton?.querySelector('svg') as HTMLElement;
    };

    const triggerAnimation = () => {
      setIsAnimating(true);
      folderIconRef.current = findFolderIcon();

      // 创建飞入的像素点
      const pixel = document.createElement('div');
      pixel.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: #123aff;
        border-radius: 50%;
        z-index: 9999;
        pointer-events: none;
      `;

        const tableRect = tableRef.current!.getBoundingClientRect();
        // 校准为无框表格的右上角
        const startX = tableRect.right - 10;
        const startY = tableRect.top + 10;

      if (folderIconRef.current) {
        const folderRect = folderIconRef.current.getBoundingClientRect();
        const endX = folderRect.left + folderRect.width / 2;
        const endY = folderRect.top + folderRect.height / 2;

        pixel.style.left = `${startX}px`;
        pixel.style.top = `${startY}px`;
        document.body.appendChild(pixel);

        // 抛物线动画
        const duration = 800;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // 抛物线路径
          const currentX = startX + (endX - startX) * progress;
          const currentY = startY + (endY - startY) * progress - 100 * Math.sin(progress * Math.PI);

          pixel.style.left = `${currentX}px`;
          pixel.style.top = `${currentY}px`;
          pixel.style.opacity = String(1 - progress);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            pixel.remove();
            // 激活文件夹图标
            if (folderIconRef.current) {
              folderIconRef.current.style.color = '#123aff';
              const button = folderIconRef.current.closest('button');
              if (button) {
                button.style.color = '#123aff';
                button.style.backgroundColor = 'rgba(18, 58, 255, 0.08)';
                button.classList.add('animate-ping');
                setTimeout(() => {
                  button.classList.remove('animate-ping');
                  button.classList.add('animate-pulse');
                }, 1000);
              }
            }
            setIsAnimating(false);
          }
        };

        requestAnimationFrame(animate);
      }
    };

    // 延迟触发动画，确保表格已渲染
    const timer = setTimeout(triggerAnimation, 300);
    return () => clearTimeout(timer);
  }, [tableRef]);

  return null;
};

// Simple CSV Table component
interface CSVTableProps {
  data: MoleculeData[];
}

const CSVTable = ({ data }: CSVTableProps) => {
  const tableRef = useRef<HTMLDivElement>(null);

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

  // Check if SMILES column
  const isSmilesColumn = (key: string) => {
    return key.toLowerCase() === 'smiles';
  };

  // Check if column should not wrap (ID columns)
  const isIdColumn = (key: string) => {
    const idColumns = ['id', 'chembl_id', 'target_id', 'reported_target_id'];
    return idColumns.some(col => key.toLowerCase() === col || key.toLowerCase().endsWith('_id'));
  };

  // Get column min-width based on type
  const getColumnMinWidth = (key: string) => {
    if (isSmilesColumn(key)) return 'min-w-[300px]';
    if (isIdColumn(key)) return 'min-w-[120px]';
    if (key.toLowerCase().includes('name') || key.toLowerCase().includes('target')) return 'min-w-[180px]';
    return 'min-w-[100px]';
  };

  return (
    <>
      <ArchiveAnimation tableRef={tableRef} />
      <div ref={tableRef} className="my-4 w-full overflow-x-auto">
        <table className="table-auto border-collapse text-sm min-w-[1200px]">
        <thead className="bg-slate-50 dark:bg-slate-800/80">
          <tr>
            {allKeys.map((key) => (
              <th 
                key={key} 
                className={cn(
                  "px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap",
                  "border-b border-slate-200 dark:border-slate-700",
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
              className={cn(
                "hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors border-b border-slate-200 dark:border-slate-700",
                idx % 2 === 0 && "bg-[#f8fafc] dark:bg-slate-900/50"
              )}
            >
              {allKeys.map((key) => (
                <td 
                  key={key} 
                  className={cn(
                    "px-4 py-3 text-left text-foreground",
                    "border-b border-slate-200 dark:border-slate-700",
                    getColumnMinWidth(key),
                    isIdColumn(key) && "whitespace-nowrap font-medium"
                  )}
                >
                  {isSmilesColumn(key) ? (
                    <span 
                      className="block font-mono text-xs text-muted-foreground truncate max-w-[400px]"
                      title={String(row[key] ?? '')}
                    >
                      {row[key] ?? '-'}
                    </span>
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
    </>
  );
};

// 处理文本中的 SMILES 字符串
const processTextWithSmiles = (text: string): ReactNode => {
  // 匹配反引号包裹的内容
  const backtickPattern = /`([^`]+)`/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = backtickPattern.exec(text)) !== null) {
    // 添加匹配前的普通文本
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const candidate = match[1];
    if (isValidSmiles(candidate)) {
      // 是 SMILES，使用高亮组件
      parts.push(<SmilesHighlight key={`smiles-${keyIndex++}`} smiles={candidate} />);
    } else {
      // 不是 SMILES，保持原样显示为行内代码
      parts.push(
        <code key={`code-${keyIndex++}`} className="px-1.5 py-0.5 rounded-md bg-muted text-foreground font-mono text-sm">
          {candidate}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? <Fragment>{parts}</Fragment> : text;
};

const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            const isInline = !match && !String(children).includes("\n");
            
            if (match) {
              // 检查是否是 SMILES 语言标记
              if (match[1] === "smiles" && isValidSmiles(codeString)) {
                return <SmilesHighlight smiles={codeString} />;
              }
              
              // 检查是否是 CSV 分子数据，如果是则渲染为表格
              if ((match[1] === "csv" || match[1] === "text") && isMoleculeCSV(codeString)) {
                const moleculeData = parseCSVData(codeString);
                if (moleculeData.length > 0) {
                  return <CSVTable data={moleculeData} />;
                }
              }
              
              return (
                <div className="group relative my-3 rounded-lg overflow-hidden border border-border/50">
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {match[1]}
                    </span>
                  </div>
                  <CopyButton code={codeString} />
                  <SyntaxHighlighter
                    style={isDark ? oneDark : oneLight}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      background: "transparent",
                      fontSize: "0.875rem",
                      lineHeight: "1.5",
                    }}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }

            if (isInline) {
              // 检查行内代码是否是 SMILES
              if (isValidSmiles(codeString)) {
                return <SmilesHighlight smiles={codeString} />;
              }
              
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-muted text-foreground font-mono text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // 检查无语言标记的代码块是否是 CSV 分子数据
            if (isMoleculeCSV(codeString)) {
              const moleculeData = parseCSVData(codeString);
              if (moleculeData.length > 0) {
                return <CSVTable data={moleculeData} />;
              }
            }

            return (
              <code
                className="block px-4 py-3 rounded-lg bg-muted text-foreground font-mono text-sm overflow-x-auto"
                {...props}
              >
                {children}
              </code>
            );
          },
          // 处理普通文本中的 SMILES
          text({ children }) {
            if (typeof children === "string") {
              return <>{processTextWithSmiles(children)}</>;
            }
            return <>{children}</>;
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-slate-50 dark:bg-slate-800/80">{children}</thead>;
          },
          th({ children }) {
            return (
              <th className="px-4 py-2.5 text-left font-semibold text-foreground border-b-2 border-slate-200 dark:border-slate-700">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-2.5 text-foreground border-b border-slate-200 dark:border-slate-700">
                {children}
              </td>
            );
          },
          tr({ children }) {
            // 斑马纹通过 CSS nth-child 实现
            return (
              <tr className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors [&:nth-child(even)]:bg-[#f8fafc] dark:[&:nth-child(even)]:bg-slate-900/50">
                {children}
              </tr>
            );
          },
          ul({ children }) {
            return <ul className="my-2 ml-4 list-disc space-y-1.5 marker:text-primary">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-2 ml-4 list-decimal space-y-1.5 marker:text-primary">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-foreground leading-relaxed pl-1">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold mt-6 mb-3 text-foreground">{children}</h1>;
          },
          h2({ children }) {
            return (
              <h2 className="text-lg font-semibold mt-5 mb-2 text-foreground pl-3 border-l-4" style={{ borderColor: '#123aff' }}>
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>;
          },
          p({ children }) {
            // 处理文本中的分子关键词高亮
            const processText = (text: string) => {
              const keywords = ['MW', 'SMILES', 'LogP', 'HBD', 'HBA', 'TPSA', 'Molecular Weight', 'molecular weight'];
              let processed = text;
              keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                processed = processed.replace(regex, `<strong style="color: #123aff; font-weight: 600;">${keyword}</strong>`);
              });
              return processed;
            };
            
            if (typeof children === 'string') {
              return <p className="my-2 leading-relaxed text-foreground" dangerouslySetInnerHTML={{ __html: processText(children) }} />;
            }
            return <p className="my-2 leading-relaxed text-foreground">{children}</p>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 pl-4 border-l-4 border-primary/50 bg-muted/30 py-2 pr-4 rounded-r-lg italic text-muted-foreground">
                {children}
              </blockquote>
            );
          },
          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline underline-offset-2"
              >
                {children}
              </a>
            );
          },
          hr() {
            return <hr className="my-4 border-border/50" />;
          },
          strong({ children }) {
            return <strong className="font-semibold text-foreground">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

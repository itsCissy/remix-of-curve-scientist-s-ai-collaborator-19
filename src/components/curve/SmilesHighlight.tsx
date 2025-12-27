import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Copy, Check, Loader2 } from "lucide-react";

interface SmilesHighlightProps {
  smiles: string;
  className?: string;
}

// 使用 PubChem API 获取分子结构图
const getMoleculeImageUrl = (smiles: string) => {
  const encodedSmiles = encodeURIComponent(smiles);
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/PNG?image_size=300x300`;
};

const SmilesHighlight = ({ smiles, className }: SmilesHighlightProps) => {
  const [showPopover, setShowPopover] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowPopover(true);
    setImageLoading(true);
    setImageError(false);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowPopover(false);
    }, 200);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(smiles);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <span className="relative inline-block">
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md cursor-pointer transition-all duration-200",
          "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20",
          "hover:bg-violet-500/20 hover:border-violet-500/40",
          "font-mono text-sm",
          className
        )}
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="8" cy="8" r="3" />
          <circle cx="16" cy="8" r="3" />
          <circle cx="12" cy="16" r="3" />
          <line x1="10.5" y1="9.5" x2="13.5" y2="14.5" />
          <line x1="13.5" y1="9.5" x2="10.5" y2="14.5" />
        </svg>
        <span className="truncate max-w-[200px]">{smiles}</span>
        <button
          onClick={handleCopy}
          className="ml-0.5 p-0.5 rounded hover:bg-violet-500/20 transition-colors"
          title="复制 SMILES"
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
      </span>

      {/* Molecule structure popover */}
      {showPopover && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "absolute z-50 left-0 top-full mt-2",
            "bg-card border border-border rounded-lg shadow-xl",
            "p-3 animate-fade-in",
            "min-w-[240px]"
          )}
        >
          <div className="text-xs font-medium text-muted-foreground mb-2">
            分子结构预览
          </div>
          
          <div className="relative bg-white dark:bg-gray-100 rounded-md overflow-hidden aspect-square w-[220px]">
            {imageLoading && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            )}
            
            {imageError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-xs p-4 text-center">
                <svg className="w-8 h-8 mb-2 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="3" />
                  <circle cx="16" cy="8" r="3" />
                  <circle cx="12" cy="16" r="3" />
                  <line x1="10.5" y1="9.5" x2="13.5" y2="14.5" />
                  <line x1="13.5" y1="9.5" x2="10.5" y2="14.5" />
                </svg>
                <span>无法加载分子结构</span>
                <span className="text-muted-foreground/70 mt-1">请检查SMILES格式</span>
              </div>
            ) : (
              <img
                src={getMoleculeImageUrl(smiles)}
                alt={`Molecule structure: ${smiles}`}
                className={cn(
                  "w-full h-full object-contain",
                  imageLoading ? "opacity-0" : "opacity-100",
                  "transition-opacity duration-200"
                )}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            )}
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground font-mono break-all bg-muted/50 rounded px-2 py-1">
            {smiles}
          </div>
        </div>
      )}
    </span>
  );
};

// SMILES 模式匹配正则表达式
// 匹配常见的 SMILES 格式：包含原子符号、括号、数字、=、#、@、+、-等
export const SMILES_PATTERN = /(?<![a-zA-Z])(?:[A-Z][a-z]?(?:\[[^\]]+\])?(?:[=#@+\-]?\d?)*(?:\([^)]+\))?)+(?:[=#@+\-]?\d?)*(?![a-zA-Z])/g;

// 更严格的 SMILES 验证
export const isValidSmiles = (text: string): boolean => {
  // 基本长度检查
  if (text.length < 2 || text.length > 500) return false;
  
  // 必须包含至少一个有机原子符号
  const organicAtoms = /[CNOPSFIBcnops]/;
  if (!organicAtoms.test(text)) return false;
  
  // 不应该是普通单词 - 排除全小写或全大写的短文本
  if (text.length < 6 && /^[a-z]+$/.test(text)) return false;
  if (text.length < 4 && /^[A-Z]+$/.test(text)) return false;
  
  // 包含 SMILES 特征字符
  const smilesFeatures = /[=#@\[\]()0-9]/;
  const hasFeatures = smilesFeatures.test(text);
  
  // 包含多个连续的原子符号
  const multipleAtoms = /[A-Z][a-z]?[A-Z]/;
  const hasMultipleAtoms = multipleAtoms.test(text);
  
  return hasFeatures || hasMultipleAtoms || text.length > 8;
};

// 从文本中提取 SMILES
export const extractSmiles = (text: string): { smiles: string; start: number; end: number }[] => {
  const results: { smiles: string; start: number; end: number }[] = [];
  
  // 匹配用反引号包裹的 SMILES
  const backtickPattern = /`([^`]+)`/g;
  let match;
  
  while ((match = backtickPattern.exec(text)) !== null) {
    const candidate = match[1];
    if (isValidSmiles(candidate)) {
      results.push({
        smiles: candidate,
        start: match.index,
        end: match.index + match[0].length
      });
    }
  }
  
  return results;
};

export default SmilesHighlight;

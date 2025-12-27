import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Copy, Check, Loader2, Download, FlaskConical, Scale } from "lucide-react";

interface SmilesHighlightProps {
  smiles: string;
  className?: string;
}

interface MoleculeInfo {
  formula?: string;
  molecularWeight?: number;
  iupacName?: string;
  cid?: number;
}

// 使用 PubChem API 获取分子结构图
const getMoleculeImageUrl = (smiles: string, size: number = 300) => {
  const encodedSmiles = encodeURIComponent(smiles);
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/PNG?image_size=${size}x${size}`;
};

// 从 PubChem 获取分子信息
const fetchMoleculeInfo = async (smiles: string): Promise<MoleculeInfo | null> => {
  try {
    const encodedSmiles = encodeURIComponent(smiles);
    const response = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const props = data?.PropertyTable?.Properties?.[0];
    
    if (props) {
      return {
        formula: props.MolecularFormula,
        molecularWeight: typeof props.MolecularWeight === 'string' 
          ? parseFloat(props.MolecularWeight) 
          : props.MolecularWeight,
        iupacName: props.IUPACName,
        cid: props.CID
      };
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch molecule info:", err);
    return null;
  }
};

// 格式化分子式，添加下标
const formatFormula = (formula: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  
  while (i < formula.length) {
    const char = formula[i];
    
    // 检查是否是数字
    if (/\d/.test(char)) {
      let num = char;
      while (i + 1 < formula.length && /\d/.test(formula[i + 1])) {
        i++;
        num += formula[i];
      }
      parts.push(<sub key={key++}>{num}</sub>);
    } else {
      parts.push(char);
    }
    i++;
  }
  
  return <>{parts}</>;
};

const SmilesHighlight = ({ smiles, className }: SmilesHighlightProps) => {
  const [showPopover, setShowPopover] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [moleculeInfo, setMoleculeInfo] = useState<MoleculeInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showPopover && !moleculeInfo && !infoLoading) {
      setInfoLoading(true);
      fetchMoleculeInfo(smiles).then(info => {
        setMoleculeInfo(info);
        setInfoLoading(false);
      });
    }
  }, [showPopover, smiles, moleculeInfo, infoLoading]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowPopover(true);
    setImageLoading(true);
    setImageError(false);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowPopover(false);
    }, 300);
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

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    
    try {
      const response = await fetch(getMoleculeImageUrl(smiles, 500));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `molecule_${smiles.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download:", err);
    } finally {
      setDownloading(false);
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
            "min-w-[280px] max-w-[320px]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground">
              分子结构预览
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading || imageError}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              title="下载分子图"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>
          </div>
          
          <div className="relative bg-white dark:bg-gray-100 rounded-md overflow-hidden aspect-square w-full max-w-[260px] mx-auto">
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

          {/* Molecule Info Section */}
          <div className="mt-3 space-y-2">
            {infoLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>加载分子信息...</span>
              </div>
            ) : moleculeInfo ? (
              <>
                {/* Molecular Formula */}
                {moleculeInfo.formula && (
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-500/10 rounded-md">
                    <FlaskConical className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">分子式:</span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {formatFormula(moleculeInfo.formula)}
                    </span>
                  </div>
                )}
                
                {/* Molecular Weight */}
                {moleculeInfo.molecularWeight && (
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-emerald-500/10 rounded-md">
                    <Scale className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">分子量:</span>
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {moleculeInfo.molecularWeight.toFixed(2)} g/mol
                    </span>
                  </div>
                )}
                
                {/* IUPAC Name */}
                {moleculeInfo.iupacName && (
                  <div className="px-2 py-1.5 bg-amber-500/10 rounded-md">
                    <div className="text-xs text-muted-foreground mb-0.5">IUPAC名称:</div>
                    <div className="text-xs font-medium text-amber-600 dark:text-amber-400 break-words">
                      {moleculeInfo.iupacName}
                    </div>
                  </div>
                )}

                {/* PubChem Link */}
                {moleculeInfo.cid && (
                  <a
                    href={`https://pubchem.ncbi.nlm.nih.gov/compound/${moleculeInfo.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline px-2"
                  >
                    在 PubChem 中查看详情 →
                  </a>
                )}
              </>
            ) : null}
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

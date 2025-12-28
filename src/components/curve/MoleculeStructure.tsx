import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Download, Copy, Check, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MoleculeStructureProps {
  smiles: string;
  size?: number;
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

// Use PubChem API for molecule structure image
const getMoleculeImageUrl = (smiles: string, size: number = 200) => {
  const encodedSmiles = encodeURIComponent(smiles);
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/PNG?image_size=${size}x${size}`;
};

const MoleculeStructure = ({ 
  smiles, 
  size = 120, 
  className,
  showActions = true,
  compact = false
}: MoleculeStructureProps) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(smiles);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [smiles]);

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
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
  }, [smiles]);

  const handleOpenPubChem = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const encodedSmiles = encodeURIComponent(smiles);
    window.open(`https://pubchem.ncbi.nlm.nih.gov/compound/${encodedSmiles}`, '_blank');
  }, [smiles]);

  return (
    <TooltipProvider>
      <div 
        className={cn(
          "relative bg-white dark:bg-gray-100 rounded-lg overflow-hidden group/molecule",
          compact ? "p-1" : "p-2",
          className
        )}
        style={{ width: size, height: size }}
      >
        {/* Loading state */}
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
            <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
          </div>
        )}
        
        {/* Error state */}
        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-xs p-2 text-center bg-muted/10">
            <svg className="w-6 h-6 mb-1 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="3" />
              <circle cx="16" cy="8" r="3" />
              <circle cx="12" cy="16" r="3" />
              <line x1="10.5" y1="9.5" x2="13.5" y2="14.5" />
              <line x1="13.5" y1="9.5" x2="10.5" y2="14.5" />
            </svg>
            <span className="text-[10px]">加载失败</span>
          </div>
        ) : (
          <img
            src={getMoleculeImageUrl(smiles, size * 2)}
            alt={`Molecule: ${smiles}`}
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

        {/* Action buttons overlay */}
        {showActions && !imageError && !imageLoading && (
          <div className="absolute inset-0 bg-black/0 group-hover/molecule:bg-black/40 transition-all duration-200 flex items-center justify-center gap-1 opacity-0 group-hover/molecule:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md bg-white/90 hover:bg-white text-gray-700 transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                复制 SMILES
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="p-1.5 rounded-md bg-white/90 hover:bg-white text-gray-700 transition-colors disabled:opacity-50"
                >
                  {downloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                下载图片
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleOpenPubChem}
                  className="p-1.5 rounded-md bg-white/90 hover:bg-white text-gray-700 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                在 PubChem 查看
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default MoleculeStructure;

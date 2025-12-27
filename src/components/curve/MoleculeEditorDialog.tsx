import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Import, RotateCcw, ChevronDown, Copy, Check, PanelRightOpen, PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import MoleculePropertiesPanel from "./MoleculePropertiesPanel";

interface MoleculeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (smiles: string) => void;
  initialSmiles?: string;
}

// 常用分子模板库
const MOLECULE_TEMPLATES = {
  "基础结构": [
    { name: "苯环", smiles: "c1ccccc1", icon: "⬡" },
    { name: "环己烷", smiles: "C1CCCCC1", icon: "⬡" },
    { name: "环戊烷", smiles: "C1CCCC1", icon: "⬠" },
    { name: "萘", smiles: "c1ccc2ccccc2c1", icon: "⬡⬡" },
    { name: "蒽", smiles: "c1ccc2cc3ccccc3cc2c1", icon: "⬡⬡⬡" },
  ],
  "官能团": [
    { name: "甲醇", smiles: "CO", icon: "OH" },
    { name: "乙醇", smiles: "CCO", icon: "OH" },
    { name: "乙酸", smiles: "CC(=O)O", icon: "COOH" },
    { name: "苯甲酸", smiles: "c1ccccc1C(=O)O", icon: "⬡-COOH" },
    { name: "苯胺", smiles: "c1ccccc1N", icon: "⬡-NH₂" },
    { name: "苯酚", smiles: "c1ccccc1O", icon: "⬡-OH" },
  ],
  "氨基酸": [
    { name: "甘氨酸 (Gly)", smiles: "NCC(=O)O", icon: "G" },
    { name: "丙氨酸 (Ala)", smiles: "CC(N)C(=O)O", icon: "A" },
    { name: "缬氨酸 (Val)", smiles: "CC(C)C(N)C(=O)O", icon: "V" },
    { name: "亮氨酸 (Leu)", smiles: "CC(C)CC(N)C(=O)O", icon: "L" },
    { name: "异亮氨酸 (Ile)", smiles: "CCC(C)C(N)C(=O)O", icon: "I" },
    { name: "脯氨酸 (Pro)", smiles: "OC(=O)C1CCCN1", icon: "P" },
    { name: "苯丙氨酸 (Phe)", smiles: "c1ccccc1CC(N)C(=O)O", icon: "F" },
    { name: "色氨酸 (Trp)", smiles: "c1ccc2c(c1)c(CC(N)C(=O)O)cn2", icon: "W" },
    { name: "丝氨酸 (Ser)", smiles: "OCC(N)C(=O)O", icon: "S" },
    { name: "苏氨酸 (Thr)", smiles: "CC(O)C(N)C(=O)O", icon: "T" },
  ],
  "杂环": [
    { name: "吡啶", smiles: "c1ccncc1", icon: "N⬡" },
    { name: "吡咯", smiles: "c1cc[nH]c1", icon: "⬠N" },
    { name: "呋喃", smiles: "c1ccoc1", icon: "⬠O" },
    { name: "噻吩", smiles: "c1ccsc1", icon: "⬠S" },
    { name: "咪唑", smiles: "c1cnc[nH]1", icon: "NN" },
    { name: "吲哚", smiles: "c1ccc2[nH]ccc2c1", icon: "⬡⬠" },
  ],
  "常用药物骨架": [
    { name: "阿司匹林", smiles: "CC(=O)Oc1ccccc1C(=O)O", icon: "💊" },
    { name: "对乙酰氨基酚", smiles: "CC(=O)Nc1ccc(O)cc1", icon: "💊" },
    { name: "布洛芬", smiles: "CC(C)Cc1ccc(cc1)C(C)C(=O)O", icon: "💊" },
    { name: "咖啡因", smiles: "Cn1cnc2c1c(=O)n(c(=O)n2C)C", icon: "☕" },
  ],
};

declare global {
  interface Window {
    JSApplet?: any;
    jsmeOnLoad?: () => void;
  }
}

const CONTAINER_ID = "jsme-container-" + Math.random().toString(36).substr(2, 9);

const MoleculeEditorDialog = ({ open, onOpenChange, onExport, initialSmiles }: MoleculeEditorDialogProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSmiles, setCurrentSmiles] = useState("");
  const [importSmiles, setImportSmiles] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const jsmeRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);
  const initAttemptRef = useRef(0);

  const loadMolecule = useCallback((smiles: string) => {
    if (jsmeRef.current && smiles) {
      try {
        jsmeRef.current.readGenericMolecularInput(smiles);
        setCurrentSmiles(smiles);
      } catch (e) {
        console.error("Error loading molecule:", e);
      }
    }
  }, []);

  const initJSME = useCallback(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) {
      initAttemptRef.current++;
      if (initAttemptRef.current < 10) {
        setTimeout(initJSME, 300);
      }
      return;
    }

    try {
      if (!(window as any).JSApplet?.JSME) {
        initAttemptRef.current++;
        if (initAttemptRef.current < 20) {
          setTimeout(initJSME, 500);
        }
        return;
      }

      container.innerHTML = "";
      
      const jsmeApplet = new (window as any).JSApplet.JSME(
        CONTAINER_ID,
        "100%",
        "100%",
        {
          options: "query,hydrogens,stereo,paste,multipart"
        }
      );
      
      jsmeRef.current = jsmeApplet;
      
      jsmeApplet.setCallBack("AfterStructureModified", () => {
        try {
          const smiles = jsmeApplet.smiles();
          setCurrentSmiles(smiles || "");
        } catch (e) {
          console.error("Error getting SMILES:", e);
        }
      });
      
      setIsLoading(false);
      
      // Load initial SMILES if provided
      if (initialSmiles) {
        setTimeout(() => loadMolecule(initialSmiles), 100);
      }
    } catch (error) {
      console.error("Error initializing JSME:", error);
      initAttemptRef.current++;
      if (initAttemptRef.current < 10) {
        setTimeout(initJSME, 500);
      }
    }
  }, [initialSmiles, loadMolecule]);

  useEffect(() => {
    if (!open) return;

    initAttemptRef.current = 0;
    setIsLoading(true);

    if (!scriptLoadedRef.current && !(window as any).JSApplet?.JSME) {
      (window as any).jsmeOnLoad = () => {
        scriptLoadedRef.current = true;
        setTimeout(initJSME, 100);
      };
      
      const script = document.createElement("script");
      script.src = "https://jsme-editor.github.io/dist/jsme/jsme.nocache.js";
      script.async = true;
      
      script.onerror = () => {
        console.error("Failed to load JSME script");
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
      setTimeout(initJSME, 2000);
    } else if ((window as any).JSApplet?.JSME) {
      setTimeout(initJSME, 100);
    }
  }, [open, initJSME]);

  const handleExport = () => {
    if (jsmeRef.current) {
      try {
        const smiles = jsmeRef.current.smiles();
        if (smiles && smiles.trim()) {
          onExport(smiles);
          onOpenChange(false);
          jsmeRef.current.reset();
          setCurrentSmiles("");
        }
      } catch (e) {
        console.error("Error exporting SMILES:", e);
      }
    }
  };

  const handleImport = () => {
    if (importSmiles.trim()) {
      loadMolecule(importSmiles.trim());
      setImportSmiles("");
      setShowImport(false);
    }
  };

  const handleReset = () => {
    if (jsmeRef.current) {
      try {
        jsmeRef.current.reset();
        setCurrentSmiles("");
      } catch (e) {
        // Ignore reset errors
      }
    }
  };

  const handleCopySmiles = async () => {
    if (currentSmiles) {
      await navigator.clipboard.writeText(currentSmiles);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    if (jsmeRef.current) {
      try {
        jsmeRef.current.reset();
      } catch (e) {
        // Ignore reset errors
      }
    }
    setCurrentSmiles("");
    setShowImport(false);
    setImportSmiles("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b border-border flex-shrink-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="8" r="2.5" />
                  <circle cx="16" cy="8" r="2.5" />
                  <circle cx="12" cy="15" r="2.5" />
                  <line x1="10" y1="9" x2="13" y2="13.5" />
                  <line x1="14" y1="9" x2="11" y2="13.5" />
                </svg>
              </div>
              Molecule Structure Editor
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-border flex items-center gap-2 flex-shrink-0 bg-muted/30">
          {/* Template Library Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <span className="text-lg">🧪</span>
                模板库
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-[400px] overflow-y-auto">
              {Object.entries(MOLECULE_TEMPLATES).map(([category, templates], idx) => (
                <div key={category}>
                  {idx > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="font-medium">
                      {category}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                      {templates.map((template) => (
                        <DropdownMenuItem
                          key={template.smiles}
                          onClick={() => loadMolecule(template.smiles)}
                          className="gap-2"
                        >
                          <span className="w-6 text-center">{template.icon}</span>
                          <span className="flex-1">{template.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-px bg-border" />

          {/* Import SMILES */}
          {showImport ? (
            <div className="flex items-center gap-2">
              <Input
                value={importSmiles}
                onChange={(e) => setImportSmiles(e.target.value)}
                placeholder="输入 SMILES 字符串..."
                className="w-64 h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleImport();
                  if (e.key === "Escape") setShowImport(false);
                }}
                autoFocus
              />
              <Button size="sm" onClick={handleImport} disabled={!importSmiles.trim()}>
                导入
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowImport(false)}>
                取消
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="gap-1">
              <Import className="w-4 h-4" />
              导入 SMILES
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
            <RotateCcw className="w-4 h-4" />
            清空
          </Button>

          <div className="flex-1" />

          {/* Toggle Properties Panel */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowProperties(!showProperties)}
            className="gap-1"
          >
            {showProperties ? (
              <>
                <PanelRightClose className="w-4 h-4" />
                隐藏属性
              </>
            ) : (
              <>
                <PanelRightOpen className="w-4 h-4" />
                显示属性
              </>
            )}
          </Button>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Editor Area */}
          <div className="relative bg-white overflow-hidden flex-1 min-w-0 transition-all duration-300">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading molecule editor...</p>
                </div>
              </div>
            )}
            <div 
              id={CONTAINER_ID}
              className="w-full h-full"
              style={{ minHeight: "400px" }}
            />
          </div>

          {/* Properties Panel */}
          <div className={cn(
            "border-l border-border bg-muted/20 p-3 overflow-hidden flex-shrink-0 transition-all duration-300",
            showProperties ? "w-[320px] opacity-100" : "w-0 p-0 border-l-0 opacity-0"
          )}>
            {showProperties && (
              <MoleculePropertiesPanel 
                smiles={currentSmiles} 
                className="h-full" 
                onLoadSmiles={loadMolecule}
              />
            )}
          </div>
        </div>

        {/* Footer with SMILES preview and actions */}
        <div className="px-4 py-3 border-t border-border flex-shrink-0 bg-muted/30">
          <div className="flex items-center justify-between gap-4">
            {/* SMILES Preview */}
            <div className="flex-1 min-w-0">
              {currentSmiles ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Current SMILES:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-foreground bg-background px-2 py-1 rounded border border-border truncate block max-w-[400px]">
                        {currentSmiles}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopySmiles}
                        className="h-7 w-7 p-0"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  在上方画布中绘制分子结构，或从模板库选择
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button 
                onClick={handleExport}
                disabled={!currentSmiles}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white gap-1"
              >
                导出到对话框
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoleculeEditorDialog;

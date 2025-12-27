import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface MoleculeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (smiles: string) => void;
}

declare global {
  interface Window {
    JSApplet?: {
      setCallBack: (event: string, callback: (event: unknown) => void) => void;
      smiles: () => string;
      molFile: () => string;
      reset: () => void;
      readMolecule: (molString: string) => void;
    };
    jsmeOnLoad?: () => void;
  }
}

const MoleculeEditorDialog = ({ open, onOpenChange, onExport }: MoleculeEditorDialogProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSmiles, setCurrentSmiles] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const jsmeRef = useRef<Window["JSApplet"] | null>(null);
  const scriptLoadedRef = useRef(false);

  const initJSME = useCallback(() => {
    if (!containerRef.current) return;
    
    // Clear container
    containerRef.current.innerHTML = "";
    
    // Create JSME applet
    const jsmeApplet = new (window as any).JSApplet.JSME(
      containerRef.current,
      "100%",
      "100%",
      {
        options: "query,hydrogens,stereo,paste,reaction,multipart"
      }
    );
    
    jsmeRef.current = jsmeApplet;
    
    // Set callback for structure changes
    jsmeApplet.setCallBack("AfterStructureModified", () => {
      const smiles = jsmeApplet.smiles();
      setCurrentSmiles(smiles || "");
    });
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    // Load JSME script if not already loaded
    if (!scriptLoadedRef.current && !(window as any).JSApplet) {
      setIsLoading(true);
      
      const script = document.createElement("script");
      script.src = "https://jsme-editor.github.io/dist/jsme/jsme.nocache.js";
      script.async = true;
      
      script.onload = () => {
        scriptLoadedRef.current = true;
        // JSME takes a moment to initialize after script loads
        setTimeout(initJSME, 500);
      };
      
      script.onerror = () => {
        console.error("Failed to load JSME");
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    } else if ((window as any).JSApplet) {
      // JSME already loaded, just initialize
      setTimeout(initJSME, 100);
    }
    
    return () => {
      // Cleanup when dialog closes
      if (!open && containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [open, initJSME]);

  const handleExport = () => {
    if (jsmeRef.current) {
      const smiles = jsmeRef.current.smiles();
      if (smiles && smiles.trim()) {
        onExport(smiles);
        onOpenChange(false);
        // Reset editor
        jsmeRef.current.reset();
        setCurrentSmiles("");
      }
    }
  };

  const handleClose = () => {
    if (jsmeRef.current) {
      jsmeRef.current.reset();
    }
    setCurrentSmiles("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8" cy="8" r="3" />
              <circle cx="16" cy="8" r="3" />
              <circle cx="12" cy="16" r="3" />
              <line x1="10.5" y1="9.5" x2="13.5" y2="14.5" />
              <line x1="13.5" y1="9.5" x2="10.5" y2="14.5" />
            </svg>
            Structure Editor
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 relative bg-white">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading molecule editor...</p>
              </div>
            </div>
          )}
          <div 
            ref={containerRef} 
            className="w-full h-full"
            style={{ minHeight: "400px" }}
          />
        </div>

        {/* Current SMILES preview */}
        {currentSmiles && (
          <div className="px-6 py-2 bg-muted/50 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Current SMILES:</p>
            <p className="text-sm font-mono text-foreground break-all">{currentSmiles}</p>
          </div>
        )}
        
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            CLOSE
          </Button>
          <Button 
            onClick={handleExport}
            disabled={!currentSmiles}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            EXPORT
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoleculeEditorDialog;

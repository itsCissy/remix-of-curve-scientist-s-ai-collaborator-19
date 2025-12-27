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
    JSApplet?: any;
    jsmeOnLoad?: () => void;
  }
}

const CONTAINER_ID = "jsme-container-" + Math.random().toString(36).substr(2, 9);

const MoleculeEditorDialog = ({ open, onOpenChange, onExport }: MoleculeEditorDialogProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSmiles, setCurrentSmiles] = useState("");
  const [editorReady, setEditorReady] = useState(false);
  const jsmeRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);
  const initAttemptRef = useRef(0);

  const initJSME = useCallback(() => {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) {
      console.log("Container not found, retrying...");
      initAttemptRef.current++;
      if (initAttemptRef.current < 10) {
        setTimeout(initJSME, 300);
      }
      return;
    }

    try {
      // Check if JSApplet is available
      if (!(window as any).JSApplet?.JSME) {
        console.log("JSME not ready, retrying...");
        initAttemptRef.current++;
        if (initAttemptRef.current < 20) {
          setTimeout(initJSME, 500);
        }
        return;
      }

      // Clear any existing content
      container.innerHTML = "";
      
      // Create JSME applet using the container ID
      const jsmeApplet = new (window as any).JSApplet.JSME(
        CONTAINER_ID,
        "100%",
        "100%",
        {
          options: "query,hydrogens,stereo,paste,multipart"
        }
      );
      
      jsmeRef.current = jsmeApplet;
      
      // Set callback for structure changes
      jsmeApplet.setCallBack("AfterStructureModified", () => {
        try {
          const smiles = jsmeApplet.smiles();
          setCurrentSmiles(smiles || "");
        } catch (e) {
          console.error("Error getting SMILES:", e);
        }
      });
      
      setIsLoading(false);
      setEditorReady(true);
      console.log("JSME initialized successfully");
    } catch (error) {
      console.error("Error initializing JSME:", error);
      initAttemptRef.current++;
      if (initAttemptRef.current < 10) {
        setTimeout(initJSME, 500);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setEditorReady(false);
      return;
    }

    initAttemptRef.current = 0;
    setIsLoading(true);

    // Load JSME script if not already loaded
    if (!scriptLoadedRef.current && !(window as any).JSApplet?.JSME) {
      // Set up the global callback
      (window as any).jsmeOnLoad = () => {
        console.log("JSME script loaded");
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
      
      // Also try to init after a delay in case the callback doesn't fire
      setTimeout(initJSME, 2000);
    } else if ((window as any).JSApplet?.JSME) {
      // JSME already loaded, just initialize
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

  const handleClose = () => {
    if (jsmeRef.current) {
      try {
        jsmeRef.current.reset();
      } catch (e) {
        // Ignore reset errors
      }
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
        
        <div className="flex-1 relative bg-white overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
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

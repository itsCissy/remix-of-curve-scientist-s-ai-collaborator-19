import { useState, useEffect, useRef } from "react";
import { Loader2, FlaskConical, Scale, Droplets, Atom, Activity, Box, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MoleculeProperties {
  formula?: string;
  molecularWeight?: number;
  xLogP?: number;
  tpsa?: number; // Topological Polar Surface Area
  hBondDonor?: number;
  hBondAcceptor?: number;
  rotatableBonds?: number;
  heavyAtomCount?: number;
  complexity?: number;
  charge?: number;
  iupacName?: string;
  cid?: number;
}

interface MoleculePropertiesPanelProps {
  smiles: string;
  className?: string;
}

// 格式化分子式，添加下标
const formatFormula = (formula: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  
  while (i < formula.length) {
    const char = formula[i];
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

// 从 PubChem 获取分子属性
const fetchMoleculeProperties = async (smiles: string): Promise<MoleculeProperties | null> => {
  try {
    const encodedSmiles = encodeURIComponent(smiles);
    const response = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/property/MolecularFormula,MolecularWeight,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,HeavyAtomCount,Complexity,Charge,IUPACName/JSON`
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
        xLogP: props.XLogP,
        tpsa: props.TPSA,
        hBondDonor: props.HBondDonorCount,
        hBondAcceptor: props.HBondAcceptorCount,
        rotatableBonds: props.RotatableBondCount,
        heavyAtomCount: props.HeavyAtomCount,
        complexity: props.Complexity,
        charge: props.Charge,
        iupacName: props.IUPACName,
        cid: props.CID
      };
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch molecule properties:", err);
    return null;
  }
};

// 3D Viewer Component
const Molecule3DViewer = ({ smiles }: { smiles: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!smiles || !containerRef.current) return;

    const load3DViewer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Dynamically import 3Dmol
        const $3Dmol = await import("3dmol");
        
        // Clear previous viewer
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        // Create viewer
        const viewer = $3Dmol.createViewer(containerRef.current, {
          backgroundColor: "white",
        });
        viewerRef.current = viewer;

        // Fetch 3D structure from PubChem
        const encodedSmiles = encodeURIComponent(smiles);
        const response = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/SDF?record_type=3d`
        );

        if (!response.ok) {
          // Try 2D if 3D not available
          const response2d = await fetch(
            `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/SDF`
          );
          if (!response2d.ok) {
            throw new Error("无法获取分子结构");
          }
          const sdfData = await response2d.text();
          viewer.addModel(sdfData, "sdf");
        } else {
          const sdfData = await response.text();
          viewer.addModel(sdfData, "sdf");
        }

        // Style the molecule
        viewer.setStyle({}, { 
          stick: { radius: 0.15, colorscheme: "Jmol" },
          sphere: { radius: 0.3, colorscheme: "Jmol" }
        });
        
        viewer.zoomTo();
        viewer.render();
        viewer.spin("y", 0.5);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading 3D structure:", err);
        setError(err instanceof Error ? err.message : "加载失败");
        setIsLoading(false);
      }
    };

    load3DViewer();

    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [smiles]);

  const handleReset = () => {
    if (viewerRef.current) {
      viewerRef.current.zoomTo();
      viewerRef.current.spin("y", 0.5);
    }
  };

  const handleStopSpin = () => {
    if (viewerRef.current) {
      viewerRef.current.spin(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[250px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
            <p className="text-xs text-muted-foreground">加载3D结构...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <Box className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: "250px" }}
      />
      {!isLoading && !error && (
        <div className="absolute bottom-2 right-2 flex gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleStopSpin}
            className="h-7 text-xs"
          >
            停止旋转
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            重置
          </Button>
        </div>
      )}
    </div>
  );
};

// Property Card Component
const PropertyCard = ({ 
  icon: Icon, 
  label, 
  value, 
  unit,
  color 
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number | undefined;
  unit?: string;
  color: string;
}) => {
  if (value === undefined || value === null) return null;
  
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg",
      color
    )}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">
          {typeof value === "number" ? value.toFixed(2) : value}
          {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
};

const MoleculePropertiesPanel = ({ smiles, className }: MoleculePropertiesPanelProps) => {
  const [properties, setProperties] = useState<MoleculeProperties | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("properties");

  useEffect(() => {
    if (!smiles) {
      setProperties(null);
      return;
    }

    setIsLoading(true);
    fetchMoleculeProperties(smiles).then((props) => {
      setProperties(props);
      setIsLoading(false);
    });
  }, [smiles]);

  if (!smiles) {
    return (
      <div className={cn("flex items-center justify-center h-full text-muted-foreground text-sm", className)}>
        绘制分子后显示属性
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-2">
          <TabsTrigger value="properties" className="text-xs">分子属性</TabsTrigger>
          <TabsTrigger value="3d" className="text-xs">3D结构</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="flex-1 overflow-auto mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
            </div>
          ) : properties ? (
            <div className="space-y-2">
              {/* Formula */}
              {properties.formula && (
                <div className="px-3 py-2 bg-blue-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground">分子式</p>
                  <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                    {formatFormula(properties.formula)}
                  </p>
                </div>
              )}

              {/* IUPAC Name */}
              {properties.iupacName && (
                <div className="px-3 py-2 bg-purple-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground">IUPAC名称</p>
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 break-words">
                    {properties.iupacName}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <PropertyCard
                  icon={Scale}
                  label="分子量"
                  value={properties.molecularWeight}
                  unit="g/mol"
                  color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                />
                <PropertyCard
                  icon={Droplets}
                  label="XLogP"
                  value={properties.xLogP}
                  color="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                />
                <PropertyCard
                  icon={Activity}
                  label="TPSA"
                  value={properties.tpsa}
                  unit="Ų"
                  color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                />
                <PropertyCard
                  icon={Atom}
                  label="重原子数"
                  value={properties.heavyAtomCount}
                  color="bg-rose-500/10 text-rose-600 dark:text-rose-400"
                />
                <PropertyCard
                  icon={FlaskConical}
                  label="氢键供体"
                  value={properties.hBondDonor}
                  color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                />
                <PropertyCard
                  icon={FlaskConical}
                  label="氢键受体"
                  value={properties.hBondAcceptor}
                  color="bg-violet-500/10 text-violet-600 dark:text-violet-400"
                />
                <PropertyCard
                  icon={Activity}
                  label="可旋转键"
                  value={properties.rotatableBonds}
                  color="bg-teal-500/10 text-teal-600 dark:text-teal-400"
                />
                <PropertyCard
                  icon={Activity}
                  label="复杂度"
                  value={properties.complexity}
                  color="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                />
              </div>

              {/* Lipinski's Rule of Five */}
              {properties.molecularWeight && properties.xLogP !== undefined && 
               properties.hBondDonor !== undefined && properties.hBondAcceptor !== undefined && (
                <div className="mt-3 px-3 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                    Lipinski五规则
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <RuleCheck 
                      label="MW ≤ 500" 
                      passed={properties.molecularWeight <= 500} 
                    />
                    <RuleCheck 
                      label="LogP ≤ 5" 
                      passed={properties.xLogP <= 5} 
                    />
                    <RuleCheck 
                      label="HBD ≤ 5" 
                      passed={properties.hBondDonor <= 5} 
                    />
                    <RuleCheck 
                      label="HBA ≤ 10" 
                      passed={properties.hBondAcceptor <= 10} 
                    />
                  </div>
                </div>
              )}

              {/* PubChem Link */}
              {properties.cid && (
                <a
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${properties.cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-primary hover:underline px-3 py-2"
                >
                  在 PubChem 中查看详情 →
                </a>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              无法获取分子属性
            </div>
          )}
        </TabsContent>

        <TabsContent value="3d" className="flex-1 mt-0 bg-white rounded-lg border border-border overflow-hidden">
          <Molecule3DViewer smiles={smiles} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const RuleCheck = ({ label, passed }: { label: string; passed: boolean }) => (
  <div className="flex items-center gap-1">
    <span className={passed ? "text-green-600" : "text-red-500"}>
      {passed ? "✓" : "✗"}
    </span>
    <span className={passed ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
      {label}
    </span>
  </div>
);

export default MoleculePropertiesPanel;

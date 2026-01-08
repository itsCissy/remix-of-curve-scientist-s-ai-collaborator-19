import { useState, useEffect, useRef } from "react";
import { Loader2, FlaskConical, Scale, Droplets, Atom, Activity, Box, RotateCcw, Download, Search, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MoleculeProperties {
  formula?: string;
  molecularWeight?: number;
  xLogP?: number;
  tpsa?: number;
  hBondDonor?: number;
  hBondAcceptor?: number;
  rotatableBonds?: number;
  heavyAtomCount?: number;
  complexity?: number;
  charge?: number;
  iupacName?: string;
  cid?: number;
}

interface SimilarCompound {
  cid: number;
  smiles: string;
  iupacName?: string;
  molecularWeight?: number;
  similarity?: number;
}

interface MoleculePropertiesPanelProps {
  smiles: string;
  className?: string;
  onLoadSmiles?: (smiles: string) => void;
}

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

// Validate SMILES before making requests
const isValidSmilesForRequest = (smiles: string): boolean => {
  if (!smiles || typeof smiles !== 'string') return false;
  const trimmed = smiles.trim();
  if (trimmed.length < 2 || trimmed.length > 500) return false;
  const organicAtoms = /[CNOPSFIBcnops]/;
  return organicAtoms.test(trimmed);
};

const fetchMoleculeProperties = async (smiles: string): Promise<MoleculeProperties | null> => {
  if (!isValidSmilesForRequest(smiles)) {
    return null;
  }
  try {
    const encodedSmiles = encodeURIComponent(smiles.trim());
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

// 从 PubChem 获取相似化合物
const fetchSimilarCompounds = async (smiles: string, threshold: number = 90): Promise<SimilarCompound[]> => {
  if (!isValidSmilesForRequest(smiles)) {
    return [];
  }
  try {
    const encodedSmiles = encodeURIComponent(smiles.trim());
    
    // First get CIDs of similar compounds
    const cidResponse = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/fastsimilarity_2d/smiles/${encodedSmiles}/cids/JSON?Threshold=${threshold}`
    );
    
    if (!cidResponse.ok) return [];
    
    const cidData = await cidResponse.json();
    const cids = cidData?.IdentifierList?.CID?.slice(0, 10) || []; // Limit to 10 results
    
    if (cids.length === 0) return [];
    
    // Then get properties for these compounds
    const propsResponse = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cids.join(",")}/property/CanonicalSMILES,IUPACName,MolecularWeight/JSON`
    );
    
    if (!propsResponse.ok) return [];
    
    const propsData = await propsResponse.json();
    const properties = propsData?.PropertyTable?.Properties || [];
    
    return properties.map((prop: any) => ({
      cid: prop.CID,
      smiles: prop.CanonicalSMILES,
      iupacName: prop.IUPACName,
      molecularWeight: prop.MolecularWeight
    }));
  } catch (err) {
    console.error("Failed to fetch similar compounds:", err);
    return [];
  }
};

// 导出 CSV
const exportToCSV = (properties: MoleculeProperties, smiles: string) => {
  const headers = [
    "SMILES",
    "分子式",
    "IUPAC名称",
    "分子量 (g/mol)",
    "XLogP",
    "TPSA (Å²)",
    "氢键供体",
    "氢键受体",
    "可旋转键",
    "重原子数",
    "复杂度",
    "电荷",
    "PubChem CID"
  ];
  
  const values = [
    smiles,
    properties.formula || "",
    properties.iupacName || "",
    properties.molecularWeight?.toFixed(2) || "",
    properties.xLogP?.toFixed(2) || "",
    properties.tpsa?.toFixed(2) || "",
    properties.hBondDonor?.toString() || "",
    properties.hBondAcceptor?.toString() || "",
    properties.rotatableBonds?.toString() || "",
    properties.heavyAtomCount?.toString() || "",
    properties.complexity?.toFixed(2) || "",
    properties.charge?.toString() || "",
    properties.cid?.toString() || ""
  ];
  
  // Escape values for CSV
  const escapeCSV = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  
  const csv = [
    headers.map(escapeCSV).join(","),
    values.map(escapeCSV).join(",")
  ].join("\n");
  
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `molecule_${properties.formula || "unknown"}_${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  toast.success("已导出 CSV 文件");
};

// 3D Viewer Component
const Molecule3DViewer = ({ smiles }: { smiles: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidSmilesForRequest(smiles) || !containerRef.current) {
      setIsLoading(false);
      setError("无效的SMILES格式");
      return;
    }

    const load3DViewer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const $3Dmol = await import("3dmol");
        
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        const viewer = $3Dmol.createViewer(containerRef.current, {
          backgroundColor: "white",
        });
        viewerRef.current = viewer;

        const encodedSmiles = encodeURIComponent(smiles.trim());
        const response = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/SDF?record_type=3d`
        );

        if (!response.ok) {
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
        } catch (e) {}
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
          <Button variant="secondary" size="sm" onClick={handleStopSpin} className="h-7 text-xs">
            停止旋转
          </Button>
          <Button variant="secondary" size="sm" onClick={handleReset} className="h-7 text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            重置
          </Button>
        </div>
      )}
    </div>
  );
};

// Similar Compounds Tab
const SimilarCompoundsTab = ({ 
  smiles, 
  onLoadSmiles 
}: { 
  smiles: string; 
  onLoadSmiles?: (smiles: string) => void;
}) => {
  const [compounds, setCompounds] = useState<SimilarCompound[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    setSearched(true);
    const results = await fetchSimilarCompounds(smiles);
    setCompounds(results);
    setIsLoading(false);
  };

  if (!searched) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <Search className="w-10 h-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground text-center">
          搜索与当前分子结构相似的化合物
        </p>
        <Button onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" />
          开始搜索
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          <p className="text-xs text-muted-foreground">搜索相似化合物...</p>
        </div>
      </div>
    );
  }

  if (compounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
        <p className="text-sm text-muted-foreground">未找到相似化合物</p>
        <Button variant="outline" onClick={handleSearch} size="sm">
          重新搜索
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-1">
        {compounds.map((compound, index) => (
          <div 
            key={compound.cid}
            className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">CID: {compound.cid}</p>
                <p className="text-xs font-mono text-foreground/80 truncate mt-1" title={compound.smiles}>
                  {compound.smiles}
                </p>
                {compound.iupacName && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {compound.iupacName}
                  </p>
                )}
                {compound.molecularWeight && (
                  <p className="text-xs text-emerald-600 mt-1">
                    MW: {Number(compound.molecularWeight).toFixed(2)} g/mol
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {onLoadSmiles && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onLoadSmiles(compound.smiles)}
                  >
                    导入
                  </Button>
                )}
                <a
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-7 px-2 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={handleSearch} size="sm" className="w-full mt-2">
          刷新结果
        </Button>
      </div>
    </ScrollArea>
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
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", color)}>
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

const MoleculePropertiesPanel = ({ smiles, className, onLoadSmiles }: MoleculePropertiesPanelProps) => {
  const [properties, setProperties] = useState<MoleculeProperties | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("properties");

  useEffect(() => {
    if (!smiles || !isValidSmilesForRequest(smiles)) {
      setProperties(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchMoleculeProperties(smiles).then((props) => {
      setProperties(props);
      setIsLoading(false);
    }).catch(() => {
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
        <TabsList className="grid w-full grid-cols-3 mb-2">
          <TabsTrigger value="properties" className="text-xs">属性</TabsTrigger>
          <TabsTrigger value="3d" className="text-xs">3D</TabsTrigger>
          <TabsTrigger value="similar" className="text-xs">相似</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="flex-1 overflow-auto mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
            </div>
          ) : properties ? (
            <div className="space-y-2">
              {/* Export Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => exportToCSV(properties, smiles)}
              >
                <Download className="w-4 h-4" />
                导出 CSV
              </Button>

              {properties.formula && (
                <div className="px-3 py-2 bg-blue-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground">分子式</p>
                  <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                    {formatFormula(properties.formula)}
                  </p>
                </div>
              )}

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
                  unit="Å²"
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

              {properties.molecularWeight && properties.xLogP !== undefined && 
               properties.hBondDonor !== undefined && properties.hBondAcceptor !== undefined && (
                <div className="mt-3 px-3 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                    Lipinski五规则
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <RuleCheck label="MW ≤ 500" passed={properties.molecularWeight <= 500} />
                    <RuleCheck label="LogP ≤ 5" passed={properties.xLogP <= 5} />
                    <RuleCheck label="HBD ≤ 5" passed={properties.hBondDonor <= 5} />
                    <RuleCheck label="HBA ≤ 10" passed={properties.hBondAcceptor <= 10} />
                  </div>
                </div>
              )}

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

        <TabsContent value="similar" className="flex-1 mt-0 overflow-hidden">
          <SimilarCompoundsTab smiles={smiles} onLoadSmiles={onLoadSmiles} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MoleculePropertiesPanel;

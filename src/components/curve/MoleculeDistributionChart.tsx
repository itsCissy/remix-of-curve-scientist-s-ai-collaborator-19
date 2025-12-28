import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MoleculeData } from "@/lib/moleculeDataUtils";

interface MoleculeDistributionChartProps {
  data: MoleculeData[];
  className?: string;
}

// XtalPi Brand Colors for charts
const COLORS = [
  '#123aff',  // XtalPi Blue
  '#00ff9a',  // XtalPi Green
  '#00ffff',  // XtalPi Cyan
  '#00a29c',  // XtalPi Teal (Green dark)
  '#1609a0',  // XtalPi Deep Blue
];

const MoleculeDistributionChart = ({ data, className }: MoleculeDistributionChartProps) => {
  // Calculate similarity distribution
  const similarityDistribution = useMemo(() => {
    const bins = [
      { range: '0-20%', min: 0, max: 0.2, count: 0 },
      { range: '20-40%', min: 0.2, max: 0.4, count: 0 },
      { range: '40-60%', min: 0.4, max: 0.6, count: 0 },
      { range: '60-80%', min: 0.6, max: 0.8, count: 0 },
      { range: '80-100%', min: 0.8, max: 1.0, count: 0 },
    ];

    data.forEach(item => {
      if (item.similarity !== undefined) {
        const sim = typeof item.similarity === 'number' ? item.similarity : parseFloat(String(item.similarity));
        for (const bin of bins) {
          if (sim >= bin.min && sim < bin.max) {
            bin.count++;
            break;
          } else if (sim === 1 && bin.max === 1.0) {
            bin.count++;
            break;
          }
        }
      }
    });

    return bins;
  }, [data]);

  // Calculate MW distribution
  const mwDistribution = useMemo(() => {
    const mwValues = data
      .filter(item => item.mw !== undefined)
      .map(item => typeof item.mw === 'number' ? item.mw : parseFloat(String(item.mw)));

    if (mwValues.length === 0) return [];

    const min = Math.floor(Math.min(...mwValues) / 100) * 100;
    const max = Math.ceil(Math.max(...mwValues) / 100) * 100;
    const binSize = 100;
    const bins: { range: string; min: number; max: number; count: number }[] = [];

    for (let i = min; i < max; i += binSize) {
      bins.push({
        range: `${i}-${i + binSize}`,
        min: i,
        max: i + binSize,
        count: 0
      });
    }

    mwValues.forEach(mw => {
      for (const bin of bins) {
        if (mw >= bin.min && mw < bin.max) {
          bin.count++;
          break;
        }
      }
    });

    return bins.filter(bin => bin.count > 0);
  }, [data]);

  // Calculate LogP distribution
  const logpDistribution = useMemo(() => {
    const logpValues = data
      .filter(item => item.logp !== undefined)
      .map(item => typeof item.logp === 'number' ? item.logp : parseFloat(String(item.logp)));

    if (logpValues.length === 0) return [];

    const min = Math.floor(Math.min(...logpValues));
    const max = Math.ceil(Math.max(...logpValues));
    const bins: { range: string; min: number; max: number; count: number }[] = [];

    for (let i = min; i < max; i++) {
      bins.push({
        range: `${i} to ${i + 1}`,
        min: i,
        max: i + 1,
        count: 0
      });
    }

    logpValues.forEach(logp => {
      for (const bin of bins) {
        if (logp >= bin.min && logp < bin.max) {
          bin.count++;
          break;
        }
      }
    });

    return bins.filter(bin => bin.count > 0);
  }, [data]);

  const hasSimilarity = similarityDistribution.some(bin => bin.count > 0);
  const hasMW = mwDistribution.length > 0;
  const hasLogP = logpDistribution.length > 0;

  if (!hasSimilarity && !hasMW && !hasLogP) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
        暂无足够的属性数据用于图表展示
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Similarity Distribution */}
      {hasSimilarity && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">相似度分布</h4>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={similarityDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`${value} 个分子`, '数量']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {similarityDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MW Distribution */}
        {hasMW && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">分子量分布 (MW)</h4>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mwDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value} 个分子`, '数量']}
                  />
                  <Bar dataKey="count" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* LogP Distribution */}
        {hasLogP && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">LogP 分布</h4>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={logpDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value} 个分子`, '数量']}
                  />
                  <Bar dataKey="count" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-foreground">{data.length}</div>
          <div className="text-xs text-muted-foreground">分子总数</div>
        </div>
        {hasSimilarity && (
          <div className="bg-violet-500/10 rounded-lg p-3">
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {similarityDistribution[4].count}
            </div>
            <div className="text-xs text-muted-foreground">高相似度 (≥80%)</div>
          </div>
        )}
        {hasMW && (
          <div className="bg-blue-500/10 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(data.reduce((sum, item) => sum + (typeof item.mw === 'number' ? item.mw : 0), 0) / data.filter(item => item.mw !== undefined).length)}
            </div>
            <div className="text-xs text-muted-foreground">平均分子量</div>
          </div>
        )}
        {hasLogP && (
          <div className="bg-emerald-500/10 rounded-lg p-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {(data.reduce((sum, item) => sum + (typeof item.logp === 'number' ? item.logp : 0), 0) / data.filter(item => item.logp !== undefined).length).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">平均 LogP</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoleculeDistributionChart;

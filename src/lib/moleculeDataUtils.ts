// Molecule data types and parsing utilities

export interface MoleculeData {
  id?: string;
  smiles?: string;
  similarity?: number;
  mw?: number;
  logp?: number;
  hbd?: number;
  hba?: number;
  tpsa?: number;
  rotatable_bonds?: number;
  [key: string]: string | number | undefined;
}

export interface ParsedMoleculeResult {
  description?: string;
  molecules: MoleculeData[];
}

// Parse CSV-like data from text content
export function parseCSVData(content: string): MoleculeData[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
  
  // Parse data rows
  const molecules: MoleculeData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const molecule: MoleculeData = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      if (value === undefined || value === '') return;
      
      // Try to parse as number for known numeric fields
      const numericFields = ['similarity', 'mw', 'logp', 'hbd', 'hba', 'tpsa', 'rotatable_bonds', 'molecular_weight'];
      
      if (numericFields.includes(header)) {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          // Normalize field names
          const normalizedKey = header === 'molecular_weight' ? 'mw' : header;
          molecule[normalizedKey] = num;
          return;
        }
      }
      
      molecule[header] = value;
    });
    
    if (Object.keys(molecule).length > 0) {
      molecules.push(molecule);
    }
  }
  
  return molecules;
}

// Parse a single CSV line, handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Parse markdown table data
export function parseMarkdownTable(content: string): MoleculeData[] {
  const lines = content.trim().split('\n');
  if (lines.length < 3) return []; // Header + separator + at least one row
  
  // Find table lines (lines starting with |)
  const tableLines = lines.filter(line => line.trim().startsWith('|'));
  if (tableLines.length < 3) return [];
  
  // Parse header
  const headerLine = tableLines[0];
  const headers = headerLine
    .split('|')
    .filter(cell => cell.trim())
    .map(cell => cell.trim().toLowerCase());
  
  // Skip separator line and parse data
  const molecules: MoleculeData[] = [];
  
  for (let i = 2; i < tableLines.length; i++) {
    const line = tableLines[i];
    const values = line
      .split('|')
      .filter(cell => cell.trim())
      .map(cell => cell.trim());
    
    const molecule: MoleculeData = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      if (value === undefined || value === '') return;
      
      // Clean up backticks from SMILES
      const cleanValue = value.replace(/`/g, '');
      
      // Try to parse as number
      const numericFields = ['similarity', 'mw', 'logp', 'hbd', 'hba', 'tpsa', 'rotatable_bonds'];
      if (numericFields.includes(header)) {
        // Handle percentage format
        const numStr = cleanValue.replace('%', '');
        const num = parseFloat(numStr);
        if (!isNaN(num)) {
          molecule[header] = cleanValue.includes('%') ? num / 100 : num;
          return;
        }
      }
      
      molecule[header] = cleanValue;
    });
    
    if (Object.keys(molecule).length > 0) {
      molecules.push(molecule);
    }
  }
  
  return molecules;
}

// Detect and parse molecule data from message content
export function detectMoleculeData(content: string): ParsedMoleculeResult | null {
  // Check for <molecule-data> tag
  const moleculeDataMatch = content.match(/<molecule-data(?:\s+description="([^"]*)")?>([\s\S]*?)<\/molecule-data>/);
  if (moleculeDataMatch) {
    const description = moleculeDataMatch[1];
    const dataContent = moleculeDataMatch[2].trim();
    
    // Try CSV first
    let molecules = parseCSVData(dataContent);
    
    // Try markdown table if CSV didn't work
    if (molecules.length === 0) {
      molecules = parseMarkdownTable(dataContent);
    }
    
    if (molecules.length > 0) {
      return { description, molecules };
    }
  }
  
  // Check for code blocks with CSV data
  const csvCodeBlockMatch = content.match(/```(?:csv)?\s*\n([\s\S]*?)```/);
  if (csvCodeBlockMatch) {
    const csvContent = csvCodeBlockMatch[1];
    
    // Check if it looks like molecule data (has SMILES column or molecule-related headers)
    const firstLine = csvContent.split('\n')[0].toLowerCase();
    const moleculeHeaders = ['smiles', 'similarity', 'mw', 'molecular_weight', 'logp'];
    
    if (moleculeHeaders.some(h => firstLine.includes(h))) {
      const molecules = parseCSVData(csvContent);
      if (molecules.length > 0) {
        return { molecules };
      }
    }
  }
  
  // Check for markdown tables with molecule data
  if (content.includes('|') && (
    content.toLowerCase().includes('smiles') || 
    content.toLowerCase().includes('similarity')
  )) {
    const molecules = parseMarkdownTable(content);
    if (molecules.length > 0) {
      return { molecules };
    }
  }
  
  return null;
}

// Generate sample molecule data for testing
export function generateSampleMoleculeData(count: number = 10): MoleculeData[] {
  const sampleSmiles = [
    'CCO',
    'CC(=O)O',
    'c1ccccc1',
    'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O',
    'CC(=O)Nc1ccc(O)cc1',
    'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
    'CC(C)(C)NCC(O)c1ccc(O)c(CO)c1',
    'CC12CCC3C(C1CCC2O)CCC4=CC(=O)CCC34C',
    'CN1CCC23C4C1CC5=C2C(=C(C=C5)O)OC3C(C=C4)O',
    'CC(=O)OC1=CC=CC=C1C(=O)O'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `MOL-${String(i + 1).padStart(3, '0')}`,
    smiles: sampleSmiles[i % sampleSmiles.length],
    similarity: Math.random() * 0.5 + 0.5,
    mw: Math.random() * 400 + 100,
    logp: Math.random() * 6 - 1,
    hbd: Math.floor(Math.random() * 5),
    hba: Math.floor(Math.random() * 10),
    tpsa: Math.random() * 150,
    rotatable_bonds: Math.floor(Math.random() * 10)
  }));
}

/**
 * Smart Master Code Generator Helper
 * Automatically derives standard, clean, uppercase codes from entity names.
 * All generated codes are fully editable by the user.
 */

// Common standard abbreviation dictionary for units & pharmaceutical terms
const PHARMA_ABBREVIATIONS = {
  // Units of Measurement
  kilogram: "KG",
  kilograms: "KG",
  kilo: "KG",
  gram: "GM",
  grams: "GM",
  milligram: "MG",
  milligrams: "MG",
  microgram: "MCG",
  litre: "LTR",
  litres: "LTR",
  liter: "LTR",
  liters: "LTR",
  millilitre: "ML",
  millilitres: "ML",
  milliliter: "ML",
  tablet: "TAB",
  tablets: "TAB",
  capsule: "CAP",
  capsules: "CAP",
  strip: "STP",
  strips: "STP",
  box: "BOX",
  boxes: "BOX",
  bottle: "BTL",
  bottles: "BTL",
  vial: "VIAL",
  vials: "VIAL",
  ampoule: "AMP",
  ampoules: "AMP",
  numbers: "NOS",
  number: "NOS",
  units: "NOS",
  unit: "NOS",
  pieces: "PCS",
  piece: "PCS",
  pack: "PCK",
  packs: "PCK",
  carton: "CTN",
  cartons: "CTN",
  drum: "DRUM",
  drums: "DRUM",
  bag: "BAG",
  bags: "BAG",
  roll: "ROLL",
  rolls: "ROLL",
  tube: "TUBE",
  tubes: "TUBE",

  // Common Categories & Forms
  paracetamol: "PCM",
  amoxicillin: "AMX",
  ibuprofen: "IBU",
  ceftriaxone: "CEF",
  azithromycin: "AZI",
  pantoprazole: "PAN",
  omeprazole: "OME",
  metformin: "MET",
  ciprofloxacin: "CIP",
};

/**
 * Extracts 3-letter acronym or abbreviation from multi-word or single-word strings.
 */
export function extractLettersCode(text, maxChars = 4) {
  if (!text || !text.trim()) return "";
  const cleaned = text.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 0) return "";

  // 1 word: e.g. "Paracetamol" -> "PAR" (or "PCM" if in dictionary)
  if (words.length === 1) {
    const lower = words[0].toLowerCase();
    if (PHARMA_ABBREVIATIONS[lower]) {
      return PHARMA_ABBREVIATIONS[lower];
    }
    return words[0].slice(0, Math.max(3, maxChars)).toUpperCase();
  }

  // 2 words: e.g. "Solid Orals" -> "SOL-ORA" or "SO"
  if (words.length === 2) {
    const w1 = words[0].toLowerCase();
    const w2 = words[1].toLowerCase();
    if (PHARMA_ABBREVIATIONS[w1] && PHARMA_ABBREVIATIONS[w2]) {
      return `${PHARMA_ABBREVIATIONS[w1]}-${PHARMA_ABBREVIATIONS[w2]}`;
    }
    const part1 = words[0].slice(0, 3).toUpperCase();
    const part2 = words[1].slice(0, 3).toUpperCase();
    return `${part1}-${part2}`;
  }

  // 3+ words: Acronym if words > 2, e.g. "Active Pharmaceutical Ingredients" -> "API"
  const acronym = words.map((w) => w[0]).join("").toUpperCase();
  if (acronym.length >= 3 && acronym.length <= 5) {
    return acronym;
  }

  // Otherwise take first 3 letters of first word + first letters of others
  return words.slice(0, 3).map((w) => w.slice(0, 2)).join("").toUpperCase();
}

/**
 * Generate Product Category Code
 * Examples:
 * - "Active Pharmaceutical Ingredients" -> "CAT-API"
 * - "Finished Dosage Formulations" -> "CAT-FDF"
 * - "Excipients" -> "CAT-EXC"
 * - "Packaging Materials" -> "CAT-PKG"
 */
export function generateCategoryCode(name) {
  if (!name || !name.trim()) return "";
  const baseCode = extractLettersCode(name, 3);
  return baseCode ? `CAT-${baseCode}` : "";
}

/**
 * Generate Product Sub-Category Code
 * Examples:
 * - "Solid Orals (Tablets)" -> "SUB-TAB"
 * - "Capsules" -> "SUB-CAP"
 * - "Injectables" -> "SUB-INJ"
 * - "Blister Foils" -> "SUB-BLIST"
 */
export function generateSubCategoryCode(name) {
  if (!name || !name.trim()) return "";
  // Check if parentheses contain key term like "(Tablets)"
  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    const inner = parenMatch[1].toLowerCase().trim();
    if (PHARMA_ABBREVIATIONS[inner]) {
      return `SUB-${PHARMA_ABBREVIATIONS[inner]}`;
    }
    return `SUB-${inner.slice(0, 4).toUpperCase()}`;
  }

  const baseCode = extractLettersCode(name, 4);
  return baseCode ? `SUB-${baseCode}` : "";
}

/**
 * Generate Product Master Code
 * Examples:
 * - "Paracetamol 500mg Tablets" -> "PRD-PCM-500" or "PRD-PAR-500"
 * - "Amoxicillin 250mg" -> "PRD-AMX-250"
 * - "Ceftriaxone 1g Injection" -> "PRD-CEF-1G"
 */
export function generateProductCode(name) {
  if (!name || !name.trim()) return "";

  // Extract strength/potency (e.g. 500mg, 250mg, 1g, 100ml)
  const strengthMatch = name.match(/(\d+\s*(?:mg|g|gm|ml|mcg|iu|%|vial|tablets|tabs|caps)?)/i);
  let strength = "";
  if (strengthMatch) {
    strength = strengthMatch[1].replace(/\s+/g, "").toUpperCase();
  }

  // Remove parentheses & strength from name to extract base drug name
  const cleanName = name
    .replace(/\([^)]*\)/g, "")
    .replace(/\b\d+\s*(?:mg|g|gm|ml|mcg|iu|%|tablets|tabs|caps|injections|syrup)?\b/gi, "")
    .replace(/\b(?:tablets|tablet|capsules|capsule|injection|syrup|ointment|gel|oral|suspension)\b/gi, "")
    .trim();

  const words = cleanName.split(/\s+/).filter(Boolean);
  let baseDrug = "";

  if (words.length > 0) {
    const firstWordLower = words[0].toLowerCase();
    if (PHARMA_ABBREVIATIONS[firstWordLower]) {
      baseDrug = PHARMA_ABBREVIATIONS[firstWordLower];
    } else {
      // First 3-4 letters
      baseDrug = words[0].slice(0, 3).toUpperCase();
    }
  } else {
    baseDrug = extractLettersCode(name, 3);
  }

  const parts = ["PRD", baseDrug];
  if (strength) {
    parts.push(strength);
  }

  return parts.filter(Boolean).join("-");
}

/**
 * Generate UOM Code
 * Examples:
 * - "Kilogram" -> "KG"
 * - "Litre" -> "LTR"
 * - "Milligram" -> "MG"
 * - "Numbers / Units" -> "NOS"
 * - "Tablet" -> "TAB"
 * - "Capsule" -> "CAP"
 */
export function generateUomCode(name) {
  if (!name || !name.trim()) return "";
  const lower = name.toLowerCase().trim();

  // Check dictionary
  for (const [key, val] of Object.entries(PHARMA_ABBREVIATIONS)) {
    if (lower === key || lower.startsWith(key) || lower.includes(key)) {
      return val;
    }
  }

  // Default: first 3 letters
  const cleaned = name.trim().replace(/[^a-zA-Z0-9]/g, "");
  return cleaned.slice(0, 3).toUpperCase();
}

/**
 * Generate Customer Code
 * Examples:
 * - "Acme Pharmaceuticals" -> "CUST-ACME"
 * - "Sun Pharma Laboratories" -> "CUST-SPL"
 * - "Apollo Hospital Chain" -> "CUST-AHC"
 */
export function generateCustomerCode(name) {
  if (!name || !name.trim()) return "";
  const cleaned = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) {
    return `CUST-${words[0].slice(0, 4).toUpperCase()}`;
  }
  const acronym = words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
  return `CUST-${acronym}`;
}

/**
 * Generate Pass Category Code
 * Examples:
 * - "Material Delivery" (INWARD) -> "IN_MAT"
 * - "Visitor Entry" (INWARD) -> "IN_VIS"
 * - "Sales Dispatch" (OUTWARD) -> "OUT_SAL"
 */
export function generatePassCategoryCode(name, type = "INWARD") {
  if (!name || !name.trim()) return "";
  const prefix = type === "OUTWARD" ? "OUT" : "IN";
  const cleaned = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const base = words[0].slice(0, 3).toUpperCase();
  return `${prefix}_${base}`;
}

/**
 * Generate Supplier Code
 * Examples:
 * - "Reliance Chemical Industries" -> "SUP-RCI"
 * - "Apex Solvents Pvt Ltd" -> "SUP-APEX"
 */
export function generateSupplierCode(name) {
  if (!name || !name.trim()) return "";
  const cleaned = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) {
    return `SUP-${words[0].slice(0, 4).toUpperCase()}`;
  }
  const acronym = words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
  return `SUP-${acronym}`;
}

/**
 * Generate Packing Material Code
 * Examples:
 * - "Aluminium Foil 25 Micron" (PRIMARY) -> "PKG-PRI-ALU"
 * - "Amber Glass Bottle 100ml" (PRIMARY) -> "PKG-PRI-BTL"
 * - "Corrugated Outer Carton" (SECONDARY) -> "PKG-SEC-CTN"
 */
export function generatePackingMaterialCode(name, type = "PRIMARY") {
  if (!name || !name.trim()) return "";
  const typeTag = type === "SECONDARY" ? "SEC" : type === "TERTIARY" ? "TER" : "PRI";
  const lower = name.toLowerCase().trim();

  let matTag = "";
  for (const [key, val] of Object.entries(PHARMA_ABBREVIATIONS)) {
    if (lower.includes(key)) {
      matTag = val;
      break;
    }
  }

  if (!matTag) {
    matTag = extractLettersCode(name, 4);
  }

  return `PKG-${typeTag}-${matTag}`;
}

/**
 * Generate QC Specification Code
 * Examples:
 * - Item: "PRD-PCM-500", Version: "v1.0" -> "QC-SPEC-PRD-PCM-500-V1"
 * - Item: "PKG-PRI-ALU", Version: "v1.0" -> "QC-SPEC-PKG-PRI-ALU-V1"
 */
export function generateQcSpecCode(itemCode, version = "v1.0") {
  if (!itemCode || !itemCode.trim()) return "";
  const cleanCode = itemCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  const cleanVer = version.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `QC-SPEC-${cleanCode}${cleanVer ? `-${cleanVer}` : ""}`;
}

/**
 * Generate Storage Location Code
 * Examples:
 * - StoreType: "RAW_MATERIAL_STORE", Location: "Bay A-01" -> "LOC-RM-BAY-A"
 * - StoreType: "COLD_CHAIN", Location: "Cold Room 1" -> "LOC-COLD-COLD-1"
 * - StoreType: "FINISHED_GOODS_STORE", Location: "Rack 4 Floor 2" -> "LOC-FG-RAC-4"
 */
export function generateStorageLocationCode(storeType, locationName) {
  let prefix = "LOC-GEN";
  if (storeType === "RAW_MATERIAL_STORE") prefix = "LOC-RM";
  else if (storeType === "PACKAGING_STORE") prefix = "LOC-PKG";
  else if (storeType === "FINISHED_GOODS_STORE") prefix = "LOC-FG";
  else if (storeType === "QUARANTINE_STORE") prefix = "LOC-QRT";
  else if (storeType === "REJECTION_STORE") prefix = "LOC-REJ";
  else if (storeType === "IN_TRANSIT_STORE") prefix = "LOC-TRN";

  if (!locationName || !locationName.trim()) return prefix;
  const cleaned = locationName.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return prefix;

  const locTag = words.slice(0, 2).map((w) => w.slice(0, 3).toUpperCase()).join("-");
  return `${prefix}-${locTag}`;
}


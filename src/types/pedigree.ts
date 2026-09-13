export interface AncestorNode {
  name: string;
  tag: string;
  breedPurity?: string;
}

export interface Pedigree4Gen {
  // Generation 1: Parents
  F?: AncestorNode;
  M?: AncestorNode;

  // Generation 2: Grandparents
  FF?: AncestorNode;
  FM?: AncestorNode;
  MF?: AncestorNode;
  MM?: AncestorNode;

  // Generation 3: Great-grandparents
  FFF?: AncestorNode;
  FFM?: AncestorNode;
  FMF?: AncestorNode;
  FMM?: AncestorNode;
  MFF?: AncestorNode;
  MFM?: AncestorNode;
  MMF?: AncestorNode;
  MMM?: AncestorNode;

  // Generation 4: Great-great-grandparents (16)
  FFFF?: AncestorNode;
  FFFM?: AncestorNode;
  FFMF?: AncestorNode;
  FFMM?: AncestorNode;
  FMFF?: AncestorNode;
  FMFM?: AncestorNode;
  FMMF?: AncestorNode;
  FMMM?: AncestorNode;
  MFFF?: AncestorNode;
  MFFM?: AncestorNode;
  MFMF?: AncestorNode;
  MFMM?: AncestorNode;
  MMFF?: AncestorNode;
  MMFM?: AncestorNode;
  MMMF?: AncestorNode;
  MMMM?: AncestorNode;
}

export interface ClassificationData {
  tagNo?: string;
  date?: string;
  performedBy?: string;
  age?: string;
  horn?: string;
  conf?: string;      // C - Budowa / Conformation
  size?: string;      // G - Wielkość / Size
  fat?: string;       // D - Rozkład tłuszczu / Distr of fat
  colour?: string;    // P - Umaszczenie / Colour pattern
  covering?: string;  // H - Okrywa / Covering
  type?: string;      // T - Typ rasowy / Type
  notes?: string;
}

export function parseCustomPedigree(raw?: string | null): Pedigree4Gen {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function parseClassificationData(raw?: string | null): ClassificationData | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

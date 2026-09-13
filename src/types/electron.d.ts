// Type definitions for the Electron IPC API exposed via preload
// This ensures type-safety across the IPC boundary

export interface SheepFilters {
  status?: string;
  sex?: string;
  search?: string;
}

export interface SheepData {
  earTag: string;
  name?: string;
  sex: 'MALE' | 'FEMALE';
  birthDate: string;
  status: 'ACTIVE' | 'SOLD' | 'DEAD';
  lineage?: string;
  motherId?: string;
  fatherId?: string;
}

export interface SheepRecord {
  id: string;
  earTag: string;
  name: string | null;
  sex: string;
  birthDate: string;
  status: string;
  lineage: string | null;
  motherId: string | null;
  fatherId: string | null;
  mother?: SheepRecord | null;
  father?: SheepRecord | null;
  childrenAsMother?: SheepRecord[];
  childrenAsFather?: SheepRecord[];
  weights?: WeightRecordData[];
  healthRecords?: HealthRecordData[];
  photos?: PhotoData[];
  transactions?: TransactionData[];
  createdAt: string;
  updatedAt: string;
}

// Extended type returned by sheep:getById — includes full nested relations
export interface SheepDetail extends SheepRecord {
  mother: (SheepRecord & {
    mother?: SheepRecord | null;
    father?: SheepRecord | null;
  }) | null;
  father: (SheepRecord & {
    mother?: SheepRecord | null;
    father?: SheepRecord | null;
  }) | null;
  childrenAsMother: SheepRecord[];
  childrenAsFather: SheepRecord[];
  weights: WeightRecordData[];
  healthRecords: HealthRecordData[];
  photos: PhotoData[];
  transactions: TransactionData[];
  littersMother: LitterData[];
  littersFather: LitterData[];
}

export interface WeightRecordData {
  id?: string;
  weight: number;
  date: string;
  type: 'BIRTH' | 'WEANING' | 'ADULT' | 'CUSTOM';
  sheepId: string;
  createdAt?: string;
}

export interface HealthRecordData {
  id?: string;
  date: string;
  type: 'VACCINE' | 'DEWORMING' | 'VET_VISIT' | 'HOOF';
  description: string;
  medication?: string;
  withdrawalDays?: number;
  cost?: number;
  attachmentUrl?: string;
  sheepId: string;
  createdAt?: string;
}

// Health record with sheep info (from health:getAllGlobal)
export interface GlobalHealthRecord extends HealthRecordData {
  id: string;
  sheep: { id: string; earTag: string; name: string | null; sex: string; status: string };
}

export interface LitterData {
  id?: string;
  matingDate?: string;
  lambingDate?: string;
  bornCount: number;
  weanedCount?: number;
  motherId: string;
  fatherId?: string;
  mother?: SheepRecord;
  father?: SheepRecord;
  createdAt?: string;
}

export interface TransactionData {
  id?: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: 'FEED' | 'VET' | 'SALE' | 'EQUIPMENT';
  amount: number;
  description?: string;
  sheepId?: string;
  sheep?: SheepRecord;
  createdAt?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  byCategory: Record<string, number>;
}

export interface PhotoData {
  id?: string;
  url: string;
  description?: string;
  sheepId: string;
  createdAt?: string;
}

export interface CommonAncestor extends SheepRecord {
  ramPaths: string[][];  // paths from Ram → ancestor (each path = array of names)
  ewePaths: string[][];  // paths from Ewe → ancestor
}

export interface InbreedingResult {
  isRelated: boolean;
  commonAncestors: CommonAncestor[];
  warningLevel: 'NONE' | 'LOW' | 'HIGH' | 'CRITICAL';
  message: string;
}

export interface DatabaseBackupResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface DatabaseInfo {
  path: string;
  exists: boolean;
  sizeKb: number;
}

export interface CalendarEventData {
  id?: string;
  date: string;
  title: string;
  description?: string;
  color?: string;
  type: 'REMINDER' | 'WITHDRAWAL' | 'LAMBING';
  sheepId?: string;
  auto?: boolean;
  createdAt?: string;
}

export interface MassHealthData {
  sheepIds: string[];
  date: string;
  type: string;
  description: string;
  medication?: string;
  withdrawalDays?: number;
  cost?: number;
}

export interface ElectronAPI {
  sheep: {
    getAll: (filters?: SheepFilters) => Promise<SheepRecord[]>;
    getById: (id: string) => Promise<SheepRecord | null>;
    create: (data: SheepData) => Promise<SheepRecord>;
    update: (id: string, data: Partial<SheepData>) => Promise<SheepRecord>;
    delete: (id: string) => Promise<void>;
    getAncestors: (id: string, depth?: number) => Promise<SheepRecord>;
    uploadPhoto: (sheepId: string) => Promise<{ imageUrl: string | null; canceled: boolean }>;
  };
  weights: {
    getAll: (sheepId: string) => Promise<WeightRecordData[]>;
    create: (data: WeightRecordData) => Promise<WeightRecordData>;
    update: (id: string, data: Partial<WeightRecordData>) => Promise<WeightRecordData>;
    delete: (id: string) => Promise<void>;
  };
  health: {
    getAll: (sheepId: string) => Promise<HealthRecordData[]>;
    getAllGlobal: (filters?: { type?: string }) => Promise<GlobalHealthRecord[]>;
    create: (data: HealthRecordData) => Promise<HealthRecordData>;
    update: (id: string, data: Partial<HealthRecordData>) => Promise<HealthRecordData>;
    createMass: (data: MassHealthData) => Promise<HealthRecordData[]>;
    delete: (id: string) => Promise<void>;
  };
  litters: {
    getAll: (filters?: { motherId?: string; fatherId?: string }) => Promise<LitterData[]>;
    create: (data: LitterData) => Promise<LitterData>;
    update: (id: string, data: Partial<LitterData>) => Promise<LitterData>;
    delete: (id: string) => Promise<void>;
  };
  transactions: {
    getAll: (filters?: { sheepId?: string; type?: string; category?: string }) => Promise<TransactionData[]>;
    create: (data: TransactionData) => Promise<TransactionData>;
    update: (id: string, data: Partial<TransactionData>) => Promise<TransactionData>;
    delete: (id: string) => Promise<void>;
    getSummary: (filters?: { sheepId?: string }) => Promise<TransactionSummary>;
  };
  breeding: {
    checkInbreeding: (ramId: string, eweId: string) => Promise<InbreedingResult>;
  };
  photos: {
    getAll: (sheepId: string) => Promise<PhotoData[]>;
    create: (data: PhotoData) => Promise<PhotoData>;
    delete: (id: string) => Promise<void>;
  };
  dialog: {
    savePdf: (data: ArrayBuffer, defaultName: string) => Promise<string | null>;
    saveCsv: (csvContent: string, defaultName: string) => Promise<string | null>;
  };
  database: {
    backup: () => Promise<DatabaseBackupResult>;
    info: () => Promise<DatabaseInfo>;
  };
  calendar: {
    getEvents: () => Promise<CalendarEventData[]>;
    create: (data: CalendarEventData) => Promise<CalendarEventData>;
    delete: (id: string) => Promise<void>;
  };
  pens: {
    seed: () => Promise<{ seeded: boolean }>;
    getAll: () => Promise<PenData[]>;
    moveSheep: (sheepId: string, penId: string | null) => Promise<void>;
    update: (id: string, data: { name: string; description?: string }) => Promise<PenData>;
    create: (data: { name: string; description?: string }) => Promise<PenData>;
    delete: (id: string) => Promise<void>;
  };
}

export interface PenData {
  id: string;
  name: string;
  description?: string | null;
  sheep: Array<{
    id: string;
    earTag: string;
    name?: string | null;
    sex: string;
    status: string;
  }>;
  createdAt?: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

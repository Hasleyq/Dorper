/**
 * Web API Bridge for Dorper Web Application
 * Automatically polyfills window.electronAPI when running in a standard web browser (desktop/mobile),
 * directing calls to the backend via /api/rpc.
 */

async function rpcCall<T = any>(channel: string, ...args: any[]): Promise<T> {
  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, args }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RPC error [${channel}]: ${errorText || response.statusText}`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || `RPC [${channel}] failed`);
  }

  return json.data;
}

// Download helper for web browser
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function initWebApiBridge() {
  if (typeof window === 'undefined') return;

  // Only polyfill if electronAPI is not present
  if ((window as any).electronAPI) return;

  (window as any).electronAPI = {
    // Sheep
    sheep: {
      getAll: (filters?: any) => rpcCall('sheep:getAll', filters || {}),
      getById: (id: string) => rpcCall('sheep:getById', id),
      create: (data: any) => rpcCall('sheep:create', data),
      update: (id: string, data: any) => rpcCall('sheep:update', id, data),
      delete: (id: string) => rpcCall('sheep:delete', id),
      getAncestors: (id: string, depth?: number) => rpcCall('sheep:getAncestors', id, depth),
      uploadPhoto: async (sheepId: string) => {
        console.warn('Photo upload in web mode will be handled via standard file input');
        return null;
      },
    },

    // Weights
    weights: {
      getAll: (sheepId: string) => rpcCall('weights:getAll', sheepId),
      create: (data: any) => rpcCall('weights:create', data),
      update: (id: string, data: any) => rpcCall('weights:update', id, data),
      delete: (id: string) => rpcCall('weights:delete', id),
    },

    // Health
    health: {
      getAll: (sheepId: string) => rpcCall('health:getAll', sheepId),
      getAllGlobal: (filters?: any) => rpcCall('health:getAllGlobal', filters || {}),
      create: (data: any) => rpcCall('health:create', data),
      update: (id: string, data: any) => rpcCall('health:update', id, data),
      createMass: (data: any) => rpcCall('health:createMass', data),
      delete: (id: string) => rpcCall('health:delete', id),
    },

    // Litters
    litters: {
      getAll: (filters?: any) => rpcCall('litters:getAll', filters || {}),
      create: (data: any) => rpcCall('litters:create', data),
      update: (id: string, data: any) => rpcCall('litters:update', id, data),
      delete: (id: string) => rpcCall('litters:delete', id),
    },

    // Transactions
    transactions: {
      getAll: (filters?: any) => rpcCall('transactions:getAll', filters || {}),
      create: (data: any) => rpcCall('transactions:create', data),
      update: (id: string, data: any) => rpcCall('transactions:update', id, data),
      delete: (id: string) => rpcCall('transactions:delete', id),
      getSummary: (filters?: any) => rpcCall('transactions:getSummary', filters || {}),
    },

    // Breeding
    breeding: {
      checkInbreeding: (ramId: string, eweId: string) => rpcCall('breeding:checkInbreeding', ramId, eweId),
    },

    // Photos
    photos: {
      getAll: (sheepId: string) => rpcCall('photos:getAll', sheepId),
      create: (data: any) => rpcCall('photos:create', data),
      delete: (id: string) => rpcCall('photos:delete', id),
    },

    // Dialog / File operations (Web browser downloads!)
    dialog: {
      savePdf: async (data: Uint8Array | number[] | ArrayBuffer, defaultName?: string) => {
        const filename = defaultName || 'certyfikat.pdf';
        const blob = new Blob([data as any], { type: 'application/pdf' });
        downloadBlob(blob, filename);
        return filename;
      },
      saveCsv: async (csvContent: string, defaultName?: string) => {
        const filename = defaultName || 'eksport.csv';
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, filename);
        return filename;
      },
    },

    // Database utilities
    database: {
      backup: () => rpcCall('database:backup'),
      info: () => rpcCall('database:info'),
    },

    // Calendar
    calendar: {
      getEvents: () => rpcCall('calendar:getEvents'),
      create: (data: any) => rpcCall('calendar:create', data),
      delete: (id: string) => rpcCall('calendar:delete', id),
    },

    // Pens (Kojce)
    pens: {
      seed: () => rpcCall('pens:seed'),
      getAll: (includeArchived?: boolean) => rpcCall('pens:getAll', includeArchived),
      getArchived: () => rpcCall('pens:getArchived'),
      archive: (id: string, options?: any) => rpcCall('pens:archive', id, options),
      restore: (id: string) => rpcCall('pens:restore', id),
      moveSheep: (sheepId: string, penId: string) => rpcCall('pens:moveSheep', sheepId, penId),
      update: (id: string, data: any) => rpcCall('pens:update', id, data),
      create: (data: any) => rpcCall('pens:create', data),
      delete: (id: string) => rpcCall('pens:delete', id),
    },

    // Settings
    settings: {
      get: (key: string) => rpcCall('settings:get', key),
      set: (key: string, value: any) => rpcCall('settings:set', key, value),
      getAll: () => rpcCall('settings:getAll'),
    },
  };

  console.log('🌐 Web API Bridge initialized — connected to database via HTTP RPC');
}

// Auto-init immediately on load
initWebApiBridge();

const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // ============================================
  // SHEEP CRUD
  // ============================================
  sheep: {
    getAll: (filters) => ipcRenderer.invoke('sheep:getAll', filters),
    getById: (id) => ipcRenderer.invoke('sheep:getById', id),
    create: (data) => ipcRenderer.invoke('sheep:create', data),
    update: (id, data) => ipcRenderer.invoke('sheep:update', id, data),
    delete: (id) => ipcRenderer.invoke('sheep:delete', id),
    getAncestors: (id, depth) => ipcRenderer.invoke('sheep:getAncestors', id, depth),
    uploadPhoto: (sheepId) => ipcRenderer.invoke('sheep:uploadPhoto', sheepId),
  },

  // ============================================
  // WEIGHT RECORDS
  // ============================================
  weights: {
    getAll: (sheepId) => ipcRenderer.invoke('weights:getAll', sheepId),
    create: (data) => ipcRenderer.invoke('weights:create', data),
    update: (id, data) => ipcRenderer.invoke('weights:update', id, data),
    delete: (id) => ipcRenderer.invoke('weights:delete', id),
  },

  // ============================================
  // HEALTH RECORDS
  // ============================================
  health: {
    getAll: (sheepId) => ipcRenderer.invoke('health:getAll', sheepId),
    getAllGlobal: (filters) => ipcRenderer.invoke('health:getAllGlobal', filters),
    create: (data) => ipcRenderer.invoke('health:create', data),
    update: (id, data) => ipcRenderer.invoke('health:update', id, data),
    createMass: (data) => ipcRenderer.invoke('health:createMass', data),
    delete: (id) => ipcRenderer.invoke('health:delete', id),
  },

  // ============================================
  // LITTERS
  // ============================================
  litters: {
    getAll: (filters) => ipcRenderer.invoke('litters:getAll', filters),
    create: (data) => ipcRenderer.invoke('litters:create', data),
    update: (id, data) => ipcRenderer.invoke('litters:update', id, data),
    delete: (id) => ipcRenderer.invoke('litters:delete', id),
  },

  // ============================================
  // TRANSACTIONS
  // ============================================
  transactions: {
    getAll: (filters) => ipcRenderer.invoke('transactions:getAll', filters),
    create: (data) => ipcRenderer.invoke('transactions:create', data),
    update: (id, data) => ipcRenderer.invoke('transactions:update', id, data),
    delete: (id) => ipcRenderer.invoke('transactions:delete', id),
    getSummary: (filters) => ipcRenderer.invoke('transactions:getSummary', filters),
  },

  // ============================================
  // BREEDING / INBREEDING CHECK
  // ============================================
  breeding: {
    checkInbreeding: (ramId, eweId) => ipcRenderer.invoke('breeding:checkInbreeding', ramId, eweId),
  },

  // ============================================
  // PHOTOS
  // ============================================
  photos: {
    getAll: (sheepId) => ipcRenderer.invoke('photos:getAll', sheepId),
    create: (data) => ipcRenderer.invoke('photos:create', data),
    delete: (id) => ipcRenderer.invoke('photos:delete', id),
  },

  // ============================================
  // DIALOG / FILE OPERATIONS
  // ============================================
  dialog: {
    savePdf: (data, defaultName) => ipcRenderer.invoke('dialog:savePdf', data, defaultName),
    saveCsv: (csvContent, defaultName) => ipcRenderer.invoke('dialog:saveCsv', csvContent, defaultName),
  },

  // ============================================
  // DATABASE UTILITIES
  // ============================================
  database: {
    backup: () => ipcRenderer.invoke('database:backup'),
    info: () => ipcRenderer.invoke('database:info'),
  },

  // ============================================
  // CALENDAR
  // ============================================
  calendar: {
    getEvents: () => ipcRenderer.invoke('calendar:getEvents'),
    create: (data) => ipcRenderer.invoke('calendar:create', data),
    delete: (id) => ipcRenderer.invoke('calendar:delete', id),
  },

  // ============================================
  // PENS (Kojce)
  // ============================================
  pens: {
    seed: () => ipcRenderer.invoke('pens:seed'),
    getAll: (includeArchived) => ipcRenderer.invoke('pens:getAll', includeArchived),
    getArchived: () => ipcRenderer.invoke('pens:getArchived'),
    archive: (id, options) => ipcRenderer.invoke('pens:archive', id, options),
    restore: (id) => ipcRenderer.invoke('pens:restore', id),
    moveSheep: (sheepId, penId) => ipcRenderer.invoke('pens:moveSheep', sheepId, penId),
    update: (id, data) => ipcRenderer.invoke('pens:update', id, data),
    create: (data) => ipcRenderer.invoke('pens:create', data),
    delete: (id) => ipcRenderer.invoke('pens:delete', id),
  },
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
});


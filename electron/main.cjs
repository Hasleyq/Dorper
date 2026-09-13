const { app, BrowserWindow, ipcMain, dialog, protocol, net, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { disconnectDatabase } = require('./database.cjs');

// Import all IPC handler registrators
const { registerSheepHandlers } = require('./handlers/sheep.cjs');
const { registerBreedingHandlers } = require('./handlers/breeding.cjs');
const { registerWeightHandlers } = require('./handlers/weights.cjs');
const { registerHealthHandlers } = require('./handlers/health.cjs');
const { registerLitterHandlers } = require('./handlers/litters.cjs');
const { registerTransactionHandlers } = require('./handlers/transactions.cjs');
const { registerPhotoHandlers } = require('./handlers/photos.cjs');
const { registerDatabaseHandlers } = require('./handlers/database.cjs');
const { registerCalendarHandlers } = require('./handlers/calendar.cjs');
const { registerPenHandlers } = require('./handlers/pens.cjs');
const { registerSettingHandlers } = require('./handlers/settings.cjs');

let mainWindow;

// Disable GPU acceleration — fixes invisible window on some Windows systems
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

function createWindow() {
  console.log('🪟 Creating BrowserWindow...');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    center: true,
    minWidth: 1100,
    minHeight: 700,
    show: true,
    title: 'Dorper Breeding Manager',
    icon: path.join(__dirname, '../public/favicon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
  });

  console.log('🪟 BrowserWindow created, isVisible:', mainWindow.isVisible());
  console.log('🪟 Window bounds:', JSON.stringify(mainWindow.getBounds()));

  // In development, load from Vite dev server
  if (process.env.NODE_ENV !== 'production') {
    console.log('🪟 Loading URL: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173').then(() => {
      console.log('🪟 URL loaded successfully');
      console.log('🪟 isVisible after load:', mainWindow.isVisible());
      mainWindow.show();
      mainWindow.focus();
    }).catch((err) => {
      console.error('❌ Failed to load URL:', err);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================
// REGISTER ALL IPC HANDLERS
// ============================================
function registerAllHandlers() {
  registerSheepHandlers(ipcMain);
  registerBreedingHandlers(ipcMain);
  registerWeightHandlers(ipcMain);
  registerHealthHandlers(ipcMain);
  registerLitterHandlers(ipcMain);
  registerTransactionHandlers(ipcMain);
  registerPhotoHandlers(ipcMain);
  registerDatabaseHandlers(ipcMain);
  registerCalendarHandlers(ipcMain);
  registerPenHandlers(ipcMain);
  registerSettingHandlers(ipcMain);

  // ============================================
  // DIALOG / FILE OPERATIONS
  // ============================================
  ipcMain.handle('dialog:savePdf', async (_event, data, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Zapisz certyfikat PDF',
      defaultPath: defaultName || 'certyfikat.pdf',
      filters: [
        { name: 'Dokumenty PDF', extensions: ['pdf'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    fs.writeFileSync(result.filePath, Buffer.from(data));
    return result.filePath;
  });

  ipcMain.handle('dialog:saveCsv', async (_event, csvContent, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Eksportuj dane do CSV',
      defaultPath: defaultName || 'eksport.csv',
      filters: [
        { name: 'Pliki CSV', extensions: ['csv'] },
        { name: 'Wszystkie pliki', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    // Write with BOM for Excel to detect UTF-8
    const bom = '\uFEFF';
    fs.writeFileSync(result.filePath, bom + csvContent, 'utf8');
    return result.filePath;
  });

  console.log('✅ All IPC handlers registered');
}

// ============================================
// APP LIFECYCLE
// ============================================
app.whenReady().then(() => {
  // Register custom protocol for serving local photos to the renderer
  protocol.handle('local-file', (request) => {
    // URL format: local-file://C:/path/to/file.jpg
    // Strip the protocol prefix and decode the path
    const filePath = decodeURIComponent(request.url.replace('local-file://', ''));
    return net.fetch('file://' + filePath);
  });

  registerAllHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await disconnectDatabase();
});

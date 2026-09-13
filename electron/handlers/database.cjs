const { dialog } = require('electron');
const fs = require('fs');
const { getDatabasePath } = require('../database.cjs');

/**
 * Register Database utility IPC handlers (backup, info, etc.)
 * @param {Electron.IpcMain} ipcMain
 */
function registerDatabaseHandlers(ipcMain) {
  // Backup the SQLite database to a user-chosen location
  ipcMain.handle('database:backup', async (_event) => {
    const dbPath = getDatabasePath();

    // Verify the database file exists
    if (!fs.existsSync(dbPath)) {
      return { success: false, error: 'Plik bazy danych nie został znaleziony.' };
    }

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const defaultName = `dorper_backup_${timestamp}.db`;

    const result = await dialog.showSaveDialog({
      title: 'Zapisz kopię zapasową bazy danych',
      defaultPath: defaultName,
      filters: [
        { name: 'SQLite Database', extensions: ['db', 'sqlite'] },
        { name: 'Wszystkie pliki', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Anulowano przez użytkownika.' };
    }

    try {
      fs.copyFileSync(dbPath, result.filePath);
      return { success: true, path: result.filePath };
    } catch (err) {
      return { success: false, error: `Błąd zapisu: ${err.message}` };
    }
  });

  // Get database info (path, size, etc.)
  ipcMain.handle('database:info', async (_event) => {
    const dbPath = getDatabasePath();
    let sizeKb = 0;
    let exists = false;

    try {
      const stats = fs.statSync(dbPath);
      exists = true;
      sizeKb = Math.round(stats.size / 1024);
    } catch {
      // File doesn't exist
    }

    return {
      path: dbPath,
      exists,
      sizeKb,
    };
  });
}

module.exports = { registerDatabaseHandlers };

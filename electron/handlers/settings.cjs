const { getDatabase } = require('../database.cjs');

/**
 * Register App Settings IPC handlers
 * @param {Electron.IpcMain} ipcMain
 */
function registerSettingHandlers(ipcMain) {
  ipcMain.handle('settings:get', async (_event, key) => {
    const prisma = getDatabase();
    const item = await prisma.appSetting.findUnique({
      where: { key },
    });
    return item ? item.value : null;
  });

  ipcMain.handle('settings:set', async (_event, key, value) => {
    const prisma = getDatabase();
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);
    const item = await prisma.appSetting.upsert({
      where: { key },
      update: { value: strVal },
      create: { key, value: strVal },
    });
    return item.value;
  });

  ipcMain.handle('settings:getAll', async () => {
    const prisma = getDatabase();
    const items = await prisma.appSetting.findMany();
    const result = {};
    for (const item of items) {
      result[item.key] = item.value;
    }
    return result;
  });
}

module.exports = { registerSettingHandlers };

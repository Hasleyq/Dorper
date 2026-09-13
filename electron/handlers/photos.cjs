const { getDatabase } = require('../database.cjs');

/**
 * Register Photo IPC handlers
 * @param {Electron.IpcMain} ipcMain
 */
function registerPhotoHandlers(ipcMain) {
  ipcMain.handle('photos:getAll', async (_event, sheepId) => {
    const prisma = getDatabase();
    return prisma.photo.findMany({
      where: { sheepId },
      orderBy: { createdAt: 'desc' },
    });
  });

  ipcMain.handle('photos:create', async (_event, data) => {
    const prisma = getDatabase();
    return prisma.photo.create({
      data: {
        url: data.url,
        description: data.description || null,
        sheepId: data.sheepId,
      },
    });
  });

  ipcMain.handle('photos:delete', async (_event, id) => {
    const prisma = getDatabase();
    await prisma.photo.delete({ where: { id } });
    return { success: true };
  });
}

module.exports = { registerPhotoHandlers };

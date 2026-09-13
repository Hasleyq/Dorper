const { getDatabase } = require('../database.cjs');

/**
 * Register Weight Record IPC handlers
 * @param {Electron.IpcMain} ipcMain
 */
function registerWeightHandlers(ipcMain) {
  ipcMain.handle('weights:getAll', async (_event, sheepId) => {
    const prisma = getDatabase();
    return prisma.weightRecord.findMany({
      where: { sheepId },
      orderBy: { date: 'asc' },
    });
  });

  ipcMain.handle('weights:create', async (_event, data) => {
    const prisma = getDatabase();
    return prisma.weightRecord.create({
      data: {
        weight: data.weight,
        date: new Date(data.date),
        type: data.type,
        sheepId: data.sheepId,
      },
    });
  });

  ipcMain.handle('weights:update', async (_event, id, data) => {
    const prisma = getDatabase();
    const updateData = {};
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.type !== undefined) updateData.type = data.type;

    return prisma.weightRecord.update({
      where: { id },
      data: updateData,
    });
  });

  ipcMain.handle('weights:delete', async (_event, id) => {
    const prisma = getDatabase();
    await prisma.weightRecord.delete({ where: { id } });
    return { success: true };
  });
}

module.exports = { registerWeightHandlers };

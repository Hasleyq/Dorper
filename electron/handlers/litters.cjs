const { getDatabase } = require('../database.cjs');

/**
 * Register Litter IPC handlers
 * @param {Electron.IpcMain} ipcMain
 */
function registerLitterHandlers(ipcMain) {
  ipcMain.handle('litters:getAll', async (_event, filters = {}) => {
    const prisma = getDatabase();

    const where = {};
    if (filters.motherId) where.motherId = filters.motherId;
    if (filters.fatherId) where.fatherId = filters.fatherId;

    return prisma.litter.findMany({
      where,
      include: {
        mother: { select: { id: true, earTag: true, name: true } },
        father: { select: { id: true, earTag: true, name: true } },
      },
      orderBy: { lambingDate: 'desc' },
    });
  });

  ipcMain.handle('litters:create', async (_event, data) => {
    const prisma = getDatabase();
    return prisma.litter.create({
      data: {
        matingDate: data.matingDate ? new Date(data.matingDate) : null,
        lambingDate: data.lambingDate ? new Date(data.lambingDate) : null,
        bornCount: data.bornCount,
        weanedCount: data.weanedCount || null,
        motherId: data.motherId,
        fatherId: data.fatherId || null,
      },
      include: {
        mother: { select: { id: true, earTag: true, name: true } },
        father: { select: { id: true, earTag: true, name: true } },
      },
    });
  });

  ipcMain.handle('litters:update', async (_event, id, data) => {
    const prisma = getDatabase();

    const updateData = {};
    if (data.matingDate !== undefined) updateData.matingDate = data.matingDate ? new Date(data.matingDate) : null;
    if (data.lambingDate !== undefined) updateData.lambingDate = data.lambingDate ? new Date(data.lambingDate) : null;
    if (data.bornCount !== undefined) updateData.bornCount = data.bornCount;
    if (data.weanedCount !== undefined) updateData.weanedCount = data.weanedCount;
    if (data.fatherId !== undefined) updateData.fatherId = data.fatherId || null;

    return prisma.litter.update({
      where: { id },
      data: updateData,
      include: {
        mother: { select: { id: true, earTag: true, name: true } },
        father: { select: { id: true, earTag: true, name: true } },
      },
    });
  });

  ipcMain.handle('litters:delete', async (_event, id) => {
    const prisma = getDatabase();
    await prisma.litter.delete({ where: { id } });
    return { success: true };
  });
}

module.exports = { registerLitterHandlers };

const { getDatabase } = require('../database.cjs');

/**
 * Register Health Record IPC handlers
 * @param {Electron.IpcMain} ipcMain
 */
function registerHealthHandlers(ipcMain) {
  // Get health records for a single sheep
  ipcMain.handle('health:getAll', async (_event, sheepId) => {
    const prisma = getDatabase();
    return prisma.healthRecord.findMany({
      where: { sheepId },
      orderBy: { date: 'desc' },
    });
  });

  // Get ALL health records across the entire flock (global view)
  ipcMain.handle('health:getAllGlobal', async (_event, filters = {}) => {
    const prisma = getDatabase();

    const where = {};
    if (filters.type) where.type = filters.type;

    return prisma.healthRecord.findMany({
      where,
      include: {
        sheep: {
          select: { id: true, earTag: true, name: true, sex: true, status: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  });

  ipcMain.handle('health:create', async (_event, data) => {
    const prisma = getDatabase();
    return prisma.healthRecord.create({
      data: {
        date: new Date(data.date),
        type: data.type,
        description: data.description,
        medication: data.medication || null,
        withdrawalDays: data.withdrawalDays || null,
        cost: data.cost || null,
        attachmentUrl: data.attachmentUrl || null,
        sheepId: data.sheepId,
      },
      include: {
        sheep: {
          select: { id: true, earTag: true, name: true },
        },
      },
    });
  });

  ipcMain.handle('health:update', async (_event, id, data) => {
    const prisma = getDatabase();
    const updateData = {};
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.medication !== undefined) updateData.medication = data.medication || null;
    if (data.withdrawalDays !== undefined) updateData.withdrawalDays = data.withdrawalDays || null;
    if (data.cost !== undefined) updateData.cost = data.cost || null;

    return prisma.healthRecord.update({
      where: { id },
      data: updateData,
      include: {
        sheep: { select: { id: true, earTag: true, name: true, sex: true, status: true } },
      },
    });
  });

  ipcMain.handle('health:createMass', async (_event, data) => {
    const prisma = getDatabase();
    const { sheepIds, ...recordData } = data;
    const results = [];
    for (const sheepId of sheepIds) {
      const record = await prisma.healthRecord.create({
        data: {
          date: new Date(recordData.date),
          type: recordData.type,
          description: recordData.description,
          medication: recordData.medication || null,
          withdrawalDays: recordData.withdrawalDays || null,
          cost: recordData.cost || null,
          sheepId,
        },
        include: {
          sheep: { select: { id: true, earTag: true, name: true } },
        },
      });
      results.push(record);
    }
    return results;
  });

  ipcMain.handle('health:delete', async (_event, id) => {
    const prisma = getDatabase();
    await prisma.healthRecord.delete({ where: { id } });
    return { success: true };
  });
}

module.exports = { registerHealthHandlers };

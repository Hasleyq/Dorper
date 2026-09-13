const { getDatabase } = require('../database.cjs');

/**
 * Register Pen IPC handlers
 * @param {Electron.IpcMain} ipcMain
 */
function registerPenHandlers(ipcMain) {
  // Seed default pens if none exist + assign unassigned sheep to Boks 1
  ipcMain.handle('pens:seed', async () => {
    const prisma = getDatabase();
    let pens = await prisma.pen.findMany({ orderBy: { name: 'asc' } });

    // Create default pens if none exist
    if (pens.length === 0) {
      await prisma.pen.create({ data: { name: 'Boks 1', description: 'Główny boks hodowlany' } });
      await prisma.pen.create({ data: { name: 'Boks 2', description: 'Boks dla matek z jagniętami' } });
      await prisma.pen.create({ data: { name: 'Boks 3', description: 'Boks kwarantanny' } });
      pens = await prisma.pen.findMany({ orderBy: { name: 'asc' } });
    }

    // Find all sheep that have no pen assigned and put them in the first pen
    const unassigned = await prisma.sheep.findMany({
      where: { penId: null, status: 'ACTIVE' },
      select: { id: true },
    });

    if (unassigned.length > 0 && pens.length > 0) {
      const defaultPenId = pens[0].id; // "Boks 1"
      await prisma.sheep.updateMany({
        where: {
          id: { in: unassigned.map((s) => s.id) },
        },
        data: { penId: defaultPenId },
      });
    }

    return { message: 'Pens ready', seeded: true, count: pens.length };
  });

  // Get all pens with their sheep
  ipcMain.handle('pens:getAll', async () => {
    const prisma = getDatabase();
    return prisma.pen.findMany({
      include: {
        sheep: {
          select: {
            id: true,
            earTag: true,
            name: true,
            sex: true,
            status: true,
          },
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  });

  // Move a sheep to a different pen
  ipcMain.handle('pens:moveSheep', async (_event, sheepId, penId) => {
    const prisma = getDatabase();
    return prisma.sheep.update({
      where: { id: sheepId },
      data: { penId: penId || null },
    });
  });

  // Update a pen's name/description
  ipcMain.handle('pens:update', async (_event, id, data) => {
    const prisma = getDatabase();
    return prisma.pen.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
      },
    });
  });

  // Create a new pen
  ipcMain.handle('pens:create', async (_event, data) => {
    const prisma = getDatabase();
    return prisma.pen.create({
      data: {
        name: data.name,
        description: data.description || null,
      },
    });
  });

  // Delete a pen (unassign sheep first)
  ipcMain.handle('pens:delete', async (_event, id) => {
    const prisma = getDatabase();
    await prisma.sheep.updateMany({
      where: { penId: id },
      data: { penId: null },
    });
    await prisma.pen.delete({ where: { id } });
    return { success: true };
  });
}

module.exports = { registerPenHandlers };

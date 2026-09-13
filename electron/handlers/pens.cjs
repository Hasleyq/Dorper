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

  // Get all active pens with their sheep (with ram first)
  ipcMain.handle('pens:getAll', async (_event, includeArchived = false) => {
    const prisma = getDatabase();
    const where = includeArchived ? {} : { isArchived: false };

    const pens = await prisma.pen.findMany({
      where,
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
        },
      },
      orderBy: { name: 'asc' },
    });

    // Ensure MALE (tryk) is always first, then FEMALE (owce)
    return pens.map((pen) => ({
      ...pen,
      sheep: [...pen.sheep].sort((a, b) => {
        if (a.sex === 'MALE' && b.sex !== 'MALE') return -1;
        if (a.sex !== 'MALE' && b.sex === 'MALE') return 1;
        return a.earTag.localeCompare(b.earTag);
      }),
    }));
  });

  // Get all archived pens
  ipcMain.handle('pens:getArchived', async () => {
    const prisma = getDatabase();
    const pens = await prisma.pen.findMany({
      where: { isArchived: true },
      orderBy: { endDate: 'desc' },
    });

    return pens.map((pen) => {
      let history = null;
      if (pen.historyData) {
        try {
          history = JSON.parse(pen.historyData);
        } catch {
          history = null;
        }
      }
      return {
        ...pen,
        history,
      };
    });
  });

  // Archive a pen with full snapshot of ram, ewes, lambs and notes
  ipcMain.handle('pens:archive', async (_event, id, options = {}) => {
    const prisma = getDatabase();
    const { endDate, notes, releaseSheep = true } = options;

    // Get current pen with all sheep
    const current = await prisma.pen.findUnique({
      where: { id },
      include: {
        sheep: {
          select: { id: true, earTag: true, name: true, sex: true, status: true },
        },
      },
    });

    if (!current) throw new Error('Nie znaleziono boksu');

    const ram = current.sheep.find((s) => s.sex === 'MALE') || null;
    const ewes = current.sheep.filter((s) => s.sex === 'FEMALE');

    // Check litters and sheep associated with this ram and these ewes
    let lambs = [];
    if (Array.isArray(options.lambs) && options.lambs.length > 0) {
      lambs = [...options.lambs];
    } else if (ram && ewes.length > 0) {
      const eweIds = ewes.map((e) => e.id);
      
      // Litters
      const litters = await prisma.litter.findMany({
        where: {
          fatherId: ram.id,
          motherId: { in: eweIds },
        },
      });

      for (const l of litters) {
        if (l.lambsData) {
          try {
            const parsed = JSON.parse(l.lambsData);
            lambs.push(...parsed);
          } catch {}
        }
      }

      // Direct sheep records
      const children = await prisma.sheep.findMany({
        where: {
          fatherId: ram.id,
          motherId: { in: eweIds },
        },
        select: { id: true, earTag: true, name: true, sex: true },
      });

      for (const c of children) {
        if (!lambs.some((l) => (l.id && l.id === c.id) || (l.earTag && l.earTag.trim().toLowerCase() === c.earTag.trim().toLowerCase()))) {
          lambs.push({
            id: c.id,
            earTag: c.earTag,
            name: c.name || undefined,
            sex: c.sex,
          });
        }
      }
    }

    const startDateVal = options.startDate || current.startDate || current.createdAt;

    const snapshot = {
      closedAt: new Date().toISOString(),
      startDate: startDateVal ? new Date(startDateVal).toISOString() : new Date().toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : new Date().toISOString(),
      ram: ram ? { id: ram.id, earTag: ram.earTag, name: ram.name } : null,
      ewes: ewes.map((e) => ({ id: e.id, earTag: e.earTag, name: e.name })),
      lambsCount: lambs.length,
      lambs,
      notes: notes || '',
    };

    // If releaseSheep is selected, remove sheep from this pen
    if (releaseSheep) {
      await prisma.sheep.updateMany({
        where: { penId: id },
        data: { penId: null },
      });
    }

    // Update pen as archived
    return prisma.pen.update({
      where: { id },
      data: {
        isArchived: true,
        endDate: endDate ? new Date(endDate) : new Date(),
        historyData: JSON.stringify(snapshot),
      },
    });
  });

  // Restore pen from archive
  ipcMain.handle('pens:restore', async (_event, id) => {
    const prisma = getDatabase();
    return prisma.pen.update({
      where: { id },
      data: {
        isArchived: false,
        endDate: null,
      },
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

  // Update a pen's name/description/startDate
  ipcMain.handle('pens:update', async (_event, id, data) => {
    const prisma = getDatabase();
    const updateData = {
      name: data.name,
      description: data.description || null,
    };
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    return prisma.pen.update({
      where: { id },
      data: updateData,
    });
  });

  // Create a new pen
  ipcMain.handle('pens:create', async (_event, data) => {
    const prisma = getDatabase();
    return prisma.pen.create({
      data: {
        name: data.name,
        description: data.description || null,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        isArchived: false,
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

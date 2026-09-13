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

    const litters = await prisma.litter.findMany({
      where,
      include: {
        mother: { select: { id: true, earTag: true, name: true } },
        father: { select: { id: true, earTag: true, name: true } },
      },
      orderBy: { lambingDate: 'desc' },
    });

    // Resolve lambs for each litter (from lambsData or from database sheep records)
    const enriched = await Promise.all(
      litters.map(async (litter) => {
        let lambs = [];
        if (litter.lambsData) {
          try {
            lambs = JSON.parse(litter.lambsData);
          } catch {
            lambs = [];
          }
        }

        // If lambsData is empty, try to find matching sheep by mother/father/date
        if (lambs.length === 0 && litter.motherId && litter.lambingDate) {
          const lDate = new Date(litter.lambingDate);
          const startOfDay = new Date(lDate.getFullYear(), lDate.getMonth(), lDate.getDate(), 0, 0, 0);
          const endOfDay = new Date(lDate.getFullYear(), lDate.getMonth(), lDate.getDate(), 23, 59, 59);

          const found = await prisma.sheep.findMany({
            where: {
              motherId: litter.motherId,
              birthDate: { gte: startOfDay, lte: endOfDay },
            },
            select: { id: true, earTag: true, name: true, sex: true },
          });

          if (found.length > 0) {
            lambs = found;
          }
        }

        // Also ensure that each lamb with an earTag has its sheepId if it exists in DB
        const resolvedLambs = await Promise.all(
          lambs.map(async (lamb) => {
            if (!lamb.id && lamb.earTag) {
              const matched = await prisma.sheep.findUnique({
                where: { earTag: lamb.earTag },
                select: { id: true, name: true, sex: true },
              });
              if (matched) {
                return {
                  ...lamb,
                  id: matched.id,
                  name: lamb.name || matched.name,
                  sex: lamb.sex || matched.sex,
                };
              }
            }
            return lamb;
          })
        );

        return {
          ...litter,
          lambs: resolvedLambs,
        };
      })
    );

    return enriched;
  });

  ipcMain.handle('litters:create', async (_event, data) => {
    const prisma = getDatabase();
    const created = await prisma.litter.create({
      data: {
        matingDate: data.matingDate ? new Date(data.matingDate) : null,
        lambingDate: data.lambingDate ? new Date(data.lambingDate) : null,
        bornCount: data.bornCount,
        weanedCount: data.weanedCount || null,
        motherId: data.motherId,
        fatherId: data.fatherId || null,
        lambsData: data.lambsData || null,
      },
      include: {
        mother: { select: { id: true, earTag: true, name: true } },
        father: { select: { id: true, earTag: true, name: true } },
      },
    });

    let lambs = [];
    if (created.lambsData) {
      try { lambs = JSON.parse(created.lambsData); } catch {}
    }
    return { ...created, lambs };
  });

  ipcMain.handle('litters:update', async (_event, id, data) => {
    const prisma = getDatabase();

    const updateData = {};
    if (data.matingDate !== undefined) updateData.matingDate = data.matingDate ? new Date(data.matingDate) : null;
    if (data.lambingDate !== undefined) updateData.lambingDate = data.lambingDate ? new Date(data.lambingDate) : null;
    if (data.bornCount !== undefined) updateData.bornCount = data.bornCount;
    if (data.weanedCount !== undefined) updateData.weanedCount = data.weanedCount;
    if (data.fatherId !== undefined) updateData.fatherId = data.fatherId || null;
    if (data.lambsData !== undefined) updateData.lambsData = data.lambsData || null;

    const updated = await prisma.litter.update({
      where: { id },
      data: updateData,
      include: {
        mother: { select: { id: true, earTag: true, name: true } },
        father: { select: { id: true, earTag: true, name: true } },
      },
    });

    let lambs = [];
    if (updated.lambsData) {
      try { lambs = JSON.parse(updated.lambsData); } catch {}
    }
    return { ...updated, lambs };
  });

  ipcMain.handle('litters:delete', async (_event, id) => {
    const prisma = getDatabase();
    await prisma.litter.delete({ where: { id } });
    return { success: true };
  });
}

module.exports = { registerLitterHandlers };

const { getDatabase } = require('../database.cjs');

/**
 * Register all Sheep CRUD IPC handlers
 * @param {Electron.IpcMain} ipcMain
 */
function registerSheepHandlers(ipcMain) {
  // ============================================
  // GET ALL SHEEP (with filtering)
  // ============================================
  ipcMain.handle('sheep:getAll', async (_event, filters = {}) => {
    const prisma = getDatabase();

    const where = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.sex) {
      where.sex = filters.sex;
    }

    if (filters.search) {
      where.OR = [
        { earTag: { contains: filters.search } },
        { name: { contains: filters.search } },
      ];
    }

    const sheep = await prisma.sheep.findMany({
      where,
      include: {
        mother: { select: { id: true, earTag: true, name: true } },
        father: { select: { id: true, earTag: true, name: true } },
        weights: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        healthRecords: {
          where: { withdrawalDays: { gt: 0 } },
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sheep;
  });

  // ============================================
  // GET SHEEP BY ID (full detail)
  // ============================================
  ipcMain.handle('sheep:getById', async (_event, id) => {
    const prisma = getDatabase();

    const sheep = await prisma.sheep.findUnique({
      where: { id },
      include: {
        mother: {
          include: {
            mother: { select: { id: true, earTag: true, name: true, sex: true } },
            father: { select: { id: true, earTag: true, name: true, sex: true } },
          },
        },
        father: {
          include: {
            mother: { select: { id: true, earTag: true, name: true, sex: true } },
            father: { select: { id: true, earTag: true, name: true, sex: true } },
          },
        },
        childrenAsMother: { select: { id: true, earTag: true, name: true, sex: true, birthDate: true, status: true } },
        childrenAsFather: { select: { id: true, earTag: true, name: true, sex: true, birthDate: true, status: true } },
        weights: { orderBy: { date: 'asc' } },
        healthRecords: { orderBy: { date: 'desc' } },
        photos: { orderBy: { createdAt: 'desc' } },
        transactions: { orderBy: { date: 'desc' } },
        littersMother: {
          include: {
            father: { select: { id: true, earTag: true, name: true } },
          },
          orderBy: { lambingDate: 'desc' },
        },
        littersFather: {
          include: {
            mother: { select: { id: true, earTag: true, name: true } },
          },
          orderBy: { lambingDate: 'desc' },
        },
      },
    });

    return sheep;
  });

  // ============================================
  // CREATE SHEEP
  // ============================================
  ipcMain.handle('sheep:create', async (_event, data) => {
    const prisma = getDatabase();

    const sheep = await prisma.sheep.create({
      data: {
        earTag: data.earTag,
        name: data.name || null,
        sex: data.sex,
        birthDate: new Date(data.birthDate),
        status: data.status || 'ACTIVE',
        lineage: data.lineage || null,
        motherId: data.motherId || null,
        fatherId: data.fatherId || null,
        customPedigree: data.customPedigree || null,
        classificationData: data.classificationData || null,
        breedPercentage: data.breedPercentage || '100',
      },
      include: {
        mother: { select: { id: true, earTag: true, name: true } },
        father: { select: { id: true, earTag: true, name: true } },
      },
    });

    return sheep;
  });

  // ============================================
  // UPDATE SHEEP
  // ============================================
  ipcMain.handle('sheep:update', async (_event, id, data) => {
    const prisma = getDatabase();

    const updateData = {};

    if (data.earTag !== undefined) updateData.earTag = data.earTag;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sex !== undefined) updateData.sex = data.sex;
    if (data.birthDate !== undefined) updateData.birthDate = new Date(data.birthDate);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.lineage !== undefined) updateData.lineage = data.lineage;
    if (data.motherId !== undefined) updateData.motherId = data.motherId || null;
    if (data.fatherId !== undefined) updateData.fatherId = data.fatherId || null;
    if (data.customPedigree !== undefined) updateData.customPedigree = data.customPedigree;
    if (data.classificationData !== undefined) updateData.classificationData = data.classificationData;
    if (data.breedPercentage !== undefined) updateData.breedPercentage = data.breedPercentage;

    const sheep = await prisma.sheep.update({
      where: { id },
      data: updateData,
      include: {
        mother: { select: { id: true, earTag: true, name: true } },
        father: { select: { id: true, earTag: true, name: true } },
      },
    });

    return sheep;
  });

  // ============================================
  // DELETE SHEEP
  // ============================================
  ipcMain.handle('sheep:delete', async (_event, id) => {
    const prisma = getDatabase();

    // Check for dependent litters (onDelete: Restrict for mother)
    const motherLitters = await prisma.litter.count({
      where: { motherId: id },
    });

    if (motherLitters > 0) {
      throw new Error(
        `Cannot delete: this sheep is the mother in ${motherLitters} litter record(s). Remove those records first.`
      );
    }

    await prisma.sheep.delete({ where: { id } });
    return { success: true };
  });

  // ============================================
  // GET ANCESTORS (recursive, up to N generations)
  // ============================================
  ipcMain.handle('sheep:getAncestors', async (_event, id, depth = 3) => {
    const prisma = getDatabase();

    async function fetchWithAncestors(sheepId, currentDepth) {
      if (!sheepId || currentDepth > depth) return null;

      const sheep = await prisma.sheep.findUnique({
        where: { id: sheepId },
        select: {
          id: true,
          earTag: true,
          name: true,
          sex: true,
          birthDate: true,
          status: true,
          lineage: true,
          motherId: true,
          fatherId: true,
        },
      });

      if (!sheep) return null;

      const [mother, father] = await Promise.all([
        fetchWithAncestors(sheep.motherId, currentDepth + 1),
        fetchWithAncestors(sheep.fatherId, currentDepth + 1),
      ]);

      return { ...sheep, mother, father };
    }

    return fetchWithAncestors(id, 0);
  });

  // ============================================
  // UPLOAD PHOTO (uses native dialog from main process)
  // ============================================
  ipcMain.handle('sheep:uploadPhoto', async (_event, sheepId) => {
    const prisma = getDatabase();
    const { app, dialog, BrowserWindow } = require('electron');
    const fs = require('fs');
    const path = require('path');

    // Open native file picker from main process
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(focusedWindow, {
      title: 'Wybierz zdjęcie owcy',
      filters: [
        { name: 'Obrazy', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { imageUrl: null, canceled: true };
    }

    const sourcePath = result.filePaths[0];

    // Create photos directory in userData
    const photosDir = path.join(app.getPath('userData'), 'photos');
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    // Copy file with unique name
    const ext = path.extname(sourcePath) || '.jpg';
    const destFileName = `${sheepId}-${Date.now()}${ext}`;
    const destPath = path.join(photosDir, destFileName);

    fs.copyFileSync(sourcePath, destPath);

    // Save to Photo model (not Sheep.imageUrl)
    await prisma.photo.create({
      data: {
        url: destPath,
        sheepId: sheepId,
      },
    });

    return { imageUrl: destPath, canceled: false };
  });
}

module.exports = { registerSheepHandlers };

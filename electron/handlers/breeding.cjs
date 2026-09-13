const { getDatabase } = require('../database.cjs');

/**
 * Register Breeding & Inbreeding Check IPC handlers.
 * 
 * INBREEDING ALGORITHM:
 * 1. Collect all ancestors of Ram and Ewe up to N generations, recording the path
 * 2. Compute the intersection — any common ancestor = inbreeding risk
 * 3. Return the lineage paths to each common ancestor for both Ram and Ewe
 * 
 * @param {Electron.IpcMain} ipcMain
 */
function registerBreedingHandlers(ipcMain) {
  ipcMain.handle('breeding:checkInbreeding', async (_event, ramId, eweId) => {
    const prisma = getDatabase();
    const DEPTH = 3;

    /**
     * Collect all ancestors with their lineage paths.
     * Returns: Map<id, { sheep, paths: string[][] }>
     * Each path is an array of names/tags from the subject to the ancestor.
     */
    async function collectAncestorsWithPaths(sheepId, maxDepth) {
      const ancestors = new Map(); // id → { sheep, paths: string[][] }

      // Get the subject's info for path building
      const subject = await prisma.sheep.findUnique({
        where: { id: sheepId },
        select: { id: true, earTag: true, name: true, sex: true, motherId: true, fatherId: true },
      });
      if (!subject) return ancestors;

      const subjectLabel = subject.name || subject.earTag;

      async function recurse(id, currentDepth, currentPath) {
        if (!id || currentDepth > maxDepth) return;

        const sheep = await prisma.sheep.findUnique({
          where: { id },
          select: {
            id: true,
            earTag: true,
            name: true,
            sex: true,
            motherId: true,
            fatherId: true,
          },
        });

        if (!sheep) {
          // Unknown ancestor — add placeholder to path
          return;
        }

        const label = sheep.name || sheep.earTag;
        const path = [...currentPath, label];

        if (ancestors.has(sheep.id)) {
          // Already visited — just add this path
          ancestors.get(sheep.id).paths.push(path);
        } else {
          ancestors.set(sheep.id, { sheep, paths: [path] });
        }

        await Promise.all([
          recurse(sheep.fatherId, currentDepth + 1, path),
          recurse(sheep.motherId, currentDepth + 1, path),
        ]);
      }

      // Start from the parents, with path starting from the subject
      await Promise.all([
        recurse(subject.fatherId, 1, [subjectLabel]),
        recurse(subject.motherId, 1, [subjectLabel]),
      ]);

      return ancestors;
    }

    // Collect ancestors for both
    const [ramAncestors, eweAncestors] = await Promise.all([
      collectAncestorsWithPaths(ramId, DEPTH),
      collectAncestorsWithPaths(eweId, DEPTH),
    ]);

    // Find intersection and build path info
    const commonAncestors = [];
    for (const [id, ramData] of ramAncestors) {
      if (eweAncestors.has(id)) {
        const eweData = eweAncestors.get(id);
        commonAncestors.push({
          ...ramData.sheep,
          ramPaths: ramData.paths,   // paths from Ram → ancestor
          ewePaths: eweData.paths,   // paths from Ewe → ancestor
        });
      }
    }

    // Classify severity
    let warningLevel = 'NONE';
    let message = 'Brak spokrewnienia — bezpieczne kojarzenie.';

    if (commonAncestors.length > 0) {
      if (commonAncestors.length >= 3) {
        warningLevel = 'CRITICAL';
        message = `KRYTYCZNE: Znaleziono ${commonAncestors.length} wspólnych przodków w 3 pokoleniach. Kojarzenie zdecydowanie niezalecane!`;
      } else if (commonAncestors.length === 2) {
        warningLevel = 'HIGH';
        message = `WYSOKIE RYZYKO: Znaleziono ${commonAncestors.length} wspólnych przodków. Kojarzenie niezalecane.`;
      } else {
        warningLevel = 'LOW';
        message = `UWAGA: Znaleziono 1 wspólnego przodka (${commonAncestors[0].name || commonAncestors[0].earTag}). Rozważ alternatywne kojarzenie.`;
      }
    }

    return {
      isRelated: commonAncestors.length > 0,
      commonAncestors,
      warningLevel,
      message,
    };
  });
}

module.exports = { registerBreedingHandlers };

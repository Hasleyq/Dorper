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
    const DEPTH = 4;

    /**
     * Helper to add an ancestor to the map
     */
    function addAncestor(map, key, sheepObj, path) {
      if (!key) return;
      const normalizedKey = key.trim().toLowerCase();
      if (map.has(normalizedKey)) {
        map.get(normalizedKey).paths.push(path);
      } else {
        map.set(normalizedKey, { sheep: sheepObj, paths: [path] });
      }
    }

    /**
     * Collect all ancestors with their lineage paths up to 4 generations.
     * Returns: Map<normalizedKey, { sheep, paths: string[][] }>
     */
    async function collectAncestorsWithPaths(sheepId, maxDepth) {
      const ancestors = new Map();

      const subject = await prisma.sheep.findUnique({
        where: { id: sheepId },
        select: {
          id: true,
          earTag: true,
          name: true,
          sex: true,
          motherId: true,
          fatherId: true,
          customPedigree: true,
        },
      });
      if (!subject) return ancestors;

      const subjectLabel = subject.name || subject.earTag;

      // 1. Process customPedigree on subject if present
      if (subject.customPedigree) {
        try {
          const cp = JSON.parse(subject.customPedigree);
          
          const addCpNode = (node, pathParts) => {
            if (!node || (!node.tag && !node.name)) return;
            const nodeLabel = node.name || node.tag;
            const fullPath = [subjectLabel, ...pathParts, nodeLabel];
            const nodeKey = node.tag ? node.tag.trim().toLowerCase() : `name:${node.name.trim().toLowerCase()}`;
            addAncestor(ancestors, nodeKey, {
              id: nodeKey,
              earTag: node.tag || 'Brak kolczyka',
              name: node.name || node.tag,
              sex: pathParts[pathParts.length - 1]?.includes('Matka') || pathParts[pathParts.length - 1]?.includes('Babka') ? 'FEMALE' : 'MALE',
            }, fullPath);
          };

          // Gen 1
          if (cp.father) addCpNode(cp.father, ['Ojciec (rodowód)']);
          if (cp.mother) addCpNode(cp.mother, ['Matka (rodowód)']);

          // Gen 2
          if (cp.fatherFather) addCpNode(cp.fatherFather, ['Ojciec', 'Dziadek (O)']);
          if (cp.fatherMother) addCpNode(cp.fatherMother, ['Ojciec', 'Babka (O)']);
          if (cp.motherFather) addCpNode(cp.motherFather, ['Matka', 'Dziadek (M)']);
          if (cp.motherMother) addCpNode(cp.motherMother, ['Matka', 'Babka (M)']);

          // Gen 3
          if (cp.fff) addCpNode(cp.fff, ['Ojciec', 'Dziadek (O)', 'Pradziadek']);
          if (cp.ffm) addCpNode(cp.ffm, ['Ojciec', 'Dziadek (O)', 'Prababka']);
          if (cp.fmf) addCpNode(cp.fmf, ['Ojciec', 'Babka (O)', 'Pradziadek']);
          if (cp.fmm) addCpNode(cp.fmm, ['Ojciec', 'Babka (O)', 'Prababka']);
          if (cp.mff) addCpNode(cp.mff, ['Matka', 'Dziadek (M)', 'Pradziadek']);
          if (cp.mfm) addCpNode(cp.mfm, ['Matka', 'Dziadek (M)', 'Prababka']);
          if (cp.mmf) addCpNode(cp.mmf, ['Matka', 'Babka (M)', 'Pradziadek']);
          if (cp.mmm) addCpNode(cp.mmm, ['Matka', 'Babka (M)', 'Prababka']);

          // Gen 4
          const gen4 = [
            ['ffff', ['Ojciec', 'Dziadek', 'Pradziadek', 'Prapradziadek']],
            ['fffm', ['Ojciec', 'Dziadek', 'Pradziadek', 'Praprababka']],
            ['ffmf', ['Ojciec', 'Dziadek', 'Prababka', 'Prapradziadek']],
            ['ffmm', ['Ojciec', 'Dziadek', 'Prababka', 'Praprababka']],
            ['fmff', ['Ojciec', 'Babka', 'Pradziadek', 'Prapradziadek']],
            ['fmfm', ['Ojciec', 'Babka', 'Pradziadek', 'Praprababka']],
            ['fmmf', ['Ojciec', 'Babka', 'Prababka', 'Prapradziadek']],
            ['fmmm', ['Ojciec', 'Babka', 'Prababka', 'Praprababka']],
            ['mfff', ['Matka', 'Dziadek', 'Pradziadek', 'Prapradziadek']],
            ['mffm', ['Matka', 'Dziadek', 'Pradziadek', 'Praprababka']],
            ['mfmf', ['Matka', 'Dziadek', 'Prababka', 'Prapradziadek']],
            ['mfmm', ['Matka', 'Dziadek', 'Prababka', 'Praprababka']],
            ['mmff', ['Matka', 'Babka', 'Pradziadek', 'Prapradziadek']],
            ['mmfm', ['Matka', 'Babka', 'Pradziadek', 'Praprababka']],
            ['mmmf', ['Matka', 'Babka', 'Prababka', 'Prapradziadek']],
            ['mmmm', ['Matka', 'Babka', 'Prababka', 'Praprababka']],
          ];
          for (const [k, p] of gen4) {
            if (cp[k]) addCpNode(cp[k], p);
          }
        } catch (err) {
          console.error('Failed to parse customPedigree in inbreeding checker:', err);
        }
      }

      // 2. Recurse in database relations up to maxDepth
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
            customPedigree: true,
          },
        });

        if (!sheep) return;

        const label = sheep.name || sheep.earTag;
        const path = [...currentPath, label];

        // Store by DB id and also by earTag
        addAncestor(ancestors, sheep.id, sheep, path);
        if (sheep.earTag) {
          addAncestor(ancestors, sheep.earTag, sheep, path);
        }

        // Also check if this ancestor has customPedigree
        if (sheep.customPedigree && currentDepth < maxDepth) {
          try {
            const cp = JSON.parse(sheep.customPedigree);
            if (cp.father && (cp.father.tag || cp.father.name)) {
              const node = cp.father;
              addAncestor(ancestors, node.tag || node.name, {
                id: node.tag || node.name,
                earTag: node.tag || '',
                name: node.name || node.tag,
                sex: 'MALE',
              }, [...path, node.name || node.tag]);
            }
            if (cp.mother && (cp.mother.tag || cp.mother.name)) {
              const node = cp.mother;
              addAncestor(ancestors, node.tag || node.name, {
                id: node.tag || node.name,
                earTag: node.tag || '',
                name: node.name || node.tag,
                sex: 'FEMALE',
              }, [...path, node.name || node.tag]);
            }
          } catch {}
        }

        await Promise.all([
          recurse(sheep.fatherId, currentDepth + 1, path),
          recurse(sheep.motherId, currentDepth + 1, path),
        ]);
      }

      // Start from parents
      await Promise.all([
        recurse(subject.fatherId, 1, [subjectLabel]),
        recurse(subject.motherId, 1, [subjectLabel]),
      ]);

      return ancestors;
    }

    // Collect ancestors up to 4 generations for both
    const [ramAncestors, eweAncestors] = await Promise.all([
      collectAncestorsWithPaths(ramId, DEPTH),
      collectAncestorsWithPaths(eweId, DEPTH),
    ]);

    // Find intersection
    const commonMap = new Map(); // normalized tag/id -> merged
    for (const [key, ramData] of ramAncestors) {
      if (eweAncestors.has(key)) {
        const eweData = eweAncestors.get(key);
        // Avoid duplicate common ancestors under both ID and tag
        const dedupKey = (ramData.sheep.earTag || ramData.sheep.id || key).trim().toLowerCase();
        if (!commonMap.has(dedupKey)) {
          commonMap.set(dedupKey, {
            ...ramData.sheep,
            ramPaths: ramData.paths,
            ewePaths: eweData.paths,
          });
        }
      }
    }

    const commonAncestors = Array.from(commonMap.values());

    // Classify severity
    let warningLevel = 'NONE';
    let message = 'Brak spokrewnienia — bezpieczne kojarzenie (do 4 pokoleń).';

    if (commonAncestors.length > 0) {
      if (commonAncestors.length >= 3) {
        warningLevel = 'CRITICAL';
        message = `KRYTYCZNE: Znaleziono ${commonAncestors.length} wspólnych przodków w 4 pokoleniach. Kojarzenie zdecydowanie niezalecane!`;
      } else if (commonAncestors.length === 2) {
        warningLevel = 'HIGH';
        message = `WYSOKIE RYZYKO: Znaleziono ${commonAncestors.length} wspólnych przodków w 4 pokoleniach. Kojarzenie niezalecane.`;
      } else {
        warningLevel = 'LOW';
        message = `UWAGA: Znaleziono 1 wspólnego przodka (${commonAncestors[0].name || commonAncestors[0].earTag}) w 4 pokoleniach. Rozważ alternatywne kojarzenie.`;
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

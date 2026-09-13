const { getDatabase } = require('../database.cjs');

/**
 * Register Transaction IPC handlers
 * @param {Electron.IpcMain} ipcMain
 */
function registerTransactionHandlers(ipcMain) {
  ipcMain.handle('transactions:getAll', async (_event, filters = {}) => {
    const prisma = getDatabase();

    const where = {};
    if (filters.sheepId) where.sheepId = filters.sheepId;
    if (filters.type) where.type = filters.type;
    if (filters.category) where.category = filters.category;

    return prisma.transaction.findMany({
      where,
      include: {
        sheep: { select: { id: true, earTag: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });
  });

  ipcMain.handle('transactions:create', async (_event, data) => {
    const prisma = getDatabase();
    return prisma.transaction.create({
      data: {
        date: new Date(data.date),
        type: data.type,
        category: data.category,
        amount: data.amount,
        description: data.description || null,
        sheepId: data.sheepId || null,
      },
      include: {
        sheep: { select: { id: true, earTag: true, name: true } },
      },
    });
  });

  ipcMain.handle('transactions:update', async (_event, id, data) => {
    const prisma = getDatabase();

    const updateData = {};
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.sheepId !== undefined) updateData.sheepId = data.sheepId || null;

    return prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        sheep: { select: { id: true, earTag: true, name: true } },
      },
    });
  });

  ipcMain.handle('transactions:delete', async (_event, id) => {
    const prisma = getDatabase();
    await prisma.transaction.delete({ where: { id } });
    return { success: true };
  });

  // ============================================
  // FINANCIAL SUMMARY (aggregate)
  // ============================================
  ipcMain.handle('transactions:getSummary', async (_event, filters = {}) => {
    const prisma = getDatabase();

    const where = {};
    if (filters.sheepId) where.sheepId = filters.sheepId;

    const [income, expenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    // Group by category
    const allTransactions = await prisma.transaction.findMany({
      where,
      select: { type: true, category: true, amount: true },
    });

    const byCategory = {};
    for (const txn of allTransactions) {
      const key = txn.category;
      if (!byCategory[key]) byCategory[key] = 0;
      byCategory[key] += txn.type === 'EXPENSE' ? -txn.amount : txn.amount;
    }

    const totalIncome = income._sum.amount || 0;
    const totalExpenses = expenses._sum.amount || 0;

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      byCategory,
    };
  });
}

module.exports = { registerTransactionHandlers };

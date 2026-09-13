const { getDatabase } = require('../database.cjs');

/**
 * Register Calendar Event IPC handlers
 * @param {Electron.IpcMain} ipcMain
 */
function registerCalendarHandlers(ipcMain) {
  // Get all events: custom reminders + auto-generated withdrawal/lambing events
  ipcMain.handle('calendar:getEvents', async (_event) => {
    const prisma = getDatabase();

    // 1. Fetch custom reminders
    const reminders = await prisma.calendarEvent.findMany({
      orderBy: { date: 'asc' },
    });

    // Format reminders — ensure date is ISO string
    const formattedReminders = reminders.map((r) => ({
      ...r,
      date: r.date instanceof Date ? r.date.toISOString() : r.date,
      auto: false,
    }));

    // 2. Auto-generate withdrawal end dates from ALL health records with withdrawal days
    const healthRecords = await prisma.healthRecord.findMany({
      where: {
        withdrawalDays: { gt: 0 },
      },
      include: {
        sheep: { select: { id: true, earTag: true, name: true } },
      },
    });

    const withdrawalEvents = healthRecords
      .filter((hr) => hr.withdrawalDays && hr.withdrawalDays > 0)
      .map((hr) => {
        // Compute the actual end date: record date + withdrawal days
        const recordDate = new Date(hr.date);
        const endDate = new Date(recordDate.getTime() + hr.withdrawalDays * 24 * 60 * 60 * 1000);

        return {
          id: `withdrawal-${hr.id}`,
          date: endDate.toISOString(),
          title: `Koniec karencji: ${hr.sheep?.name || hr.sheep?.earTag || 'Owca'}`,
          description: `${hr.medication || hr.type} — karencja ${hr.withdrawalDays} dni (od ${recordDate.toISOString().split('T')[0]})`,
          color: 'red',
          type: 'WITHDRAWAL',
          sheepId: hr.sheepId,
          auto: true,
        };
      });

    // 3. Auto-generate lambing estimates from litters
    //    (Use lambingDate as a proxy: if a litter has a lambingDate but it's future, show it)
    const litters = await prisma.litter.findMany({
      include: {
        mother: { select: { id: true, earTag: true, name: true } },
      },
    });

    const lambingEvents = litters
      .filter((l) => l.lambingDate)
      .map((l) => {
        const lambDate = new Date(l.lambingDate);
        return {
          id: `lambing-${l.id}`,
          date: lambDate.toISOString(),
          title: `Wykot: ${l.mother?.name || l.mother?.earTag || 'Matka'}`,
          description: `Urodzone: ${l.bornCount || '?'} jagnięta`,
          color: 'green',
          type: 'LAMBING',
          sheepId: l.motherId,
          auto: true,
        };
      });

    return [...formattedReminders, ...withdrawalEvents, ...lambingEvents];
  });

  // Create a custom reminder
  ipcMain.handle('calendar:create', async (_event, data) => {
    const prisma = getDatabase();
    return prisma.calendarEvent.create({
      data: {
        date: new Date(data.date),
        title: data.title,
        description: data.description || null,
        color: data.color || 'blue',
        type: 'REMINDER',
        sheepId: data.sheepId || null,
      },
    });
  });

  // Delete a custom reminder
  ipcMain.handle('calendar:delete', async (_event, id) => {
    const prisma = getDatabase();
    await prisma.calendarEvent.delete({ where: { id } });
    return { success: true };
  });
}

module.exports = { registerCalendarHandlers };

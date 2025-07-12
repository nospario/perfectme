const db = require('../config/database');

const closeExpiredTaskLists = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Close all unclosed task lists from yesterday
    const [result] = await db.execute(
      'UPDATE task_lists SET is_closed = true, closed_at = NOW() WHERE date = ? AND is_closed = false',
      [yesterdayStr]
    );
    
    console.log(`Closed ${result.affectedRows} task lists from ${yesterdayStr}`);
  } catch (error) {
    console.error('Error closing expired task lists:', error);
  }
};

module.exports = { closeExpiredTaskLists };
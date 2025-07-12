const calculateTaskPercentages = (taskCount) => {
  if (taskCount === 0) return [];
  if (taskCount === 1) return [100];
  
  // Calculate decreasing percentages that sum to 100
  const percentages = [];
  const base = 100 / taskCount;
  const decrement = (base * 0.8) / (taskCount - 1);
  
  for (let i = 0; i < taskCount; i++) {
    const percentage = base + (decrement * (taskCount - 1 - i));
    percentages.push(Math.round(percentage * 100) / 100);
  }
  
  // Ensure total equals 100
  const total = percentages.reduce((sum, p) => sum + p, 0);
  const adjustment = (100 - total) / taskCount;
  
  return percentages.map(p => Math.round((p + adjustment) * 100) / 100);
};

const updateTaskPercentages = async (db, taskListId) => {
  try {
    // Get all tasks for this task list ordered by position
    const [tasks] = await db.execute(
      'SELECT id FROM tasks WHERE task_list_id = ? ORDER BY position ASC',
      [taskListId]
    );
    
    const percentages = calculateTaskPercentages(tasks.length);
    
    // Update each task with its calculated percentage
    for (let i = 0; i < tasks.length; i++) {
      await db.execute(
        'UPDATE tasks SET percentage = ? WHERE id = ?',
        [percentages[i], tasks[i].id]
      );
    }
  } catch (error) {
    console.error('Error updating task percentages:', error);
    throw error;
  }
};

module.exports = { calculateTaskPercentages, updateTaskPercentages };
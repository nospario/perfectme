const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { updateTaskPercentages } = require('../utils/taskPercentage');

const router = express.Router();

// Get today's tasks
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get or create task list for today
    let [taskLists] = await db.execute(
      'SELECT id, is_submitted, is_closed FROM task_lists WHERE user_id = ? AND date = ?',
      [req.user.id, today]
    );
    
    let taskListId;
    if (taskLists.length === 0) {
      const [result] = await db.execute(
        'INSERT INTO task_lists (user_id, date) VALUES (?, ?)',
        [req.user.id, today]
      );
      taskListId = result.insertId;
    } else {
      taskListId = taskLists[0].id;
    }
    
    // Get tasks for this task list
    const [tasks] = await db.execute(
      'SELECT id, title, description, percentage, position, is_completed, completed_at FROM tasks WHERE task_list_id = ? ORDER BY position ASC',
      [taskListId]
    );
    
    res.json({
      taskListId,
      tasks,
      isSubmitted: taskLists.length > 0 ? taskLists[0].is_submitted : false,
      isClosed: taskLists.length > 0 ? taskLists[0].is_closed : false
    });
  } catch (error) {
    console.error('Error fetching today\'s tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create new task
router.post('/', [
  authenticateToken,
  body('title').trim().isLength({ min: 1 }),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    // Get or create task list for today
    let [taskLists] = await db.execute(
      'SELECT id, is_submitted, is_closed FROM task_lists WHERE user_id = ? AND date = ?',
      [req.user.id, today]
    );
    
    let taskListId;
    if (taskLists.length === 0) {
      const [result] = await db.execute(
        'INSERT INTO task_lists (user_id, date) VALUES (?, ?)',
        [req.user.id, today]
      );
      taskListId = result.insertId;
    } else {
      taskListId = taskLists[0].id;
      
      // Check if task list is submitted or closed
      if (taskLists[0].is_submitted || taskLists[0].is_closed) {
        return res.status(400).json({ error: 'Cannot add tasks to submitted or closed task list' });
      }
    }
    
    // Check maximum tasks limit (10)
    const [taskCount] = await db.execute(
      'SELECT COUNT(*) as count FROM tasks WHERE task_list_id = ?',
      [taskListId]
    );
    
    if (taskCount[0].count >= 10) {
      return res.status(400).json({ error: 'Maximum 10 tasks allowed per day' });
    }
    
    // Get next position
    const [maxPosition] = await db.execute(
      'SELECT COALESCE(MAX(position), 0) as max_pos FROM tasks WHERE task_list_id = ?',
      [taskListId]
    );
    
    const position = maxPosition[0].max_pos + 1;
    
    // Insert task
    const [result] = await db.execute(
      'INSERT INTO tasks (task_list_id, title, description, percentage, position) VALUES (?, ?, ?, ?, ?)',
      [taskListId, title, description || '', 0, position]
    );
    
    // Update all task percentages
    await updateTaskPercentages(db, taskListId);
    
    // Get the created task with updated percentage
    const [createdTask] = await db.execute(
      'SELECT id, title, description, percentage, position, is_completed, completed_at FROM tasks WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(createdTask[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Reorder tasks
router.put('/reorder', [
  authenticateToken,
  body('taskIds').isArray().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskIds } = req.body;
    
    // Ensure taskIds are integers
    const intTaskIds = taskIds.map(id => parseInt(id));
    
    // Verify all tasks belong to user and get task list info
    const [tasks] = await db.execute(`
      SELECT t.id, t.task_list_id, tl.is_submitted, tl.is_closed 
      FROM tasks t 
      JOIN task_lists tl ON t.task_list_id = tl.id 
      WHERE t.id IN (${intTaskIds.map(() => '?').join(',')}) AND tl.user_id = ?
    `, [...intTaskIds, req.user.id]);
    
    if (tasks.length !== intTaskIds.length) {
      return res.status(400).json({ error: 'Some tasks not found or not owned by user' });
    }
    
    // Check if all tasks belong to same task list
    const taskListIds = [...new Set(tasks.map(t => t.task_list_id))];
    if (taskListIds.length > 1) {
      return res.status(400).json({ error: 'All tasks must belong to the same task list' });
    }
    
    if (tasks[0].is_submitted || tasks[0].is_closed) {
      return res.status(400).json({ error: 'Cannot reorder tasks in submitted or closed task list' });
    }
    
    // Update positions
    for (let i = 0; i < intTaskIds.length; i++) {
      await db.execute(
        'UPDATE tasks SET position = ? WHERE id = ?',
        [i + 1, intTaskIds[i]]
      );
    }
    
    // Update task percentages
    await updateTaskPercentages(db, taskListIds[0]);
    
    res.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

// Update task
router.put('/:id', [
  authenticateToken,
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const taskId = req.params.id;
    const { title, description } = req.body;
    
    // Verify task belongs to user and task list is not submitted/closed
    const [tasks] = await db.execute(`
      SELECT t.id, tl.is_submitted, tl.is_closed 
      FROM tasks t 
      JOIN task_lists tl ON t.task_list_id = tl.id 
      WHERE t.id = ? AND tl.user_id = ?
    `, [taskId, req.user.id]);
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (tasks[0].is_submitted || tasks[0].is_closed) {
      return res.status(400).json({ error: 'Cannot update task in submitted or closed task list' });
    }
    
    // Update task
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(taskId);
    
    await db.execute(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Get updated task
    const [updatedTask] = await db.execute(
      'SELECT id, title, description, percentage, position, is_completed, completed_at FROM tasks WHERE id = ?',
      [taskId]
    );
    
    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Verify task belongs to user and get task list info
    const [tasks] = await db.execute(`
      SELECT t.id, t.task_list_id, tl.is_submitted, tl.is_closed 
      FROM tasks t 
      JOIN task_lists tl ON t.task_list_id = tl.id 
      WHERE t.id = ? AND tl.user_id = ?
    `, [taskId, req.user.id]);
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (tasks[0].is_submitted || tasks[0].is_closed) {
      return res.status(400).json({ error: 'Cannot delete task from submitted or closed task list' });
    }
    
    const taskListId = tasks[0].task_list_id;
    
    // Delete task
    await db.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
    
    // Update remaining task percentages
    await updateTaskPercentages(db, taskListId);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Mark task as complete/incomplete
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Verify task belongs to user
    const [tasks] = await db.execute(`
      SELECT t.id, t.is_completed, tl.is_closed 
      FROM tasks t 
      JOIN task_lists tl ON t.task_list_id = tl.id 
      WHERE t.id = ? AND tl.user_id = ?
    `, [taskId, req.user.id]);
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (tasks[0].is_closed) {
      return res.status(400).json({ error: 'Cannot modify tasks in closed task list' });
    }
    
    const newCompletionStatus = !tasks[0].is_completed;
    const completedAt = newCompletionStatus ? new Date() : null;
    
    // Update task completion status
    await db.execute(
      'UPDATE tasks SET is_completed = ?, completed_at = ? WHERE id = ?',
      [newCompletionStatus, completedAt, taskId]
    );
    
    // Get updated task
    const [updatedTask] = await db.execute(
      'SELECT id, title, description, percentage, position, is_completed, completed_at FROM tasks WHERE id = ?',
      [taskId]
    );
    
    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task completion:', error);
    res.status(500).json({ error: 'Failed to update task completion' });
  }
});

// Get tasks for specific date
router.get('/history/:date', authenticateToken, async (req, res) => {
  try {
    const date = req.params.date;
    
    // Get task list for the date
    const [taskLists] = await db.execute(
      'SELECT id, is_submitted, is_closed FROM task_lists WHERE user_id = ? AND date = ?',
      [req.user.id, date]
    );
    
    if (taskLists.length === 0) {
      return res.json({ taskListId: null, tasks: [], isSubmitted: false, isClosed: false });
    }
    
    const taskListId = taskLists[0].id;
    
    // Get tasks for this task list
    const [tasks] = await db.execute(
      'SELECT id, title, description, percentage, position, is_completed, completed_at FROM tasks WHERE task_list_id = ? ORDER BY position ASC',
      [taskListId]
    );
    
    res.json({
      taskListId,
      tasks,
      isSubmitted: taskLists[0].is_submitted,
      isClosed: taskLists[0].is_closed
    });
  } catch (error) {
    console.error('Error fetching historical tasks:', error);
    res.status(500).json({ error: 'Failed to fetch historical tasks' });
  }
});

// Copy tasks from latest closed task list
router.post('/copy-from-latest', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get or create task list for today
    let [todayTaskLists] = await db.execute(
      'SELECT id, is_submitted, is_closed FROM task_lists WHERE user_id = ? AND date = ?',
      [req.user.id, today]
    );
    
    let todayTaskListId;
    if (todayTaskLists.length === 0) {
      const [result] = await db.execute(
        'INSERT INTO task_lists (user_id, date) VALUES (?, ?)',
        [req.user.id, today]
      );
      todayTaskListId = result.insertId;
    } else {
      todayTaskListId = todayTaskLists[0].id;
      
      // Check if today's task list is submitted or closed
      if (todayTaskLists[0].is_submitted || todayTaskLists[0].is_closed) {
        return res.status(400).json({ error: 'Cannot copy tasks to submitted or closed task list' });
      }
    }
    
    // Get current task count for today to enforce 10 task limit
    const [currentTaskCount] = await db.execute(
      'SELECT COUNT(*) as count FROM tasks WHERE task_list_id = ?',
      [todayTaskListId]
    );
    
    // Find the latest closed task list for this user
    const [latestClosedTaskList] = await db.execute(`
      SELECT id, date FROM task_lists 
      WHERE user_id = ? AND is_closed = 1 
      ORDER BY date DESC 
      LIMIT 1
    `, [req.user.id]);
    
    if (latestClosedTaskList.length === 0) {
      return res.status(404).json({ error: 'No closed task lists found to copy from' });
    }
    
    const latestTaskListId = latestClosedTaskList[0].id;
    
    // Get tasks from the latest closed task list
    const [tasksFromLatest] = await db.execute(
      'SELECT title, description FROM tasks WHERE task_list_id = ? ORDER BY position ASC',
      [latestTaskListId]
    );
    
    if (tasksFromLatest.length === 0) {
      return res.status(404).json({ error: 'No tasks found in latest closed task list' });
    }
    
    // Check if copying would exceed the 10 task limit
    const totalTasksAfterCopy = currentTaskCount[0].count + tasksFromLatest.length;
    if (totalTasksAfterCopy > 10) {
      return res.status(400).json({ 
        error: `Cannot copy ${tasksFromLatest.length} tasks. Would exceed maximum of 10 tasks per day. Current count: ${currentTaskCount[0].count}` 
      });
    }
    
    // Get the highest position for today's tasks
    const [maxPosition] = await db.execute(
      'SELECT COALESCE(MAX(position), 0) as max_pos FROM tasks WHERE task_list_id = ?',
      [todayTaskListId]
    );
    
    let position = maxPosition[0].max_pos;
    const copiedTasks = [];
    
    // Insert each task from the latest closed list into today's list
    for (const task of tasksFromLatest) {
      position++;
      const [result] = await db.execute(
        'INSERT INTO tasks (task_list_id, title, description, percentage, position, is_completed) VALUES (?, ?, ?, ?, ?, ?)',
        [todayTaskListId, task.title, task.description || '', 0, position, false]
      );
      
      copiedTasks.push({
        id: result.insertId,
        title: task.title,
        description: task.description
      });
    }
    
    // Update all task percentages for today's task list
    await updateTaskPercentages(db, todayTaskListId);
    
    res.json({
      message: `Successfully copied ${copiedTasks.length} tasks from ${latestClosedTaskList[0].date}`,
      copiedTasks,
      fromDate: latestClosedTaskList[0].date
    });
  } catch (error) {
    console.error('Error copying tasks from latest closed list:', error);
    res.status(500).json({ error: 'Failed to copy tasks from latest closed list' });
  }
});

module.exports = router;
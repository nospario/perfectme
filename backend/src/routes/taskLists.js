const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Submit task list
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's task list
    const [taskLists] = await db.execute(
      'SELECT id, is_submitted, is_closed FROM task_lists WHERE user_id = ? AND date = ?',
      [req.user.id, today]
    );
    
    if (taskLists.length === 0) {
      return res.status(404).json({ error: 'No task list found for today' });
    }
    
    const taskList = taskLists[0];
    
    if (taskList.is_submitted) {
      return res.status(400).json({ error: 'Task list already submitted' });
    }
    
    if (taskList.is_closed) {
      return res.status(400).json({ error: 'Task list is closed' });
    }
    
    // Update task list as submitted
    await db.execute(
      'UPDATE task_lists SET is_submitted = true, submitted_at = NOW() WHERE id = ?',
      [taskList.id]
    );
    
    res.json({ message: 'Task list submitted successfully' });
  } catch (error) {
    console.error('Error submitting task list:', error);
    res.status(500).json({ error: 'Failed to submit task list' });
  }
});

// Close task list
router.post('/close', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's task list
    const [taskLists] = await db.execute(
      'SELECT id, is_submitted, is_closed FROM task_lists WHERE user_id = ? AND date = ?',
      [req.user.id, today]
    );
    
    if (taskLists.length === 0) {
      return res.status(404).json({ error: 'No task list found for today' });
    }
    
    const taskList = taskLists[0];
    
    if (taskList.is_closed) {
      return res.status(400).json({ error: 'Task list already closed' });
    }
    
    // Update task list as closed
    await db.execute(
      'UPDATE task_lists SET is_closed = true, closed_at = NOW() WHERE id = ?',
      [taskList.id]
    );
    
    res.json({ message: 'Task list closed successfully' });
  } catch (error) {
    console.error('Error closing task list:', error);
    res.status(500).json({ error: 'Failed to close task list' });
  }
});

// Reopen task list
router.post('/reopen', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's task list
    const [taskLists] = await db.execute(
      'SELECT id, is_submitted, is_closed FROM task_lists WHERE user_id = ? AND date = ?',
      [req.user.id, today]
    );
    
    if (taskLists.length === 0) {
      return res.status(404).json({ error: 'No task list found for today' });
    }
    
    const taskList = taskLists[0];
    
    if (!taskList.is_submitted && !taskList.is_closed) {
      return res.status(400).json({ error: 'Task list is already open' });
    }
    
    // Reopen the task list
    await db.execute(
      'UPDATE task_lists SET is_submitted = false, is_closed = false, submitted_at = NULL, closed_at = NULL WHERE id = ?',
      [taskList.id]
    );
    
    res.json({ message: 'Task list reopened successfully' });
  } catch (error) {
    console.error('Error reopening task list:', error);
    res.status(500).json({ error: 'Failed to reopen task list' });
  }
});

// Get task list status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's task list
    const [taskLists] = await db.execute(
      'SELECT id, is_submitted, is_closed, submitted_at, closed_at FROM task_lists WHERE user_id = ? AND date = ?',
      [req.user.id, today]
    );
    
    if (taskLists.length === 0) {
      return res.json({ 
        exists: false, 
        isSubmitted: false, 
        isClosed: false,
        submittedAt: null,
        closedAt: null 
      });
    }
    
    const taskList = taskLists[0];
    
    res.json({
      exists: true,
      isSubmitted: taskList.is_submitted,
      isClosed: taskList.is_closed,
      submittedAt: taskList.submitted_at,
      closedAt: taskList.closed_at
    });
  } catch (error) {
    console.error('Error getting task list status:', error);
    res.status(500).json({ error: 'Failed to get task list status' });
  }
});

module.exports = router;
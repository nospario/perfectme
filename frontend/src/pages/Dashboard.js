import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import ConfirmationModal from '../components/ConfirmationModal';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [taskListStatus, setTaskListStatus] = useState({
    isSubmitted: false,
    isClosed: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({
    show: false,
    type: '',
    loading: false
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks/today');
      setTasks(response.data.tasks);
      setTaskListStatus({
        isSubmitted: response.data.isSubmitted,
        isClosed: response.data.isClosed
      });
    } catch (error) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      const response = await axios.post('/api/tasks', taskData);
      await fetchTasks(); // Refresh to get updated percentages
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to add task');
    }
  };

  const handleToggleComplete = async (taskId) => {
    try {
      await axios.put(`/api/tasks/${taskId}/complete`);
      await fetchTasks();
    } catch (error) {
      setError('Failed to update task completion');
      console.error('Error updating task completion:', error);
    }
  };

  const handleEditTask = async (taskId, updates) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, updates);
      await fetchTasks();
    } catch (error) {
      setError('Failed to update task');
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      await fetchTasks();
    } catch (error) {
      setError('Failed to delete task');
      console.error('Error deleting task:', error);
    }
  };

  const handleOptimisticReorder = (reorderedTasks) => {
    setTasks(reorderedTasks);
  };

  const handleReorderTasks = async (taskIds) => {
    try {
      await axios.put('/api/tasks/reorder', { taskIds });
      await fetchTasks();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to reorder tasks';
      setError(errorMessage);
      console.error('Error reordering tasks:', error.response?.data || error);
      // Revert optimistic update on error
      fetchTasks();
    }
  };

  const handleSubmitTaskList = async () => {
    setModal({ show: true, type: 'submit', loading: false });
  };

  const handleCloseTaskList = async () => {
    setModal({ show: true, type: 'close', loading: false });
  };

  const handleReopenTaskList = async () => {
    setModal({ show: true, type: 'reopen', loading: false });
  };

  const handleCopyPreviousTasks = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous messages
      const response = await axios.post('/api/tasks/copy-from-latest');
      await fetchTasks(); // Refresh the task list
      // Show success message briefly
      setError(`✓ Successfully copied ${response.data.copiedTasks.length} tasks from ${response.data.fromDate}`);
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to copy previous tasks';
      setError(errorMessage);
      console.error('Error copying previous tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async () => {
    setModal(prev => ({ ...prev, loading: true }));
    
    try {
      if (modal.type === 'submit') {
        await axios.post('/api/tasklist/submit');
      } else if (modal.type === 'close') {
        await axios.post('/api/tasklist/close');
      } else if (modal.type === 'reopen') {
        await axios.post('/api/tasklist/reopen');
      }
      
      await fetchTasks();
      setModal({ show: false, type: '', loading: false });
    } catch (error) {
      setError(`Failed to ${modal.type} task list`);
      console.error(`Error ${modal.type}ing task list:`, error);
      setModal({ show: false, type: '', loading: false });
    }
  };

  const cancelAction = () => {
    setModal({ show: false, type: '', loading: false });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const isEditable = !taskListStatus.isSubmitted && !taskListStatus.isClosed;

  return (
    <div className="dashboard-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
        <div className="d-flex gap-2">
          {!taskListStatus.isSubmitted && !taskListStatus.isClosed && tasks.length < 10 ? (
            <button
              className="btn btn-outline-secondary"
              onClick={handleCopyPreviousTasks}
              disabled={loading}
            >
              {loading ? 'Copying...' : 'Copy Previous Tasks'}
            </button>
          ) : null}
          {tasks.length > 0 && !taskListStatus.isSubmitted && !taskListStatus.isClosed ? (
            <button
              className="btn btn-success"
              onClick={handleSubmitTaskList}
            >
              Submit Task List
            </button>
          ) : null}
          {tasks.length > 0 && !taskListStatus.isClosed ? (
            <button
              className="btn btn-warning"
              onClick={handleCloseTaskList}
            >
              Close Task List
            </button>
          ) : null}
          {tasks.length > 0 && (taskListStatus.isSubmitted || taskListStatus.isClosed) ? (
            <button
              className="btn btn-outline-primary"
              onClick={handleReopenTaskList}
            >
              Reopen Task List
            </button>
          ) : null}
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Task Count (max 10)</h5>
              <h3 className="text-primary">{tasks.length}/10</h3>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Perfection Score</h5>
              <h3 className="text-success">
                {tasks.length > 0 ? (
                  <>
{Math.round(tasks.filter(task => Boolean(task.is_completed)).reduce((sum, task) => sum + (parseFloat(task.percentage) || 0), 0)) || 0}%
                  </>
                ) : (
                  <>0%</>
                )}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className={`alert ${error.startsWith('✓') ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`} role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError('')}
          ></button>
        </div>
      )}

      {taskListStatus.isSubmitted ? (
        <div className="alert alert-info">
          Task list has been submitted. No modifications allowed.
        </div>
      ) : null}

      {taskListStatus.isClosed ? (
        <div className="alert alert-warning">
          Task list has been closed. No modifications allowed.
        </div>
      ) : null}

      {isEditable && tasks.length < 10 ? (
        <TaskForm
          onAddTask={handleAddTask}
          isDisabled={!isEditable}
        />
      ) : null}

      {tasks.length >= 10 && isEditable ? (
        <div className="alert alert-warning">
          Maximum 10 tasks allowed per day. Delete a task to add more.
        </div>
      ) : null}

      <TaskList
        tasks={tasks}
        onReorder={handleReorderTasks}
        onOptimisticReorder={handleOptimisticReorder}
        onToggleComplete={handleToggleComplete}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        isEditable={isEditable}
        isClosed={taskListStatus.isClosed}
      />

      <ConfirmationModal
        show={modal.show}
        title={
          modal.type === 'submit' ? 'Submit Task List' : 
          modal.type === 'close' ? 'Close Task List' : 
          'Reopen Task List'
        }
        message={
          modal.type === 'submit'
            ? 'Are you sure you want to submit your task list? You will not be able to edit it afterwards.'
            : modal.type === 'close'
            ? 'Are you sure you want to close your task list? This action cannot be undone.'
            : 'Are you sure you want to reopen your task list? This will allow you to edit tasks again.'
        }
        onConfirm={confirmAction}
        onCancel={cancelAction}
        loading={modal.loading}
      />
    </div>
  );
};

export default Dashboard;
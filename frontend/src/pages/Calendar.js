import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import TaskList from '../components/TaskList';

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [taskListStatus, setTaskListStatus] = useState({
    isSubmitted: false,
    isClosed: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasksForDate(selectedDate);
  }, [selectedDate]);

  const fetchTasksForDate = async (date) => {
    setLoading(true);
    setError('');
    
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await axios.get(`/api/tasks/history/${dateStr}`);
      setTasks(response.data.tasks);
      setTaskListStatus({
        isSubmitted: response.data.isSubmitted,
        isClosed: response.data.isClosed
      });
    } catch (error) {
      setError('Failed to fetch tasks for selected date');
      console.error('Error fetching historical tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleToggleComplete = async (taskId) => {
    try {
      await axios.put(`/api/tasks/${taskId}/complete`);
      await fetchTasksForDate(selectedDate);
    } catch (error) {
      setError('Failed to update task completion');
      console.error('Error updating task completion:', error);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isFuture = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  return (
    <div className="dashboard-container">
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Select Date</h5>
            </div>
            <div className="card-body p-2">
              <div className="calendar-wrapper">
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  inline
                  maxDate={new Date()}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              {isToday(selectedDate) ? 'Today' : formatDate(selectedDate)}
            </h2>
            <div className="d-flex gap-2">
              {taskListStatus.isSubmitted ? (
                <span className="badge bg-success">Submitted</span>
              ) : null}
              {taskListStatus.isClosed ? (
                <span className="badge bg-warning">Closed</span>
              ) : null}
            </div>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError('')}
              ></button>
            </div>
          )}

          {isFuture(selectedDate) && (
            <div className="alert alert-info">
              You cannot view tasks for future dates.
            </div>
          )}

          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : !isFuture(selectedDate) ? (
            <TaskList
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              isEditable={false}
              isClosed={taskListStatus.isClosed}
              showAddMessage={false}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
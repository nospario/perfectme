import React, { useState } from 'react';

const TaskForm = ({ onAddTask, isDisabled }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      await onAddTask({
        title: formData.title.trim(),
        description: formData.description.trim()
      });
      
      // Reset form on success
      setFormData({
        title: '',
        description: ''
      });
    } catch (error) {
      setErrors({ general: error.message || 'Failed to add task' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">Add New Task</h5>
      </div>
      <div className="card-body">
        {errors.general && (
          <div className="alert alert-danger">{errors.general}</div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">Task Title</label>
            <input
              type="text"
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              disabled={loading || isDisabled}
            />
            {errors.title && (
              <div className="invalid-feedback">{errors.title}</div>
            )}
          </div>
          
          <div className="mb-3">
            <label htmlFor="description" className="form-label">Description (Optional)</label>
            <textarea
              className="form-control"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Enter task description"
              disabled={loading || isDisabled}
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || isDisabled}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Adding Task...
              </>
            ) : (
              'Add Task'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
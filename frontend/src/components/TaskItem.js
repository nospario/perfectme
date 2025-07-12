import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';

const TaskItem = ({ task, index, onToggleComplete, onEdit, onDelete, isEditable, isClosed }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || ''
  });

  const getTaskClass = () => {
    if (isClosed && !task.is_completed) return 'task-overdue';
    if (task.is_completed) return 'task-completed';
    return 'task-incomplete';
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditData({
      title: task.title,
      description: task.description || ''
    });
  };

  const handleSaveEdit = () => {
    if (editData.title.trim() !== task.title || editData.description.trim() !== (task.description || '')) {
      onEdit(task.id, {
        title: editData.title.trim(),
        description: editData.description.trim()
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      title: task.title,
      description: task.description || ''
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <Draggable draggableId={task.id.toString()} index={index} isDragDisabled={!isEditable || isEditing}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`card mb-2 task-item ${getTaskClass()} ${snapshot.isDragging ? 'dragging' : ''}`}
        >
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <div className="flex-grow-1">
                {isEditing ? (
                  <div className="mb-2">
                    <input
                      type="text"
                      name="title"
                      value={editData.title}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      className="form-control form-control-sm mb-2"
                      placeholder="Task title"
                      autoFocus
                    />
                    <textarea
                      name="description"
                      value={editData.description}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      className="form-control form-control-sm"
                      placeholder="Task description (optional)"
                      rows="2"
                    />
                  </div>
                ) : (
                  <>
                    <h6 className="card-title mb-1">{task.title}</h6>
                    {task.description && (
                      <p className="card-text text-muted small mb-2">{task.description}</p>
                    )}
                  </>
                )}
                
                <div className="d-flex align-items-center">
                  <span className="badge bg-primary me-2">{task.percentage}%</span>
                  <div className="progress flex-grow-1 me-2" style={{ height: '20px' }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${task.percentage}%` }}
                      aria-valuenow={task.percentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {task.percentage}%
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="d-flex flex-column gap-1">
                <button
                  className={`btn btn-sm ${task.is_completed ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => onToggleComplete(task.id)}
                  disabled={isClosed}
                >
                  {task.is_completed ? '✓' : '○'}
                </button>
                
                {isEditable && (
                  <>
                    {isEditing ? (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={handleSaveEdit}
                        >
                          ✓
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={handleCancelEdit}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={handleEditClick}
                        >
                          ✎
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={handleDelete}
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TaskItem;
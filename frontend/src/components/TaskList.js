import React from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import TaskItem from './TaskItem';

const TaskList = ({ tasks, onReorder, onToggleComplete, onEdit, onDelete, isEditable, isClosed, onOptimisticReorder, showAddMessage = true }) => {
  const handleDragEnd = (result) => {
    if (!result.destination || !isEditable) return;
    
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Optimistically update the UI first
    if (onOptimisticReorder) {
      onOptimisticReorder(items);
    }
    
    // Then make the API call
    onReorder(items.map(item => parseInt(item.id)));
  };

  const completionPercentage = React.useMemo(() => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => Boolean(task.is_completed));
    const totalPercentage = completedTasks.reduce((sum, task) => {
      const percentage = parseFloat(task.percentage) || 0;
      return sum + percentage;
    }, 0);
    const result = Math.round(totalPercentage);
    return isNaN(result) ? 0 : result;
  }, [tasks]);


  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Today's Tasks</h4>
        <div className="d-flex align-items-center">
          <span className="me-2">Progress:</span>
          <div className="progress" style={{ width: '200px', height: '25px', backgroundColor: '#e9ecef' }}>
            <div
              className="progress-bar bg-success"
              role="progressbar"
              style={{ width: `${completionPercentage}%` }}
              aria-valuenow={completionPercentage}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {completionPercentage}%
            </div>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        showAddMessage ? (
          <div className="text-center py-5">
            <p className="text-muted">No tasks for today. Add some tasks to get started!</p>
          </div>
        ) : (
          <div className="text-center py-5">
            <p className="text-muted">No tasks for this date.</p>
          </div>
        )
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {tasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    index={index}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isEditable={isEditable}
                    isClosed={isClosed}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
};

export default TaskList;
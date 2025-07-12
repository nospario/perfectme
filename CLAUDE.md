# Perfect Me Web Application - Developer Setup Guide

## Project Overview
Build a containerized React web application with MySQL database, email/password authentication, and task management functionality.

## Prerequisites
- Docker and Docker Compose installed
- Node.js and npm
- Basic knowledge of React, MySQL, and Docker

## Step 1: Project Structure Setup

Create the following directory structure:
```
perfect-me-app/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── backend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── database/
│   └── init.sql
├── docker-compose.yml
└── README.md
```

## Step 2: User Authentication Planning

Design a built-in user registration and login system:
- User registration with email and password
- Email validation and password strength requirements
- Secure password hashing and storage
- User login with email and password
- Session management for authenticated users
- Password reset functionality (optional)
- User profile management

## Step 3: Database Setup

Create database tables for the application:
- `users` table with email, password_hash, name, email_verified, created_at, updated_at
- `task_lists` table with user_id, date, is_submitted, is_closed, submitted_at, closed_at
- `tasks` table with task_list_id, title, description, percentage, position, is_completed, completed_at, created_at

Set up proper foreign key relationships and unique constraints for user email and user_id/date combinations.

## Step 4: Backend Development

### 4.1 Backend Setup
Set up the backend with required dependencies for:
- Web server framework
- Database connectivity
- Password hashing and security
- Session management
- Input validation
- Email functionality (for registration verification)

### 4.2 Create Backend Container Configuration
Set up containerization for the backend service with proper port exposure and environment configuration.

### 4.3 Backend Environment Variables
Configure environment variables for:
- Database connection details
- Session secrets
- JWT secrets
- Email service credentials (if implementing email verification)

### 4.4 Backend API Endpoints to Implement

**Authentication Routes:**
- `POST /auth/register` - User registration with email and password
- `POST /auth/login` - User login with email and password
- `POST /auth/logout` - User logout
- `GET /auth/user` - Get current authenticated user
- `POST /auth/forgot-password` - Password reset request (optional)
- `POST /auth/reset-password` - Password reset confirmation (optional)

**Task Management Routes:**
- `GET /api/tasks/today` - Get today's tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/reorder` - Reorder tasks
- `PUT /api/tasks/:id/complete` - Mark task as complete
- `GET /api/tasks/history/:date` - Get tasks for specific date

**Task List Management:**
- `POST /api/tasklist/submit` - Submit task list
- `POST /api/tasklist/close` - Close task list
- `GET /api/tasklist/status` - Get task list status

## Step 5: Frontend Development

### 5.1 Frontend Setup
Set up the React frontend with required dependencies for:
- UI framework (Bootstrap)
- HTTP client for API calls
- Routing
- Drag and drop functionality
- Calendar component
- Form validation

### 5.2 Create Frontend Container Configuration
Set up containerization for the frontend service with proper port exposure and dependency configuration.

### 5.3 Frontend Components to Create

**Authentication Components:**
- `LoginPage.js` - Email and password login form
- `RegisterPage.js` - User registration form
- `ForgotPasswordPage.js` - Password reset request form (optional)
- `ResetPasswordPage.js` - Password reset confirmation form (optional)
**Core Application Components:**
- `Dashboard.js` - Main task management interface
- `TaskList.js` - Display and manage tasks
- `TaskItem.js` - Individual task component with drag/drop
- `TaskForm.js` - Add/edit task form
- `Calendar.js` - Historical task view
- `ProgressBar.js` - Task completion percentage
- `ConfirmationModal.js` - Submit/close confirmations
- `UserProfile.js` - User profile management (optional)

### 5.4 Key Frontend Features to Implement

**Authentication Management:**
- User registration form with validation
- Login form with email and password
- Session management and token handling
- Protected routes for authenticated users
- Form validation for email format and password strength

**Task Management Logic:**
- Maximum 10 tasks per day validation
- Automatic percentage calculation (decreasing from first to last)
- Drag and drop reordering functionality
- Real-time completion percentage updates
- Task status highlighting (green/amber/red)

**State Management:**
- Track user authentication status
- Track task list submission status
- Handle task CRUD operations
- Calendar date selection

## Step 6: Container Orchestration

Set up Docker Compose configuration with three services:
- MySQL database service with environment variables and volume mounting
- Backend service depending on MySQL
- Frontend service depending on backend

Include proper port mappings, environment variables, and volume configurations for development.

## Step 7: Task Percentage Calculation Algorithm

Implement backend logic to calculate task percentages where:
- Single task gets 100%
- Multiple tasks get decreasing percentages from first to last
- Total always equals 100%
- Use weighted distribution based on position

## Step 8: Automated Task List Closing

Implement a cron job or scheduled task to:
- Run at midnight daily
- Close all unclosed task lists from previous day
- Mark uncompleted tasks as red
- Update task list status in database

## Step 9: Build and Run

1. Set up the complete project structure
2. Configure environment variables for database and authentication
3. Build and run the containerized application
4. Access application through the web browser

## Step 10: Testing Checklist

**Authentication:**
- User registration and login functionality
- Password security and validation
- User session management
- Unauthorized access protection

**Task Management:**
- Maximum 10 tasks per day limit
- Correct percentage calculations
- Drag and drop reordering
- Task completion tracking
- Task editing/deletion before submission

**Task List Lifecycle:**
- Task list submission prevents editing
- Confirmation modals for submit/close actions
- Automatic task list closing at midnight
- Historical task viewing

**UI/UX:**
- Bootstrap styling implementation
- Responsive design
- Task status color coding (green/amber/red)
- Progress bar updates

## Step 11: Key Business Rules Implementation

**Task List States:**
- **Editable**: Before submission, tasks can be added, edited, deleted, and reordered
- **Submitted**: After "Submit Task List" button, no modifications allowed
- **Closed**: After midnight or "Close Task List" button, permanently locked

**Task Completion Logic:**
- Completed tasks: Green highlighting
- Uncompleted tasks: Amber highlighting
- Overdue tasks (after closing): Red highlighting
- Progress bar shows completion percentage

**Validation Rules:**
- Maximum 10 tasks per day
- Task list submission requires confirmation
- Task list closing requires confirmation
- One task list per user per day

## Step 12: Deployment Considerations

For production deployment, consider:
- Environment-specific configuration management
- Error handling and logging implementation
- Input validation and data sanitization
- Security certificates and HTTPS setup
- Production database configuration
- Session and authentication security
- Monitoring and health check systems
- Production-ready container images
- Automated deployment pipeline setup

This guide provides the complete foundation for building your Perfect Me task management application. Follow each step systematically and test thoroughly at each phase.
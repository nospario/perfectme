# Perfect Me - Task Management Application

A containerized React web application with MySQL database for daily task management with user authentication.

## Features

- **User Authentication**: Email/password registration and login
- **Task Management**: Create, edit, delete, and reorder up to 10 tasks per day
- **Task Percentage Calculation**: Automatic percentage assignment based on task position
- **Drag & Drop**: Reorder tasks with drag and drop functionality
- **Task States**: Submit and close task lists with proper state management
- **Historical View**: Calendar view for past task lists
- **Responsive Design**: Bootstrap-based UI that works on all devices

## Architecture

- **Frontend**: React 18 with Bootstrap 5
- **Backend**: Node.js with Express
- **Database**: MySQL 8.0
- **Containerization**: Docker and Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for development)

### Run with Docker

1. Clone the repository
2. Start the application:
   ```bash
   docker-compose up -d
   ```
3. Access the application at `http://localhost:3000`

### Development Setup

1. **Database Setup**:
   ```bash
   docker-compose up db -d
   ```

2. **Backend Development**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run dev
   ```

3. **Frontend Development**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/user` - Get current user

### Task Management
- `GET /api/tasks/today` - Get today's tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/reorder` - Reorder tasks
- `PUT /api/tasks/:id/complete` - Mark task complete/incomplete
- `GET /api/tasks/history/:date` - Get tasks for specific date

### Task List Management
- `POST /api/tasklist/submit` - Submit task list
- `POST /api/tasklist/close` - Close task list
- `GET /api/tasklist/status` - Get task list status

## Business Rules

### Task Management
- Maximum 10 tasks per day
- Task percentages calculated automatically (decreasing from first to last)
- Total percentages always equal 100%
- Drag and drop reordering updates percentages

### Task List States
- **Editable**: Before submission - full CRUD operations allowed
- **Submitted**: After "Submit Task List" - only completion status can be changed
- **Closed**: After "Close Task List" or automatic midnight closing - no modifications allowed

### Color Coding
- **Green**: Completed tasks
- **Amber**: Incomplete tasks
- **Red**: Overdue tasks (after task list is closed)

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers

## Production Deployment

1. Update environment variables in `docker-compose.yml`
2. Change JWT secret to a secure random string
3. Configure proper database credentials
4. Set up SSL/TLS certificates
5. Use production-ready database configuration

## Database Schema

- **users**: User account information
- **task_lists**: Daily task list metadata
- **tasks**: Individual task data with percentages and completion status

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Ensure all containers build successfully

## License

This project is licensed under the ISC License.
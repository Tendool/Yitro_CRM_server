# Yitro CRM - Windows Development Setup

## Quick Start for Windows

### Prerequisites
1. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
2. **Git** - Download from [git-scm.com](https://git-scm.com/)

### Option 1: Using Batch File (Simple)
1. Open Command Prompt or PowerShell in the project directory
2. Run: `start-dev.bat`

### Option 2: Using PowerShell Script (Recommended)
1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` (one-time setup)
3. Navigate to project directory
4. Run: `.\start-dev.ps1`

### Option 3: Manual Setup
1. Install dependencies: `npm install`
2. Start development servers: `npm run dev:full`

### Accessing the Application
- **Frontend**: http://localhost:8080
- **API**: http://localhost:3001

### Test Accounts
- **Admin**: admin@yitro.com / admin123
- **User**: user@yitro.com / admin123

### Features
✅ **Data Persistence**: User sessions and data persist after logout/login  
✅ **SQLite Database**: No external database setup required  
✅ **Hot Reload**: Frontend and API auto-restart on changes  
✅ **Cross-Platform**: Works on Windows, macOS, and Linux  

### Troubleshooting

#### Port Already in Use
If you get "port already in use" errors:
1. Close any running servers (Ctrl+C)
2. Kill any remaining processes:
   ```
   npx kill-port 8080
   npx kill-port 3001
   ```

#### Permission Issues (PowerShell)
If PowerShell blocks script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Node.js Issues
- Ensure Node.js 18+ is installed
- Restart your terminal after installing Node.js
- Try running `node --version` to verify installation

### Development Commands
- `npm run dev` - Start frontend only (port 8080)
- `npm run dev:api` - Start API only (port 3001)  
- `npm run dev:full` - Start both frontend and API
- `npm run build` - Build for production
- `npm start` - Run production build

### Database
The application uses SQLite with a file-based database (`dev.db`). Data persists between sessions automatically. No additional database setup is required.
# AssetFlow - IT Asset Management System

A professional, production-ready IT asset management system with role-based access control, maintenance workflow, and comprehensive reporting.

## 🎯 Overview

AssetFlow is a full-stack web application designed to manage IT assets throughout their lifecycle. It provides a complete solution for tracking assets, managing assignments, handling maintenance tickets, and generating reports.

## ✅ Tech Stack

### Backend
- **Framework**: Flask 3.0 (Python)
- **Database**: SQLite (dev) / MySQL (production)
- **Authentication**: JWT (Flask-JWT-Extended)
- **ORM**: SQLAlchemy
- **API**: RESTful architecture

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Routing**: React Router v6
- **Notifications**: Sonner

## 📋 Features

### 1. Authentication & Authorization
- JWT-based authentication with refresh tokens
- Secure token storage (sessionStorage)
- Role-based access control (RBAC)
- Four user roles: Admin, Asset Manager, HR, Employee

### 2. Asset Management
- Complete CRUD operations for assets
- Advanced server-side and client-side filtering:
  - By category, status, department
  - By assigned user
  - By date range
  - By warranty expiration
  - Full-text search
- Asset assignment and release workflow
- Asset history and audit logging
- Depreciation calculation (straight-line method)
- CSV export functionality

### 3. Maintenance Ticket System
- Create, update, and track maintenance tickets
- Ticket priority levels (Low, Medium, High, Critical)
- Status workflow: New → Under Review → In Progress → Resolved → Closed
- Automatic asset status updates
- File attachment support
- Ticket assignment to technicians
- Resolution tracking

### 4. License Management
- Software license tracking
- Renewal alerts
- Expiration monitoring
- Cost tracking

### 5. Dashboard & Reporting
- Real-time KPI cards:
  - Total assets
  - Available assets
  - Under maintenance
  - Open tickets
- Interactive charts (Recharts):
  - Assets by category (Bar chart)
  - Assets by status (Pie chart)
  - Assets by department (Pie chart)
- Warranty expiration alerts
- Recent activity feed
- Asset value and depreciation reports

### 6. User Management (Admin only)
- Create, update, and delete users
- Role assignment
- Department management
- Activity tracking

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+ and npm
- Git

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd assetFlow
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp ../.env.example .env
# Edit .env with your configuration

# Run the backend
python run.py
```

The backend will start on `http://localhost:5000`

#### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend-react

# Install dependencies
npm install

# Install shadcn/ui components (if needed)
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu

# Create .env file
cp .env.example .env
# Edit .env with your API URL

# Run the frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### First Time Setup

1. **Access the application**: Open `http://localhost:5173` in your browser

2. **Register the first admin user**:
   - Use the registration form
   - Select "Admin" as the role
   - Use a strong password

3. **Login** with your admin credentials

4. **Start using the system**:
   - Add users
   - Create asset categories
   - Add assets
   - Assign assets to users
   - Create maintenance tickets

## 📁 Project Structure

```
assetFlow/
├── backend/                    # Flask Backend
│   ├── app/
│   │   ├── models/            # SQLAlchemy Models
│   │   ├── routes/            # API Endpoints
│   │   ├── middleware/        # Auth & Error Handling
│   │   └── utils/             # Helper Functions
│   ├── requirements.txt
│   └── run.py
│
├── frontend-react/             # React Frontend
│   ├── src/
│   │   ├── api/              # API Layer (Axios)
│   │   ├── components/       # React Components
│   │   ├── hooks/            # Custom React Hooks
│   │   ├── context/          # React Context
│   │   ├── pages/            # Page Components
│   │   ├── types/            # TypeScript Types
│   │   └── lib/              # Utilities
│   ├── package.json
│   └── vite.config.ts
│
├── ARCHITECTURE.md            # System Architecture
├── .env.example              # Environment Variables Template
└── README.md                 # This file
```

## 🔐 Role-Based Permissions

| Feature | Admin | Asset Manager | HR | Employee |
|---------|-------|--------------|-----|----------|
| **Dashboard** | ✅ Full | ✅ Full | ✅ Full | ❌ |
| **View Assets** | ✅ All | ✅ All | ✅ All | ✅ Assigned |
| **Create Assets** | ✅ | ✅ | ❌ | ❌ |
| **Update Assets** | ✅ | ✅ | ❌ | ❌ |
| **Delete Assets** | ✅ | ✅ | ❌ | ❌ |
| **Assign Assets** | ✅ | ✅ | ✅ | ❌ |
| **Release Assets** | ✅ | ✅ | ✅ | ✅ Own only |
| **View Maintenance** | ✅ All | ✅ All | ✅ All | ✅ Own |
| **Create Tickets** | ✅ | ✅ | ✅ | ✅ |
| **Update Tickets** | ✅ | ✅ | ✅ | ❌ |
| **Manage Users** | ✅ | ❌ | ❌ | ❌ |
| **View Reports** | ✅ | ✅ | ✅ | ❌ |

## 🛠️ API Endpoints

### Authentication
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login
POST   /api/auth/refresh           Refresh token
GET    /api/auth/me                Get current user
PUT    /api/auth/me                Update profile
POST   /api/auth/change-password   Change password
```

### Assets
```
GET    /api/assets                 List assets (with filters)
POST   /api/assets                 Create asset
GET    /api/assets/:id             Get asset details
PUT    /api/assets/:id             Update asset
DELETE /api/assets/:id             Delete asset
POST   /api/assets/:id/assign      Assign asset
POST   /api/assets/:id/release     Release asset
GET    /api/assets/:id/history     Get asset history
GET    /api/assets/:id/depreciation Get depreciation
GET    /api/assets/export          Export to CSV
```

### Maintenance
```
GET    /api/maintenance            List tickets (with filters)
POST   /api/maintenance            Create ticket
GET    /api/maintenance/:id        Get ticket details
PUT    /api/maintenance/:id        Update ticket
DELETE /api/maintenance/:id        Delete ticket
PUT    /api/maintenance/:id/status Update ticket status
PUT    /api/maintenance/:id/assign Assign ticket
POST   /api/maintenance/:id/upload Upload attachment
```

### Dashboard
```
GET    /api/dashboard/stats                Get KPI statistics
GET    /api/dashboard/assets-by-category   Assets by category
GET    /api/dashboard/assets-by-department Assets by department
GET    /api/dashboard/assets-by-status     Assets by status
GET    /api/dashboard/warranty-expiring    Expiring warranties
GET    /api/dashboard/recent-activities    Recent activities
GET    /api/dashboard/maintenance-stats    Maintenance stats
```

### Users
```
GET    /api/users                  List users
GET    /api/users/:id              Get user details
PUT    /api/users/:id              Update user (Admin)
DELETE /api/users/:id              Delete user (Admin)
GET    /api/users/:id/assets       Get user's assets
```

### Licenses
```
GET    /api/licenses               List licenses
POST   /api/licenses               Create license
GET    /api/licenses/:id           Get license details
PUT    /api/licenses/:id           Update license
DELETE /api/licenses/:id           Delete license
GET    /api/licenses/expiring      Get expiring licenses
```

## 🔧 Configuration

### Backend (.env)
```env
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
DATABASE_URL=sqlite:///assetflow.db
CORS_ORIGINS=http://localhost:5173
PORT=5000
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 📊 Database Schema

See `ARCHITECTURE.md` for detailed database schema including:
- Users table
- Assets table
- MaintenanceTickets table
- AssetHistory table (audit logs)
- Licenses table

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend-react
npm test
```

## 🚢 Deployment

### Backend Deployment

1. **Set up production database** (MySQL recommended)

2. **Update environment variables** for production

3. **Use Gunicorn** as WSGI server:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

4. **Set up Nginx** as reverse proxy

5. **Enable HTTPS** with Let's Encrypt

### Frontend Deployment

1. **Build the production bundle**:
```bash
npm run build
```

2. **Deploy to hosting** (Netlify, Vercel, or any static hosting)

3. **Configure environment variables** in hosting platform

## 🔒 Security Best Practices

✅ JWT tokens stored in sessionStorage (not localStorage)  
✅ Automatic token refresh mechanism  
✅ Password hashing with bcrypt  
✅ Input validation on backend  
✅ SQL injection prevention (ORM)  
✅ XSS protection (React auto-escaping)  
✅ CORS configuration  
✅ Role-based authorization on all endpoints  
✅ Rate limiting ready (implement in production)  

## 📝 Development Notes

### TypeScript Errors
The TypeScript lint errors you see are expected before running `npm install`. They will be resolved once all dependencies are installed.

### Adding New Features
1. **Backend**: Add new models in `backend/app/models/`, routes in `backend/app/routes/`
2. **Frontend**: Add new components in `frontend-react/src/components/`, pages in `frontend-react/src/pages/`
3. **API Integration**: Add API functions in `frontend-react/src/api/`, hooks in `frontend-react/src/hooks/`

### Database Migrations
For schema changes in production:
```bash
# Using Flask-Migrate (install if needed)
flask db init
flask db migrate -m "Description of changes"
flask db upgrade
```

## 🐛 Troubleshooting

### Backend Issues
- **Port already in use**: Change PORT in `.env`
- **Database errors**: Delete `assetflow.db` and restart
- **JWT errors**: Regenerate SECRET_KEY and JWT_SECRET_KEY

### Frontend Issues
- **Module not found**: Run `npm install`
- **API connection**: Check VITE_API_BASE_URL in `.env`
- **Build errors**: Clear node_modules and reinstall

## 📚 Additional Resources

- **Architecture Documentation**: See `ARCHITECTURE.md`
- **API Documentation**: See endpoint definitions above
- **Component Library**: [shadcn/ui](https://ui.shadcn.com/)
- **React Query**: [TanStack Query](https://tanstack.com/query)
- **Flask**: [Flask Documentation](https://flask.palletsprojects.com/)

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 💬 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Built with ❤️ for efficient IT asset management**

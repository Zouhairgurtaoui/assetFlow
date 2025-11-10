import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  Users, 
  User 
} from 'lucide-react';

const Sidebar = () => {
  const { user, hasRole } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['Admin', 'Asset Manager', 'HR', 'Employee'] },
    { to: '/assets', icon: Package, label: 'Assets', roles: ['Admin', 'Asset Manager', 'HR', 'Employee'] },
    { to: '/maintenance', icon: Wrench, label: 'Maintenance', roles: ['Admin', 'Asset Manager', 'HR', 'Employee'] },
    { to: '/users', icon: Users, label: 'Users', roles: ['Admin'] },
    { to: '/profile', icon: User, label: 'Profile', roles: ['Admin', 'Asset Manager', 'HR', 'Employee'] },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">AssetFlow</h1>
        <p className="text-sm text-muted-foreground">IT Asset Management</p>
      </div>

      <nav className="px-4 space-y-2">
        {navItems.map((item) => {
          if (!hasRole(item.roles as any)) return null;
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

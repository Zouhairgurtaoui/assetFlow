import { Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ActivityFeed from '../common/ActivityFeed';

const Layout = () => {
  const { user } = useAuth();
  const canViewActivityFeed = user?.role === 'Admin' || user?.role === 'Asset Manager';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
          
          {/* Right Sidebar - Activity Feed (Admin and Asset Manager only) */}
          {canViewActivityFeed && (
            <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto hidden lg:block">
              <ActivityFeed />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default Layout;

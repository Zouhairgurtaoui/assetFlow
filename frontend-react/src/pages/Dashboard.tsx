import { useDashboardStats, useAssetsByCategory, useAssetsByStatus } from '@/hooks/useDashboard';
import { useAssets } from '@/hooks/useAssets';
import { useAuth } from '@/context/AuthContext';
import { Package, CheckCircle, AlertCircle, Wrench, Laptop } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'Employee';
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: categoryData } = useAssetsByCategory();
  const { data: statusData } = useAssetsByStatus();
  const { data: assets } = useAssets();

  // Map colors to specific statuses
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return '#10b981'; // Green
      case 'assigned':
      case 'in use':
        return '#3b82f6'; // Blue
      case 'under maintenance':
      case 'maintenance':
        return '#f59e0b'; // Yellow/Orange
      case 'retired':
      case 'disposed':
        return '#ef4444'; // Red
      default:
        return '#8b5cf6'; // Purple
    }
  };

  // Get employee's assigned assets count
  const myAssetsCount = isEmployee && user ? assets?.filter(asset => asset.assigned_to_user_id === user.id).length || 0 : 0;

  if (statsLoading) {
    return <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  // Employee Dashboard View
  if (isEmployee) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.username}!</h1>
          <p className="text-muted-foreground">Your assigned assets and actions</p>
        </div>

        {/* Employee Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/assets" className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">My Assets</p>
                <p className="text-4xl font-bold mt-2 text-blue-600">{myAssetsCount}</p>
                <p className="text-sm text-muted-foreground mt-2">Click to view all your assigned assets</p>
              </div>
              <Laptop className="w-16 h-16 text-blue-500" />
            </div>
          </Link>

          <Link to="/maintenance" className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Report Issue</p>
                <p className="text-lg font-semibold mt-2 text-orange-600">Create Ticket</p>
                <p className="text-sm text-muted-foreground mt-2">Report maintenance issues for your assets</p>
              </div>
              <Wrench className="w-16 h-16 text-orange-500" />
            </div>
          </Link>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Quick Guide</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>View all assets assigned to you in the <strong>Assets</strong> page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Report any issues or request maintenance in the <strong>Maintenance</strong> page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Update your profile information in the <strong>Profile</strong> page</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // Admin/Manager Dashboard View

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your IT assets and operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Assets</p>
              <p className="text-3xl font-bold mt-2">{stats?.assets.total || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Value: {formatCurrency(stats?.assets.total_value || 0)}
              </p>
            </div>
            <Package className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{stats?.assets.available || 0}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Under Maintenance</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">{stats?.assets.under_maintenance || 0}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open Tickets</p>
              <p className="text-3xl font-bold mt-2 text-red-600">{stats?.maintenance.open || 0}</p>
            </div>
            <Wrench className="w-12 h-12 text-red-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Assets by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Assets by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.status}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(statusData || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

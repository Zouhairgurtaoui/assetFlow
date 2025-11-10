import { useRecentActivities } from '@/hooks/useDashboard';
import { formatDate } from '@/lib/utils';
import { Activity, Package, Wrench, UserPlus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ActivityLogs = () => {
  const { data: activities, isLoading } = useRecentActivities(100);

  const getActivityIcon = (action: string) => {
    if (action.includes('asset') || action.includes('assigned') || action.includes('released')) {
      return <Package className="w-5 h-5 text-blue-500" />;
    }
    if (action.includes('maintenance')) {
      return <Wrench className="w-5 h-5 text-orange-500" />;
    }
    if (action.includes('user') || action.includes('created')) {
      return <UserPlus className="w-5 h-5 text-green-500" />;
    }
    return <Activity className="w-5 h-5 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link 
              to="/dashboard" 
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
              <p className="text-muted-foreground">Complete system activity history</p>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Showing {activities?.length || 0} activities
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities && activities.length > 0 ? (
              activities.map((activity: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                      {getActivityIcon(activity.action)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {activity.details}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <span className="text-gray-500">by</span>
                      <span className="font-medium">{activity.username || 'System'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(activity.created_at)}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No activity logs found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogs;

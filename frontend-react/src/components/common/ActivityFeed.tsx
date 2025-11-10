import { Link } from 'react-router-dom';
import { useRecentActivities } from '@/hooks/useDashboard';
import { formatRelativeTime } from '@/lib/utils';
import { Activity, Package, Wrench, UserPlus, Eye } from 'lucide-react';

const ActivityFeed = () => {
  const { data: activities, isLoading } = useRecentActivities(15);

  const getActivityIcon = (action: string) => {
    if (action.includes('asset') || action.includes('assigned') || action.includes('released')) {
      return <Package className="w-4 h-4 text-blue-500" />;
    }
    if (action.includes('maintenance')) {
      return <Wrench className="w-4 h-4 text-orange-500" />;
    }
    if (action.includes('user') || action.includes('created')) {
      return <UserPlus className="w-4 h-4 text-green-500" />;
    }
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
          <Link 
            to="/activity-logs" 
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <Eye className="w-4 h-4" />
            View All
          </Link>
        </div>
        <p className="text-xs text-gray-500">Latest system activities</p>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        {!activities || activities.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No recent activities</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((activity: any, index: number) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 break-words">
                      {activity.details}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {activity.username && (
                        <span className="text-xs text-gray-500">
                          by {activity.username}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(activity.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;

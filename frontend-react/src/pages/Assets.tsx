import { useState, useEffect, useMemo } from 'react';
import { useAssets, useAssetMutations } from '@/hooks/useAssets';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/context/AuthContext';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Plus, Search, Edit2, UserPlus, UserMinus, Filter } from 'lucide-react';
import AddAssetModal from '@/components/assets/AddAssetModal';
import EditAssetModal from '@/components/assets/EditAssetModal';
import AssignAssetModal from '@/components/assets/AssignAssetModal';
import ReleaseAssetModal from '@/components/assets/ReleaseAssetModal';
import { Asset } from '@/types/asset';

const Assets = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'Employee';
  const canManageAssets = user?.role === 'Admin' || user?.role === 'Asset Manager';
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'available' | 'assigned'>('all');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetToAssign, setAssetToAssign] = useState<Asset | null>(null);
  const [assetToRelease, setAssetToRelease] = useState<Asset | null>(null);
  const { data: assets, isLoading, refetch } = useAssets({ search });
  const { data: users } = useUsers();
  const { deleteAsset } = useAssetMutations();

  // Debounce search to prevent focus loss
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Filter assets based on filter type and selected user
  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    
    let filtered = assets;

    // For employees: show only their assigned assets
    if (isEmployee && user) {
      filtered = filtered.filter(asset => asset.assigned_to_user_id === user.id);
    } 
    // For HR, Admin, and Asset Manager: apply filters
    else {
      // Apply availability filter
      if (filterType === 'available') {
        filtered = filtered.filter(asset => !asset.assigned_to_user_id);
      } else if (filterType === 'assigned') {
        filtered = filtered.filter(asset => asset.assigned_to_user_id);
      }

      // Apply user filter
      if (selectedUserId) {
        filtered = filtered.filter(asset => asset.assigned_to_user_id === selectedUserId);
      }
    }

    return filtered;
  }, [assets, filterType, selectedUserId, isEmployee, user]);

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowEditModal(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete asset "${name}"?`)) {
      deleteAsset.mutate(id, {
        onSuccess: () => refetch()
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
          <p className="text-muted-foreground">
            {isEmployee ? 'My Assigned Assets' : (canManageAssets ? 'Manage your IT assets' : 'View IT assets')}
          </p>
        </div>
        {canManageAssets && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Add Asset
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or SN..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            autoComplete="off"
          />
        </div>

        {/* Filters (Hidden for Employees only) */}
        {!isEmployee && (
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            {/* Status Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilterType('all');
                  setSelectedUserId(null);
                }}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filterType === 'all' && !selectedUserId
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Assets
              </button>
              <button
                onClick={() => {
                  setFilterType('available');
                  setSelectedUserId(null);
                }}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filterType === 'available'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Available Only
              </button>
              <button
                onClick={() => {
                  setFilterType('assigned');
                  setSelectedUserId(null);
                }}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filterType === 'assigned'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Assigned Only
              </button>
            </div>

            {/* User Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">By User:</span>
              <select
                value={selectedUserId || ''}
                onChange={(e) => {
                  const userId = e.target.value ? parseInt(e.target.value) : null;
                  setSelectedUserId(userId);
                  if (userId) {
                    setFilterType('all');
                  }
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Users</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Filter Indicator */}
            {(filterType !== 'all' || selectedUserId) && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setSelectedUserId(null);
                }}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              {canManageAssets && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                  <div className="text-sm text-gray-500">{asset.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.serial_number || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(asset.status)}`}>
                    {asset.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(asset.created_at)}</td>
                {canManageAssets && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(asset)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                    <button 
                      onClick={() => {
                        setAssetToAssign(asset);
                        setShowAssignModal(true);
                      }}
                      className="text-green-600 hover:text-green-800 mr-2"
                      title="Assign to User"
                    >
                      <UserPlus className="w-4 h-4 inline" />
                    </button>
                    <button 
                      onClick={() => {
                        setAssetToRelease(asset);
                        setShowReleaseModal(true);
                      }}
                      className="text-orange-600 hover:text-orange-800 mr-2"
                      title="Release from User"
                    >
                      <UserMinus className="w-4 h-4 inline" />
                    </button>
                    <button 
                      onClick={() => handleDelete(asset.id, asset.name)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddAssetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          refetch();
          setShowAddModal(false);
        }}
      />

      {selectedAsset && (
        <EditAssetModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAsset(null);
          }}
          onSuccess={() => {
            refetch();
            setShowEditModal(false);
            setSelectedAsset(null);
          }}
          asset={selectedAsset}
        />
      )}

      {assetToAssign && (
        <AssignAssetModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setAssetToAssign(null);
          }}
          onSuccess={() => {
            refetch();
            setShowAssignModal(false);
            setAssetToAssign(null);
          }}
          asset={assetToAssign}
        />
      )}

      {assetToRelease && (
        <ReleaseAssetModal
          isOpen={showReleaseModal}
          onClose={() => {
            setShowReleaseModal(false);
            setAssetToRelease(null);
          }}
          onSuccess={() => {
            refetch();
            setShowReleaseModal(false);
            setAssetToRelease(null);
          }}
          asset={assetToRelease}
        />
      )}
    </div>
  );
};

export default Assets;

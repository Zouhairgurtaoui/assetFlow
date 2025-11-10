import { useState } from 'react';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useAuth } from '@/context/AuthContext';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Plus, Wrench, Trash2 } from 'lucide-react';
import CreateTicketModal from '@/components/maintenance/CreateTicketModal';
import { maintenanceApi } from '@/api/maintenance';
import { toast } from 'sonner';
import { TICKET_STATUSES } from '@/lib/constants';

const Maintenance = () => {
  const { user } = useAuth();
  const canModifyTickets = user?.role === 'Admin' || user?.role === 'Asset Manager';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: tickets, isLoading, refetch } = useMaintenance();

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await maintenanceApi.updateTicketStatus(id, { status: newStatus });
      toast.success('Ticket status updated');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete ticket "${title}"?`)) {
      try {
        await maintenanceApi.deleteTicket(id);
        toast.success('Ticket deleted successfully');
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete ticket');
      }
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Tickets</h1>
          <p className="text-muted-foreground">Manage maintenance requests and issues</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Create Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
              <p className="text-2xl font-bold">{tickets?.length || 0}</p>
            </div>
            <Wrench className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-muted-foreground">New</p>
          <p className="text-2xl font-bold text-blue-600">{tickets?.filter(t => t.status === 'New').length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">{tickets?.filter(t => t.status === 'In Progress').length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{tickets?.filter(t => t.status === 'Resolved').length || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              {canModifyTickets && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets && tickets.length > 0 ? (
              tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{ticket.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.asset_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canModifyTickets ? (
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                        className={`px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${getStatusColor(ticket.status)}`}
                      >
                        {TICKET_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(ticket.created_at)}</td>
                  {canModifyTickets && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(ticket.id, ticket.title)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No maintenance tickets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreateTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          refetch();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};

export default Maintenance;

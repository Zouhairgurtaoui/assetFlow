import { useState } from 'react';
import { X } from 'lucide-react';
import { assetsApi } from '@/api/assets';
import { toast } from 'sonner';
import { Asset } from '@/types/asset';

interface ReleaseAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset;
}

const ReleaseAssetModal = ({ isOpen, onClose, onSuccess, asset }: ReleaseAssetModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await assetsApi.releaseAsset(asset.id);
      toast.success('Asset released successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to release asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Release Asset</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 mb-2">Are you sure you want to release this asset?</p>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Asset</p>
            <p className="font-semibold">{asset.name}</p>
            {asset.assigned_to && (
              <>
                <p className="text-sm text-gray-600 mt-2">Currently Assigned To</p>
                <p className="font-semibold">{asset.assigned_to}</p>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Releasing...' : 'Release Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReleaseAssetModal;

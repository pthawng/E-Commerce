/**
 * Example Component - Users List
 * Ví dụ sử dụng TanStack Query hooks
 */
import { useUsers } from '@/services/queries';
import { useDeleteUser } from '@/services/mutations';
import { PAGINATION } from '@shared/config';

export function UsersListExample() {
  const { data, isLoading, error, refetch } = useUsers({
    page: PAGINATION.DEFAULT_PAGE,
    limit: PAGINATION.DEFAULT_LIMIT,
  });

  const deleteUser = useDeleteUser();

  if (isLoading) {
    return <div className="p-4">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error instanceof Error ? error.message : 'Unknown error'}
        <button onClick={() => refetch()} className="ml-4 underline">
          Retry
        </button>
      </div>
    );
  }

  if (!data?.items || data.items.length === 0) {
    return <div className="p-4">No users found</div>;
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser.mutateAsync(id);
        // Query sẽ tự động refetch sau khi delete thành công
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Users List</h2>
      <div className="space-y-2">
        {data.items.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 border rounded"
          >
            <div>
              <p className="font-semibold">{user.fullName || 'N/A'}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={() => handleDelete(user.id)}
              disabled={deleteUser.isPending}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {deleteUser.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ))}
      </div>
      {data.meta && (
        <div className="mt-4 text-sm text-gray-500">
          Page {data.meta.page} of {data.meta.totalPages} (Total: {data.meta.total})
        </div>
      )}
    </div>
  );
}


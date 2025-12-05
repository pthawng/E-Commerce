# API Services với TanStack Query

## Cài đặt

```bash
npm install
```

## Cấu trúc

```
services/
├── apiClient.ts          # Base API client (GET, POST, PUT, DELETE)
├── queries/              # Query hooks (useQuery)
│   ├── auth.queries.ts
│   ├── users.queries.ts
│   ├── products.queries.ts
│   └── orders.queries.ts
├── mutations/            # Mutation hooks (useMutation)
│   ├── users.mutations.ts
│   └── products.mutations.ts
└── index.ts             # Export tất cả
```

## Query Keys Factory

Tất cả query keys được quản lý tập trung trong `@/lib/query-keys.ts`:

```typescript
import { queryKeys } from '@/lib/query-keys';

// Users
queryKeys.users.list(filters)
queryKeys.users.detail(id)

// Products
queryKeys.products.list(filters)
queryKeys.products.detail(id)
queryKeys.products.bySlug(slug)
```

## Sử dụng Queries

### Ví dụ: Lấy danh sách users

```typescript
import { useUsers } from '@/services/queries';

function UsersList() {
  const { data, isLoading, error } = useUsers({
    page: 1,
    limit: 20,
    search: 'john',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.items.map((user) => (
        <div key={user.id}>{user.fullName}</div>
      ))}
    </div>
  );
}
```

### Ví dụ: Lấy user by ID

```typescript
import { useUser } from '@/services/queries';

function UserDetail({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return <div>{user.fullName}</div>;
}
```

## Sử dụng Mutations

### Ví dụ: Tạo user

```typescript
import { useCreateUser } from '@/services/mutations';

function CreateUserForm() {
  const createUser = useCreateUser();

  const handleSubmit = async (data: Partial<User>) => {
    try {
      const newUser = await createUser.mutateAsync(data);
      console.log('User created:', newUser);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Ví dụ: Update user

```typescript
import { useUpdateUser } from '@/services/mutations';

function EditUserForm({ userId, userData }: Props) {
  const updateUser = useUpdateUser();

  const handleSubmit = async (data: Partial<User>) => {
    try {
      await updateUser.mutateAsync({ id: userId, data });
      // Query sẽ tự động refetch sau khi mutation thành công
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={updateUser.isPending}>Update</button>
    </form>
  );
}
```

## Invalidate Queries

Mutations tự động invalidate queries liên quan. Nếu cần invalidate thủ công:

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

function MyComponent() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    // Invalidate tất cả users queries
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    
    // Hoặc chỉ invalidate list
    queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
  };

  return <button onClick={handleRefresh}>Refresh</button>;
}
```

## Best Practices

1. **Luôn sử dụng query keys từ factory** - Dễ quản lý và invalidate
2. **Sử dụng `enabled` option** - Chỉ fetch khi cần thiết
3. **Handle loading và error states** - Luôn có UI feedback
4. **Sử dụng mutations cho create/update/delete** - Tự động invalidate queries
5. **Type-safe** - Tất cả đều có TypeScript types từ shared


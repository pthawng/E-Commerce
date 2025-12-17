# UI Components

Base UI components (shadcn/ui, Ant Design, custom components)

## Structure

- Mỗi component nên có folder riêng
- Export qua `index.ts` để dễ import

## Example

```
ui/
├── Button/
│   ├── index.tsx
│   └── Button.styles.ts
├── Input/
│   └── index.tsx
└── index.ts  # Export all
```

## Usage

```typescript
import { Button, Input } from '@/components/ui';
```


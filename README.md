# E-Commerce Platform: Ray Paradis

A production-grade, full-stack e-commerce platform built with modern TypeScript technologies, featuring a microservices-inspired monorepo architecture, comprehensive RBAC/ABAC authorization, and real-time inventory management.

## Project Overview

### Problem Statement
Building a scalable e-commerce platform that handles complex product variants (jewelry with multiple attributes like size, metal type, gemstone), multi-warehouse inventory tracking, and granular permission-based access control for different user types (customers, staff, admins).

### Target Users
- **Customers**: Browse products, manage carts, place orders
- **Staff**: Manage inventory, process orders, handle customer service
- **Admins**: Full system access, user management, analytics

### Key Constraints
- **Multi-tenancy**: Support for multiple warehouses with real-time inventory synchronization
- **Data Integrity**: ACID compliance for order processing and inventory deduction
- **Performance**: Sub-200ms API response times with Redis caching
- **Security**: JWT-based authentication with refresh token rotation and RBAC/ABAC authorization

---

## Tech Stack & Rationale

### Backend: NestJS + Prisma + PostgreSQL

**Why NestJS?**
- **Dependency Injection**: Built-in DI container enables testable, modular architecture
- **Decorator-based Guards**: Simplifies implementing complex authorization logic (RBAC/ABAC)
- **TypeScript-first**: End-to-end type safety from database to API responses
- **Trade-off**: Steeper learning curve vs Express, but worth it for maintainability at scale

**Why Prisma ORM?**
- **Type-safe queries**: Auto-generated client prevents runtime SQL errors
- **Migration system**: Version-controlled schema changes with rollback support
- **Performance**: Connection pooling and query optimization out-of-the-box
- **Trade-off**: Less flexible than raw SQL for complex queries, but 95% of use cases covered

**Why PostgreSQL?**
- **JSONB support**: Stores multilingual product data (name, description) without additional tables
- **Transactions**: Critical for order processing (inventory deduction + order creation must be atomic)
- **Indexing**: B-tree indexes on `slug`, `sku`, `email` for fast lookups
- **Trade-off**: More complex setup than MongoDB, but relational integrity is non-negotiable for e-commerce

### Frontend: React + Vite + TailwindCSS

**Back-office (Admin Panel):**
- **Ant Design**: Rich component library for complex data tables and forms
- **TanStack Query**: Server state management with automatic cache invalidation
- **Zustand**: Lightweight client state (auth, UI preferences)

**Storefront (Customer-facing):**
- **shadcn/ui**: Customizable, accessible components built on Radix UI
- **Framer Motion**: Smooth animations for product galleries and transitions
- **React Hook Form + Zod**: Type-safe form validation with minimal re-renders

**Why separate frontends?**
- **Separation of concerns**: Admin UI has different UX requirements than customer-facing storefront
- **Independent deployment**: Can update back-office without affecting customer experience
- **Trade-off**: Code duplication for shared components (mitigated by `shared` package)

### Caching & Background Jobs: Redis + Bull

**Redis:**
- **Use cases**: User permissions cache, session storage, rate limiting
- **TTL strategy**: 60s for permissions (balance between freshness and DB load)
- **Trade-off**: Adds infrastructure complexity, but 10x reduction in DB queries for auth

**Bull (Redis-based queue):**
- **Use cases**: Email sending (verification, password reset), inventory sync
- **Why not inline**: Prevents blocking API responses; retries on failure
- **Trade-off**: Eventual consistency for non-critical operations

### Storage: Supabase

**Why Supabase?**
- **S3-compatible**: Easy migration path if needed
- **CDN integration**: Automatic image optimization and global distribution
- **Access control**: Row-level security for user-uploaded content
- **Trade-off**: Vendor lock-in, but free tier is generous and API is standard

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │   Storefront     │              │   Back-office    │        │
│  │  (React + Vite)  │              │  (React + Vite)  │        │
│  └────────┬─────────┘              └────────┬─────────┘        │
└───────────┼────────────────────────────────┼──────────────────┘
            │                                │
            └────────────┬───────────────────┘
                         │ HTTP/REST
            ┌────────────▼────────────────────────────────────────┐
            │              API Gateway Layer                      │
            │  ┌──────────────────────────────────────────────┐  │
            │  │  NestJS Application (Port 4000)              │  │
            │  │  - Global Guards (JWT, RBAC)                 │  │
            │  │  - Global Interceptors (Response formatting) │  │
            │  │  - Global Filters (Error handling)           │  │
            │  └──────────────────────────────────────────────┘  │
            └─────────────────────┬───────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ PostgreSQL DB │      │  Redis Cache     │      │  Supabase       │
│ (Prisma ORM)  │      │  - Permissions   │      │  (File Storage) │
│               │      │  - Sessions      │      │                 │
└───────────────┘      └──────────────────┘      └─────────────────┘
```

### Module Breakdown

**Core Modules:**
1. **Auth Module**: JWT-based authentication, refresh token rotation, password reset
2. **RBAC Module**: Role-based access control with permission caching
3. **User Module**: User CRUD, profile management
4. **Product Module**: Multi-variant products, media management, slug generation
5. **Category Module**: Hierarchical categories with path materialization
6. **Attribute Module**: Dynamic product attributes (size, color, material)
7. **Cart Module**: Session-based (guest) and user-based carts
8. **Order Module**: Order creation with atomic inventory deduction
9. **Storage Module**: Supabase integration for file uploads

**Data Flow Example (Order Creation):**
```
1. Client → POST /api/orders (with JWT)
2. JwtAccessGuard → Validates token, extracts userId
3. OrderController → Calls OrderService.createOrder()
4. OrderService → BEGIN TRANSACTION
   a. Fetch cart items + product variants
   b. Validate stock availability
   c. Calculate totals (subtotal + shipping - discount)
   d. Create order record
   e. Deduct inventory (InventoryLog for audit trail)
   f. Clear cart
5. COMMIT TRANSACTION
6. Return order confirmation
```

---

## Core Features

### 1. Multi-Variant Product System
- **Problem**: Jewelry products have multiple attributes (size, metal, gemstone)
- **Solution**: `ProductVariant` table with many-to-many `VariantAttributeValue` relation
- **Logic**: 
  - Each variant has unique SKU (auto-generated: `{slug}-{attributes}-{seq}`)
  - Price ranges calculated dynamically (`displayPriceMin`, `displayPriceMax`)
  - Media can be shared across product or specific to variant

### 2. Inventory Management
- **Problem**: Prevent overselling across multiple warehouses
- **Solution**: 
  - `InventoryItem` tracks `quantity` and `reservedQuantity` per warehouse
  - `InventoryLog` provides audit trail (who, when, why stock changed)
  - Atomic updates using Prisma transactions
- **Logic**:
  ```typescript
  // Simplified inventory deduction
  await tx.inventoryItem.update({
    where: { id: inventoryId },
    data: {
      quantity: { decrement: orderQuantity },
      logs: {
        create: {
          actionType: 'SALE',
          quantityChange: -orderQuantity,
          stockAfter: currentStock - orderQuantity,
          referenceId: orderId
        }
      }
    }
  });
  ```

### 3. RBAC + ABAC Authorization
- **RBAC (Role-Based)**: Users assigned roles (e.g., `admin`, `warehouse-manager`)
- **ABAC (Attribute-Based)**: Permissions can be granted directly to users
- **Implementation**:
  - `@RequirePermissions('product:update')` decorator on controller methods
  - `PermissionGuard` checks user's roles + direct permissions
  - Redis cache (60s TTL) to avoid DB hit on every request
- **Example**:
  ```typescript
  // User has 'admin' role → inherits all 'admin' permissions
  // OR user has direct 'product:update' permission
  @RequirePermissions('product:update')
  @Patch(':id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.updateProduct(id, dto);
  }
  ```

### 4. Multilingual Support
- **Problem**: Product names/descriptions in multiple languages
- **Solution**: Store as JSONB: `{ "en": "Gold Ring", "vi": "Nhẫn Vàng" }`
- **Trade-off**: Harder to query by language, but flexible for adding new languages

---

## Database Design

### Schema Highlights

**Users & Auth:**
- `User` → `UserRole` → `Role` → `RolePermission` → `Permission` (many-to-many)
- `User` → `UserPermission` → `Permission` (direct permissions)
- `RefreshToken`, `VerifyEmailToken`, `ResetPasswordToken` (one-time use tokens)

**Products:**
- `Product` (1) → (N) `ProductVariant` → (N) `VariantAttributeValue` → (1) `AttributeValue`
- `Product` (N) ↔ (N) `Category` (via `ProductCategory` junction table)
- `Product` (1) → (N) `ProductMedia` (shared media)
- `ProductVariant` (N) ↔ (N) `ProductMedia` (variant-specific media)

**Orders:**
- `Order` (1) → (N) `OrderItem` (denormalized product data for historical accuracy)
- `Order` (1) → (N) `PaymentTransaction` (supports partial payments/refunds)
- `Order` (1) → (N) `OrderTimeline` (audit trail of status changes)

**Inventory:**
- `ProductVariant` (1) → (N) `InventoryItem` (one per warehouse)
- `InventoryItem` (1) → (N) `InventoryLog` (audit trail)

### Indexing Strategy

**Performance-critical indexes:**
- `User.email` (unique, B-tree): Login queries
- `Product.slug` (unique, B-tree): SEO-friendly URLs
- `ProductVariant.sku` (unique, B-tree): Inventory lookups
- `ProductVariant.price` (B-tree): Price range filtering
- `Order.code` (unique, B-tree): Order tracking
- `InventoryLog.productVariantId, createdAt` (composite): Audit queries

**Why these indexes?**
- Most queries filter by these fields
- B-tree supports `=`, `<`, `>`, `LIKE` operations
- Composite index on `(productVariantId, createdAt)` for time-series queries

---

## API Design

### REST Conventions

**Naming:**
- Resources: Plural nouns (`/products`, `/orders`)
- Actions: HTTP verbs (GET, POST, PATCH, DELETE)
- Nested resources: `/products/:id/variants`

**Response Format (Standardized):**
```typescript
{
  "success": true,
  "statusCode": 200,
  "message": "Product created successfully",
  "data": { /* actual payload */ },
  "meta": { /* pagination, timestamps */ }
}
```

**Error Format:**
```typescript
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### Example Endpoints

**Authentication:**
```
POST   /api/auth/register          # Create account
POST   /api/auth/login             # Get access + refresh tokens
POST   /api/auth/refresh           # Refresh access token
POST   /api/auth/logout            # Revoke refresh token
POST   /api/auth/forgot-password   # Send reset email
POST   /api/auth/reset-password    # Reset with token
```

**Products (with RBAC):**
```
GET    /api/products               # Public: List products (paginated)
GET    /api/products/:slug         # Public: Get product details
POST   /api/products               # Requires: product:create
PATCH  /api/products/:id           # Requires: product:update
DELETE /api/products/:id           # Requires: product:delete
```

---

## State Management & Business Logic

### Backend State Management

**Separation of Concerns:**
- **Controllers**: HTTP layer, validation, response formatting
- **Services**: Business logic, transaction orchestration
- **Repositories**: Data access (abstracted via Prisma)

**Example (Order Creation):**
```typescript
// Controller: Thin layer
@Post()
async createOrder(@User() user, @Body() dto: CreateOrderDto) {
  return this.orderService.createOrder(user.id, dto);
}

// Service: Business logic
async createOrder(userId: string, dto: CreateOrderDto) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Validate cart
    // 2. Check inventory
    // 3. Calculate totals
    // 4. Create order
    // 5. Deduct inventory
    // 6. Clear cart
  });
}
```

### Validation Strategy

**DTO Validation (class-validator):**
```typescript
export class CreateProductDto {
  @IsNotEmpty()
  @IsObject()
  name: Record<string, string>; // { en: "...", vi: "..." }

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}
```

**Business Validation:**
- Unique constraints: Checked in service layer (e.g., SKU uniqueness)
- Relational integrity: Foreign key constraints in database
- Stock availability: Checked before order creation

### Error Handling

**Global Exception Filter:**
- Catches all exceptions
- Formats as standardized error response
- Logs errors with context (user, endpoint, timestamp)

**Custom Exceptions:**
- `NotFoundException`: 404 for missing resources
- `ForbiddenException`: 403 for permission denied
- `ConflictException`: 409 for duplicate resources

---

## Security Considerations

### Authentication & Authorization

**JWT Strategy:**
- **Access Token**: Short-lived (15min), stored in memory (frontend)
- **Refresh Token**: Long-lived (7d), stored in httpOnly cookie
- **Rotation**: New refresh token issued on each refresh (prevents replay attacks)

**Password Security:**
- **Hashing**: Argon2id (winner of Password Hashing Competition)
- **Parameters**: `timeCost: 2, memoryCost: 19456, parallelism: 1`
- **Why Argon2 over bcrypt?**: Resistant to GPU/ASIC attacks

**RBAC/ABAC:**
- **Principle of Least Privilege**: Users only get necessary permissions
- **Permission Caching**: Redis cache invalidated on role/permission changes
- **Audit Trail**: `AuditLog` table tracks all sensitive operations

### Common Vulnerabilities Handled

**SQL Injection:**
- **Mitigation**: Prisma uses parameterized queries (no raw SQL)

**XSS (Cross-Site Scripting):**
- **Mitigation**: React escapes output by default; CSP headers in production

**CSRF (Cross-Site Request Forgery):**
- **Mitigation**: SameSite cookies + CORS whitelist

**Mass Assignment:**
- **Mitigation**: DTOs with `whitelist: true` (strips unknown fields)

**Rate Limiting:**
- **Planned**: Redis-based rate limiter (100 req/min per IP)

### Secrets Management

**Environment Variables:**
- `.env` file (gitignored) for local development
- Secrets stored in:
  - **Development**: `.env` file
  - **Production**: Environment variables (Docker, Vercel, etc.)

**Sensitive Data:**
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: 256-bit random strings
- `DATABASE_URL`: Connection string with credentials
- `SUPABASE_SERVICE_ROLE_KEY`: Admin access to storage

---

## Performance & Scalability

### Current Bottlenecks

**Database Queries:**
- **Problem**: N+1 queries for product variants + attributes
- **Solution**: Prisma's `include` for eager loading
- **Monitoring**: Prisma query logs in development

**Permission Checks:**
- **Problem**: DB query on every request
- **Solution**: Redis cache (60s TTL)
- **Trade-off**: 60s delay for permission changes to take effect

### Optimization Techniques

**Database:**
- **Indexes**: On frequently queried fields (see Database Design section)
- **Connection Pooling**: Prisma manages pool (default: 10 connections)
- **Pagination**: Cursor-based for large datasets (more efficient than offset)

**Caching:**
- **Redis**: User permissions, product listings (planned)
- **CDN**: Static assets (images, CSS, JS) via Supabase

**API:**
- **Response Compression**: gzip enabled in production
- **Lazy Loading**: Product images loaded on scroll (frontend)

### Scalability Plan

**Horizontal Scaling:**
- **Stateless API**: No in-memory sessions (all in Redis/DB)
- **Load Balancer**: Nginx/AWS ALB to distribute traffic
- **Database**: Read replicas for analytics queries

**Vertical Scaling:**
- **Database**: Upgrade to larger instance (more RAM for caching)
- **Redis**: Cluster mode for high availability

**Microservices (Future):**
- **Candidates**: Inventory service, email service
- **Why not now?**: Premature optimization; monolith is easier to debug

---

## Testing Strategy

### What is Tested

**Unit Tests (Planned):**
- **Services**: Business logic (e.g., order total calculation)
- **Guards**: Permission checking logic
- **Utilities**: Slug generation, price formatting

**Integration Tests (Planned):**
- **API Endpoints**: Full request/response cycle
- **Database**: Transactions, rollbacks

**E2E Tests (Manual):**
- **User Flows**: Register → Login → Add to cart → Checkout
- **Admin Flows**: Create product → Upload images → Publish

### What is NOT Tested (and Why)

**Third-party Services:**
- **Supabase, SendGrid**: Mocked in tests (external dependencies)

**UI Components:**
- **Reason**: Focus on backend correctness; UI tested manually

**Performance Tests:**
- **Reason**: Requires production-like environment (planned for staging)

### Testing Tools

- **Jest**: Test runner (built into NestJS)
- **Supertest**: HTTP assertions for integration tests
- **Prisma Test Environment**: In-memory SQLite for fast tests

---

## Setup & Run Locally

### Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **PostgreSQL**: v14+ (or Docker container)
- **Redis**: v6+ (or Docker container)
- **npm/pnpm**: Package manager

### Step-by-Step Setup

**1. Clone Repository**
```bash
git clone <repository-url>
cd Web\ -\ E\ Commerce
```

**2. Install Dependencies**
```bash
# Install root dependencies (if using workspaces)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../back-office
npm install

cd ../ray-paradis-landingpage
npm install
```

**3. Database Setup**
```bash
# Start PostgreSQL (Docker example)
docker run --name ecommerce-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=ecommerce \
  -p 5432:5432 -d postgres:14

# Start Redis
docker run --name ecommerce-redis \
  -p 6379:6379 -d redis:6
```

**4. Environment Variables**

Create `backend/.env`:
```bash
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/ecommerce"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET="your-access-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="redis_secure_pass_123"
REDIS_TTL=60000

# Email (choose one)
MAIL_PROVIDER="gmail"  # or "sendgrid"

# Gmail OAuth (if using Gmail)
GMAIL_CLIENT_ID="your-client-id"
GMAIL_CLIENT_SECRET="your-client-secret"
GMAIL_REFRESH_TOKEN="your-refresh-token"
GMAIL_USER="your-email@gmail.com"

# SendGrid (if using SendGrid)
SENDGRID_API_KEY="your-sendgrid-key"
MAIL_FROM="noreply@yourdomain.com"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_BUCKET="product-images"

# App
PORT=4000
CORS_ORIGIN="http://localhost:5173"
COMPANY_NAME="Ray Paradis"
```

**5. Database Migration**
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (creates default roles/permissions)
npm run start:dev  # Seeds run on module init
```

**6. Start Development Servers**

**Backend:**
```bash
cd backend
npm run start:dev  # Runs on http://localhost:4000
```

**Back-office (Admin Panel):**
```bash
cd back-office
npm run dev  # Runs on http://localhost:5173
```

**Storefront:**
```bash
cd ray-paradis-landingpage
npm run dev  # Runs on http://localhost:5174 (or next available port)
```

**7. Access Application**

- **API Docs (Swagger)**: http://localhost:4000/api/docs
- **Back-office**: http://localhost:5173
- **Storefront**: http://localhost:5174

### Environment Variables Explained

**Critical Variables:**
- `DATABASE_URL`: PostgreSQL connection string (must be valid)
- `JWT_ACCESS_SECRET`: Used to sign access tokens (keep secret!)
- `JWT_REFRESH_SECRET`: Used to sign refresh tokens (different from access!)
- `SUPABASE_SERVICE_ROLE_KEY`: Admin access to storage (bypasses RLS)

**Optional Variables:**
- `REDIS_PASSWORD`: Set if Redis requires auth
- `MAIL_PROVIDER`: Choose `gmail` or `sendgrid` based on your setup
- `CORS_ORIGIN`: Whitelist frontend URLs (comma-separated for multiple)

---

## Engineering Trade-offs & Future Improvements

### Conscious Trade-offs

**1. Monorepo vs Polyrepo**
- **Choice**: Monorepo (backend, back-office, storefront in one repo)
- **Why**: Easier to share types, faster iteration
- **Trade-off**: Larger repo size, potential merge conflicts
- **Future**: Consider splitting if team grows beyond 10 developers

**2. REST vs GraphQL**
- **Choice**: REST
- **Why**: Simpler to implement, better caching (HTTP), Swagger docs
- **Trade-off**: Over-fetching data (e.g., fetching full product when only name needed)
- **Future**: Add GraphQL layer for mobile app (more flexible queries)

**3. Soft Delete vs Hard Delete**
- **Choice**: Soft delete (set `deletedAt` timestamp)
- **Why**: Audit trail, data recovery
- **Trade-off**: Complicates queries (must filter `deletedAt IS NULL`)
- **Future**: Archive old soft-deleted records to separate table

**4. Session-based vs Token-based Auth**
- **Choice**: Token-based (JWT)
- **Why**: Stateless, easier to scale horizontally
- **Trade-off**: Cannot revoke access tokens (must wait for expiry)
- **Mitigation**: Short access token TTL (15min)

### Future Improvements

**High Priority:**
1. **Rate Limiting**: Prevent brute-force attacks on login endpoint
2. **Email Queue**: Move email sending to background job (Bull)
3. **Image Optimization**: Compress/resize images on upload (Sharp library)
4. **Search**: Full-text search with PostgreSQL `tsvector` or Elasticsearch
5. **Analytics**: Track product views, cart abandonment (Mixpanel/Amplitude)

**Medium Priority:**
6. **Webhooks**: Notify external systems on order creation (e.g., shipping provider)
7. **Discount System**: Implement discount codes (already have schema)
8. **Review System**: Allow customers to review products (already have schema)
9. **Inventory Alerts**: Email when stock falls below threshold
10. **Multi-currency**: Support USD, EUR, VND (currently hardcoded VND)

**Low Priority (Nice-to-have):**
11. **GraphQL API**: For mobile app
12. **Real-time Notifications**: WebSockets for order status updates
13. **A/B Testing**: Feature flags for experimenting with UI changes
14. **Internationalization**: Full i18n support (currently partial)
15. **Dark Mode**: For back-office (already in storefront)

### Known Limitations

**1. No Distributed Transactions**
- **Problem**: If inventory service is split into microservice, can't use Prisma transactions
- **Solution**: Implement Saga pattern or use distributed transaction coordinator

**2. Single Database**
- **Problem**: All data in one PostgreSQL instance (single point of failure)
- **Solution**: Set up read replicas, automated backups

**3. No CDN for API**
- **Problem**: API responses not cached globally
- **Solution**: Add Cloudflare/AWS CloudFront for static API responses (product listings)

**4. Manual Deployment**
- **Problem**: No CI/CD pipeline
- **Solution**: Set up GitHub Actions for automated testing + deployment

---

## Project Structure

```
Web - E Commerce/
├── backend/                    # NestJS API server
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/          # Authentication & JWT
│   │   │   ├── rbac/          # Role-based access control
│   │   │   ├── product/       # Product management
│   │   │   ├── order/         # Order processing
│   │   │   ├── cart/          # Shopping cart
│   │   │   └── ...
│   │   ├── common/            # Shared utilities
│   │   │   ├── decorators/    # Custom decorators
│   │   │   ├── guards/        # Auth guards
│   │   │   ├── filters/       # Exception filters
│   │   │   └── interceptors/  # Response interceptors
│   │   └── main.ts            # Application entry point
│   └── package.json
│
├── back-office/               # Admin panel (React + Ant Design)
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API client
│   │   └── store/             # Zustand state
│   └── package.json
│
├── ray-paradis-landingpage/  # Customer storefront (React + shadcn/ui)
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   └── lib/               # Utilities
│   └── package.json
│
├── shared/                    # Shared types/utilities (TypeScript)
│   ├── src/
│   │   ├── types/             # Shared TypeScript types
│   │   └── utils/             # Shared utilities
│   └── package.json
│
└── README.md                  # This file
```

---

## Contributing

This is a portfolio project, but feedback is welcome! If you're reviewing this for an interview:

**Questions to ask me:**
1. How would you handle inventory synchronization across multiple warehouses in real-time?
2. What's your strategy for handling payment gateway integration (Stripe, PayPal)?
3. How would you optimize the product search for 1M+ products?
4. What metrics would you track to measure system health?

**Areas I'd love to discuss:**
- Database indexing strategies for complex queries
- Caching invalidation strategies (Redis vs in-memory)
- Microservices vs monolith trade-offs
- Event-driven architecture for order processing

---

## License

This project is for portfolio/educational purposes. Not licensed for commercial use.

---

## Contact

**Developer**: [Lê Phước Thắng]  
**Email**: [lephuocthang207@gmail.com]  


---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Status**: Active Development
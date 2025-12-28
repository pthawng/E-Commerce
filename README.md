# Ray Paradis E-commerce System

## Project Overview

Ray Paradis is a full-stack e-commerce platform built as a capstone project for jewelry retail. The system provides a comprehensive solution for managing jewelry products with complex variant combinations (size, material, gemstones), multi-warehouse inventory, and administrative operations through a dedicated back-office interface.

The platform addresses the challenge of managing jewelry e-commerce where products often have multiple variants with different attributes (metal type, stone quality, sizing) while maintaining accurate inventory across multiple warehouses.

**Scope and Limitations:**
- Focuses on B2B/admin operations rather than customer-facing storefront
- Supports jewelry-specific product attributes and categorization
- Multi-warehouse inventory management without real-time synchronization
- Vietnamese market focus with VND currency and local shipping methods

**Target Users:** Administrative staff and managers for jewelry retail operations.

## Key Features

- **Product Management**: Hierarchical categories, complex product variants with multiple attributes (size, material, gemstone quality), media gallery management
- **Inventory Control**: Multi-warehouse support with stock tracking, reservation system, and comprehensive audit logging
- **Order Processing**: Full order lifecycle management with payment tracking and shipping integration
- **User Management**: Role-based access control (RBAC) and attribute-based access control (ABAC) for fine-grained permissions
- **Content Management**: Blog posts and static pages for marketing content
- **Review System**: Customer product reviews with moderation capabilities
- **Discount Management**: Flexible discount codes with usage limits and validation rules
- **Customer Landing Page**: Marketing website with animated product showcases and jewelry collections
- **Shared Type System**: Type-safe interfaces and utilities shared across backend and frontend applications

## System Architecture

The system follows a modular monorepo architecture with clear separation between backend API, administrative frontend, customer-facing landing page, and shared utilities:

**Backend (NestJS):**
- **Controller Layer**: REST API endpoints with request validation and response formatting
- **Service Layer**: Business logic implementation with dependency injection
- **Repository Layer**: Data access abstraction using Prisma ORM
- **Module Organization**: Feature-based modules (auth, product, order, etc.) with shared common utilities

**Back-office Frontend (React + TypeScript):**
- **Feature-Sliced Design**: Organized by business features with dedicated components, hooks, and services
- **State Management**: Zustand for global state, React Query for server state and caching
- **UI Framework**: Ant Design components with custom styling via Tailwind CSS

**Customer Landing Page (React + TypeScript):**
- **Modern Marketing Site**: Showcases jewelry collections with animated sections and product galleries
- **UI Framework**: shadcn/ui components with Tailwind CSS and Framer Motion animations
- **Responsive Design**: Mobile-first approach with interactive elements

**Shared Package:**
- **Type Safety**: Common TypeScript types, enums, and interfaces across all applications
- **Configuration**: Centralized app and API configuration management
- **Utilities**: Shared helper functions and constants for consistent behavior

**Communication:**
- RESTful API with JSON payloads
- File uploads handled via multipart/form-data
- JWT-based authentication with refresh token rotation
- Database transactions ensure data consistency for complex operations (product creation with variants)

## Database Design

The system uses PostgreSQL with Prisma ORM, featuring a normalized schema optimized for e-commerce operations:

**Core Entities:**
- **Products & Variants**: Flexible product model supporting complex attribute combinations (metal type, stone quality, sizing)
- **Categories**: Hierarchical category structure with path enumeration for efficient querying
- **Inventory**: Multi-warehouse stock management with audit logging for all inventory changes
- **Orders & Payments**: Comprehensive order lifecycle with payment transaction tracking
- **Users & Permissions**: Flexible RBAC/ABAC system supporting different user types (customers, staff, admins)

**Key Design Decisions:**
- UUID primary keys for global uniqueness and security
- JSON fields for multi-language content support (Vietnamese/English)
- Proper indexing on frequently queried fields (product slugs, variant SKUs, inventory lookups)
- Foreign key constraints with cascade/delete rules appropriate for e-commerce data integrity
- Decimal types for monetary values to avoid floating-point precision issues

## Authentication & Security

**Authentication Flow:**
- JWT-based authentication with access/refresh token pair
- Password hashing using Argon2 for security
- Email verification for account activation
- Password reset via secure tokens

**Authorization:**
- **RBAC**: Role-based permissions with predefined roles (Customer, Staff, Super Admin)
- **ABAC**: Attribute-based policies for resource-level access control
- Permission system with granular actions (create, read, update, delete) per module
- API guards enforce authorization at both route and method levels

**Security Considerations:**
- Input validation using class-validator decorators
- SQL injection prevention through parameterized queries
- Rate limiting and CORS configuration
- Audit logging for sensitive operations
- Secure token storage and rotation

## API Design

**RESTful Principles:**
- Resource-based URL structure (`/api/products`, `/api/orders/{id}`)
- HTTP methods following REST conventions (GET, POST, PUT, DELETE)
- Consistent response format with error handling
- Pagination support for list endpoints using cursor-based approach

**Request/Response Handling:**
- Request validation using DTOs with class-validator
- Response transformation with class-transformer
- Error handling with custom exception filters
- API documentation via Swagger/OpenAPI

**Versioning & Compatibility:**
- URL-based versioning (`/api/v1/`) for future compatibility
- Backward-compatible changes through optional fields
- Deprecation notices for planned API changes

## Installation & Running Locally

**Prerequisites:**
- Node.js 18+ and npm
- PostgreSQL 15+
- Redis (optional, for caching and queues)
- Git

**Setup Steps:**

1. **Clone and Install Dependencies:**
```bash
git clone <repository-url>
cd ray-paradis-ecommerce

# Install shared package first (if not using workspaces)
cd shared
npm install
npm run build

# Install backend dependencies
cd ../backend
npm install

# Install admin frontend dependencies
cd ../back-office
npm install

# Install landing page dependencies
cd ../ray-paradis-landingpage
npm install
```

2. **Database Setup:**
```bash
# Configure PostgreSQL connection in backend/.env
DATABASE_URL="postgresql://username:password@localhost:5432/ray_paradis_db"

# Run database migrations
cd backend
npx prisma migrate dev --name init

# Seed initial data (optional)
npx prisma db seed
```

3. **Environment Configuration:**

Create `backend/.env`:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_EXPIRES_IN="7d"
PORT=4000

# Email service (optional)
SENDGRID_API_KEY="your-sendgrid-key"

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

Create `back-office/.env`:
```env
VITE_API_BASE_URL="http://localhost:4000/api"
```

4. **Start Development Servers:**
```bash
# Backend (Terminal 1)
cd backend
npm run start:dev

# Admin frontend (Terminal 2)
cd back-office
npm run dev

# Customer landing page (Terminal 3 - optional)
cd ray-paradis-landingpage
npm run dev
```

5. **Access the Applications:**
- Back-office Admin: http://localhost:5173
- Customer Landing Page: http://localhost:8080 
- API Documentation: http://localhost:4000/api/docs

## Project Structure

```
├── backend/                    # NestJS API server
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/         # Authentication & authorization
│   │   │   ├── product/      # Product management
│   │   │   ├── order/        # Order processing
│   │   │   ├── user/         # User management
│   │   │   └── ...
│   │   ├── common/           # Shared utilities, decorators, guards
│   │   ├── config/           # Configuration management
│   │   └── main.ts          # Application entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Database migrations
│   └── package.json
├── back-office/              # React admin interface
│   ├── src/
│   │   ├── app/            # Routing and layouts
│   │   ├── features/       # Feature modules (auth, product, etc.)
│   │   ├── components/     # Reusable UI components
│   │   ├── services/       # API client services
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configurations
│   └── package.json
├── ray-paradis-landingpage/  # Customer-facing marketing site
│   ├── src/
│   │   ├── components/      # UI components and sections
│   │   │   ├── sections/   # Landing page sections (Hero, Collection, etc.)
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   └── effects/   # Animation components
│   │   ├── features/       # Feature modules (auth, etc.)
│   │   └── pages/          # Page components
│   └── package.json
├── shared/                  # Shared TypeScript package
│   ├── src/
│   │   ├── types/         # Common TypeScript interfaces
│   │   ├── enums/         # Shared enumerations
│   │   ├── constants/     # Application constants
│   │   ├── config/        # Configuration objects
│   │   └── utils/         # Utility functions
│   └── package.json
├── database/               # Database configuration
└── README.md
```

The structure follows domain-driven design principles with clear boundaries between features and shared concerns, enabling type safety and code reusability across all applications.

## What I Learned

**Backend Architecture:**
- Implementing clean architecture with proper separation of concerns in NestJS
- Database design considerations for complex e-commerce relationships
- Authentication/authorization patterns with JWT and role-based permissions
- API design principles and RESTful conventions
- Transaction management for data consistency in complex operations

**System Design:**
- Understanding e-commerce domain requirements and business logic
- Designing scalable database schemas with proper indexing and constraints
- Implementing audit logging and data integrity patterns
- Working with file uploads and media management in web applications

**Development Practices:**
- TypeScript benefits for large-scale applications
- Testing strategies for backend services
- Code organization and maintainability in monorepos
- Environment configuration and deployment considerations

## Copyright

© 20255 Ray Paradis E-commerce System. All rights reserved.

This project is developed as a capstone project for educational purposes. All code, documentation, and associated materials are the intellectual property of the author.

Permission is granted to view and study this codebase for educational purposes only. Commercial use, reproduction, or distribution without explicit written permission is prohibited.

Contact for more: https://www.facebook.com/phuocthang.le.04/
# Levin's Bend Intranet - Project Specification

## Project Overview

A multi-tenant intranet platform for condominium associations, starting with Levin's Bend as the first client. The platform enables organization administrators to communicate with residents through announcements, file sharing, calendar events, and maintenance request management.

**Design Theme:** Clean, neutral with coastal influences (soft blues, sandy tans, white space, subtle wave or nautical accents)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Database | Vercel Postgres (PostgreSQL) |
| ORM | Prisma |
| Authentication | NextAuth.js (Auth.js) with Credentials Provider |
| File Storage | Vercel Blob |
| Email | Native mailto: links (no backend email service needed) |
| Styling | Tailwind CSS |
| Deployment | Vercel (production-ready from day one) |

---

## User Roles & Permissions

### Role Hierarchy

| Role | Description | Permissions |
|------|-------------|-------------|
| **System Admin** | Next Level Studio staff | Full access: manage all organizations, users, system settings |
| **Org Admin** | Condo association board members/managers | Post announcements, upload files, create events, receive maintenance requests, manage org members |
| **Member** | Residents | View announcements/files/events, submit maintenance requests, send private replies to admins |

### Permission Matrix

| Action | System Admin | Org Admin | Member |
|--------|--------------|-----------|--------|
| Create organizations | ✅ | ❌ | ❌ |
| Manage all orgs | ✅ | ❌ | ❌ |
| Post announcements | ✅ | ✅ (own org) | ❌ |
| Upload files | ✅ | ✅ (own org) | ❌ |
| Create calendar events | ✅ | ✅ (own org) | ❌ |
| View announcements | ✅ | ✅ (own org) | ✅ (own org) |
| Download files | ✅ | ✅ (own org) | ✅ (own org) |
| View calendar | ✅ | ✅ (own org) | ✅ (own org) |
| Submit maintenance request | ✅ | ✅ | ✅ |
| Reply to announcement (email) | ✅ | ✅ | ✅ |
| Manage org members | ✅ | ✅ (own org) | ❌ |

---

## Database Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}

// ============================================
// ORGANIZATIONS
// ============================================

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique // URL-friendly identifier
  logoUrl     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  users                UserOrganization[]
  announcements        Announcement[]
  files                File[]
  events               Event[]
  maintenanceRequests  MaintenanceRequest[]
}

// ============================================
// USERS & AUTHENTICATION
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  avatarUrl     String?
  
  // System-level role (only for system admins)
  isSystemAdmin Boolean   @default(false)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  organizations        UserOrganization[]
  announcements        Announcement[]
  files                File[]
  events               Event[]
  maintenanceRequests  MaintenanceRequest[]
}

model UserOrganization {
  id             String       @id @default(cuid())
  userId         String
  organizationId String
  role           OrgRole      @default(MEMBER)
  joinedAt       DateTime     @default(now())

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
}

enum OrgRole {
  ORG_ADMIN
  MEMBER
}

// ============================================
// ANNOUNCEMENTS (Feed Posts)
// ============================================

model Announcement {
  id             String       @id @default(cuid())
  title          String
  content        String       @db.Text
  isPinned       Boolean      @default(false)
  
  authorId       String
  organizationId String
  
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  author       User         @relation(fields: [authorId], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

// ============================================
// FILES
// ============================================

model File {
  id             String       @id @default(cuid())
  name           String       // Display name
  fileName       String       // Original filename
  fileUrl        String       // Vercel Blob URL
  fileSize       Int          // Size in bytes
  mimeType       String       // Should be application/pdf
  category       String?      // Optional categorization
  
  uploadedById   String
  organizationId String
  
  createdAt      DateTime     @default(now())

  uploadedBy   User         @relation(fields: [uploadedById], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

// ============================================
// CALENDAR EVENTS
// ============================================

model Event {
  id             String       @id @default(cuid())
  title          String
  description    String?      @db.Text
  location       String?
  
  startDate      DateTime
  endDate        DateTime?
  isAllDay       Boolean      @default(false)
  
  createdById    String
  organizationId String
  
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  createdBy    User         @relation(fields: [createdById], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

// ============================================
// MAINTENANCE REQUESTS
// ============================================

model MaintenanceRequest {
  id             String              @id @default(cuid())
  title          String
  description    String              @db.Text
  unit           String?             // Apartment/unit number
  priority       MaintenancePriority @default(NORMAL)
  status         MaintenanceStatus   @default(OPEN)
  
  submittedById  String
  organizationId String
  
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt

  submittedBy  User         @relation(fields: [submittedById], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

enum MaintenancePriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum MaintenanceStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}
```

---

## Core Features

### 1. Authentication & Registration

**Registration Flow:**
- User visits `/register`
- Enters: email, password, first name, last name, phone (optional)
- Selects organization from dropdown (or enters invite code - future enhancement)
- Account created with `MEMBER` role
- Redirected to login

**Login Flow:**
- Email + password authentication
- Session-based auth via NextAuth.js
- Redirect to organization dashboard after login

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase, one lowercase, one number

### 2. Announcement Feed

**For Org Admins:**
- Create new announcement with title and rich text content
- Option to pin important announcements (pinned show at top)
- Edit/delete own announcements

**For All Users:**
- View chronological feed of announcements (pinned first, then by date)
- Each announcement shows: title, content, author name, timestamp
- "Reply" button on each announcement → opens email compose modal

**Reply Feature (Private Email via mailto:):**
- Clicking "Reply" opens the user's default email client via `mailto:` link
- Pre-populated fields:
  - To: Admin's contact email
  - Subject: `Re: [Announcement Title]`
  - Body: `Regarding your post "[Announcement Title]"...\n\n`
- No modal, no backend email service required
- User sends directly from their own email client
- No visible comment thread - this is private correspondence

```typescript
// Example mailto link generation
const mailtoLink = `mailto:${admin.contactEmail}?subject=${encodeURIComponent(`Re: ${announcement.title}`)}&body=${encodeURIComponent(`Regarding your post "${announcement.title}":\n\n`)}`;
```

### 3. File Library

**For Org Admins:**
- Upload PDFs only (enforced)
- Maximum file size: 8MB (enforced client and server side)
- Add display name and optional category
- Delete files

**For All Users:**
- Browse files in a list/grid view
- Filter by category (if categories exist)
- Download files
- Display: file name, upload date, uploaded by, file size

**File Upload Validation:**
```typescript
const ALLOWED_TYPES = ['application/pdf'];
const MAX_SIZE = 8 * 1024 * 1024; // 8MB
```

### 4. Calendar

**For Org Admins:**
- Create events with: title, description, location, start date/time, end date/time, all-day toggle
- Edit/delete events

**For All Users:**
- Month view calendar widget
- Click on date to see events for that day
- Event details: title, time, location, description

**Calendar Component:**
- Use a lightweight calendar library (react-big-calendar or build custom)
- Mobile-responsive

### 5. Maintenance Requests

**Submit Request (All Users):**
- Form fields: title, description, unit number (optional), priority (Low/Normal/High/Urgent)
- Submits to database
- Email notification sent to all Org Admins of that organization

**View Requests:**
- Members see only their own requests
- Org Admins see all requests for their organization
- Display: title, status badge, priority badge, submitted by, date
- Filter by status

**Status Management (Org Admins only):**
- Update status: Open → In Progress → Resolved → Closed

### 6. User Profile

**All Users Can Edit:**
- First name, last name
- Phone number
- Email (for contact purposes - displayed to admins on maintenance requests)
- Password change

**Org Admin Profile Includes:**
- Contact email (where reply-to-announcement emails are sent)
- This defaults to their login email but can be changed

---

## Page Structure

```
/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── layout.tsx          # Sidebar + header layout
│   ├── page.tsx            # Redirect to /feed or org selection
│   ├── feed/               # Announcement feed
│   ├── files/              # File library
│   ├── calendar/           # Calendar view
│   ├── maintenance/        # Maintenance requests
│   │   ├── page.tsx        # List view
│   │   └── new/            # Submit new request
│   ├── profile/            # User profile settings
│   └── admin/              # Org admin pages
│       ├── announcements/
│       │   └── new/
│       ├── files/
│       │   └── upload/
│       ├── events/
│       │   └── new/
│       └── members/        # Manage org members
├── (system-admin)/         # System admin only
│   ├── organizations/
│   └── users/
└── api/
    ├── auth/[...nextauth]/
    ├── announcements/
    ├── files/
    ├── events/
    ├── maintenance/
    ├── users/
    └── organizations/
```

---

## UI/UX Guidelines

### Design System

**Colors (Coastal Theme):**
```css
:root {
  /* Primary - Ocean Blue */
  --primary-50: #f0f9ff;
  --primary-100: #e0f2fe;
  --primary-500: #0ea5e9;
  --primary-600: #0284c7;
  --primary-700: #0369a1;
  
  /* Secondary - Sandy Tan */
  --secondary-50: #fefce8;
  --secondary-100: #fef9c3;
  --secondary-500: #eab308;
  
  /* Neutral - Driftwood Gray */
  --neutral-50: #f8fafc;
  --neutral-100: #f1f5f9;
  --neutral-200: #e2e8f0;
  --neutral-500: #64748b;
  --neutral-700: #334155;
  --neutral-900: #0f172a;
  
  /* Accent - Seafoam */
  --accent-500: #14b8a6;
  
  /* Status Colors */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
}
```

**Typography:**
- Headings: Inter or similar clean sans-serif
- Body: System font stack for performance
- Font sizes following Tailwind defaults

**Spacing:**
- Consistent use of Tailwind spacing scale
- Generous whitespace for clean feel

### Component Patterns

**Cards:**
- White background with subtle shadow
- Rounded corners (rounded-lg)
- Consistent padding (p-6)

**Buttons:**
- Primary: Ocean blue background, white text
- Secondary: White background, blue border
- Destructive: Red for delete actions

**Forms:**
- Clear labels above inputs
- Helpful placeholder text
- Inline validation messages
- Disabled states clearly visible

**Navigation:**
- Sidebar on desktop (collapsible)
- Bottom navigation on mobile
- Clear active state indicators

### Responsive Breakpoints

- Mobile: < 640px (single column, bottom nav)
- Tablet: 640px - 1024px (collapsible sidebar)
- Desktop: > 1024px (full sidebar)

---

## API Routes Structure

### Authentication
- `POST /api/auth/register` - New user registration
- NextAuth.js handles `/api/auth/*`

### Announcements
- `GET /api/announcements` - List announcements (paginated)
- `POST /api/announcements` - Create announcement (Org Admin+)
- `PUT /api/announcements/[id]` - Update announcement (author only)
- `DELETE /api/announcements/[id]` - Delete announcement (author only)

### Files
- `GET /api/files` - List files
- `POST /api/files/upload` - Upload file (Org Admin+)
- `DELETE /api/files/[id]` - Delete file (Org Admin+)

### Events
- `GET /api/events` - List events (with date range filter)
- `POST /api/events` - Create event (Org Admin+)
- `PUT /api/events/[id]` - Update event (Org Admin+)
- `DELETE /api/events/[id]` - Delete event (Org Admin+)

### Maintenance
- `GET /api/maintenance` - List requests (filtered by user role)
- `POST /api/maintenance` - Submit request
- `PUT /api/maintenance/[id]` - Update status (Org Admin+)

### Users & Organizations (System Admin)
- `GET /api/organizations` - List all orgs
- `POST /api/organizations` - Create org
- `GET /api/users` - List all users
- `PUT /api/users/[id]/role` - Update user role

---

## Environment Variables

```env
# Database (Vercel Postgres)
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=generate-a-secure-secret

# Vercel Blob (File Storage)
BLOB_READ_WRITE_TOKEN=
```

---

## Deployment Checklist

### Vercel Setup
1. Create new Vercel project from Git repo
2. Add Vercel Postgres database (Storage tab)
3. Add Vercel Blob storage (Storage tab)
4. Configure environment variables
5. Run Prisma migrations: `npx prisma migrate deploy`

### Initial Data Setup
1. Create first System Admin user via seed script
2. Create "Levin's Bend" organization
3. Promote initial users to Org Admin

### Seed Script Example
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create system admin
  const adminPassword = await bcrypt.hash('ChangeThis123!', 12);
  const systemAdmin = await prisma.user.create({
    data: {
      email: 'admin@nextlevelstudio.com',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      isSystemAdmin: true,
    },
  });

  // Create Levin's Bend organization
  const org = await prisma.organization.create({
    data: {
      name: "Levin's Bend Condominiums",
      slug: 'levins-bend',
    },
  });

  // Link system admin to org
  await prisma.userOrganization.create({
    data: {
      userId: systemAdmin.id,
      organizationId: org.id,
      role: 'ORG_ADMIN',
    },
  });

  console.log('Seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## Security Considerations

1. **Password Hashing:** Use bcrypt with cost factor 12
2. **Session Security:** HTTP-only cookies, secure flag in production
3. **API Authorization:** Check user role on every protected endpoint
4. **File Validation:** Server-side MIME type and size validation
5. **SQL Injection:** Prisma parameterized queries (built-in protection)
6. **XSS Prevention:** React's built-in escaping + sanitize user HTML if allowing rich text
7. **CSRF:** NextAuth.js handles CSRF tokens
8. **Rate Limiting:** Consider adding for auth endpoints (future enhancement)

---

## Future Enhancements (Out of Scope for MVP)

- [ ] Invite codes for registration
- [ ] Email verification
- [ ] Password reset flow
- [ ] Push notifications
- [ ] Event RSVP
- [ ] Maintenance request comments/updates thread
- [ ] File versioning
- [ ] Audit logging
- [ ] Two-factor authentication
- [ ] Multiple organizations per user
- [ ] Custom branding per organization

---

## Getting Started with Cursor

1. Create new Next.js project:
   ```bash
   npx create-next-app@latest levins-bend-intranet --typescript --tailwind --eslint --app --src-dir
   ```

2. Install dependencies:
   ```bash
   npm install @prisma/client next-auth @auth/prisma-adapter bcryptjs @vercel/blob
   npm install -D prisma @types/bcryptjs
   ```

3. Initialize Prisma:
   ```bash
   npx prisma init
   ```

4. Copy the schema from this document to `prisma/schema.prisma`

5. Set up Vercel project and add Postgres + Blob storage

6. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

7. Build features in this order:
   - Authentication (login/register)
   - Dashboard layout with navigation
   - Announcement feed (view → create)
   - File library (view → upload)
   - Calendar (view → create events)
   - Maintenance requests
   - User profile
   - Admin member management

---

## Notes for Cursor AI

- Follow Next.js 14 App Router conventions
- Use Server Components by default, Client Components only when needed (interactivity)
- Implement proper loading and error states
- Use Tailwind CSS for all styling
- Create reusable components in `/src/components`
- Keep API routes thin - business logic in `/src/lib`
- Type everything with TypeScript
- Follow the coastal color palette for all UI elements

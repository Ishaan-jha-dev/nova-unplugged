# Nova Unplugged Platform Documentation

## 🛡️ Administrative Architecture
The admin panel is designed for high reliability and security. 

### Data Access Layer
- **Admin Dashboard**: Utilizes the `SUPABASE_SERVICE_ROLE_KEY` via `createServerClient` to bypass RLS policies. This ensures that administrators have a consistent, real-time view of all KPIs (Users, Payments, Scans) without being blocked by user-level privacy rules.
- **Relationship Mapping**: To avoid "ambiguous relationship" errors in Supabase (caused by multiple foreign keys between tables), the platform uses manual mapping logic. It fetches user details separately and joins them in-memory on the server before rendering.

### Scanner System
- **Status Management**: Users transition from `approved` -> `scanned` upon entry.
- **Bulk Reset**: Admins can use the "Reset All Scans" feature to move all users back to `approved` status, useful for multi-day events or testing phases.
- **Audit Logs**: All scans are recorded in `scanner_log` via a secure API route (`/api/admin/scan`) to ensure reliable data capture.

## 🕒 Timezone Management
The entire platform is standardized to **Indian Standard Time (IST - Asia/Kolkata)**.

### implementation
- **Utility**: `src/lib/utils/dateUtils.ts`
- **Logic**: Every timestamp (created_at, start_time, etc.) is processed through `formatIST()`. 
- **Server-Side Rendering**: This prevents Vercel's UTC servers from displaying incorrect times to users in India.

## 🎨 User Experience
### Integrated Dashboard
- **Sidebar Navigation**: The student dashboard features a persistent sidebar.
- **Internal Routes**: Pages like "Timeline" and "About Us" are integrated as dashboard routes (`/dashboard/timeline`) to prevent the user from being redirected to the public website layout.
- **Shared Components**: The timeline is managed via a shared component (`TimelineView.tsx`) to ensure that schedule updates made by the admin reflect instantly for both public visitors and logged-in students.

## 🚀 Deployment & Maintenance
- **Vercel Builds**: Ensure all temporary test scripts (e.g., `scratch.ts`) are removed before pushing, as they may cause build failures due to missing environment variables or dependencies.
- **Service Role**: The `SUPABASE_SERVICE_ROLE_KEY` must be present in the production environment variables for the admin panel and export functions to work.

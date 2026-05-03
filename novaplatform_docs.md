# Nova Unplugged Platform Documentation

## 🛡️ Administrative Architecture
The admin panel is designed for high reliability and security. 

### Data Access Layer
- **Admin Dashboard**: Utilizes the `SUPABASE_SERVICE_ROLE_KEY` via `createServerClient` to bypass RLS policies. This ensures that administrators have a consistent, real-time view of all KPIs (Users, Payments, Scans).
- **Relationship Mapping**: To avoid "ambiguous relationship" errors in Supabase, the platform uses manual mapping logic or explicit joins in queries.
- **Registrations View**: Displays detailed event participation. Includes a **Leader Badge** to identify the primary contact for team-based events.

### Scanner System
- **Status Management**: Users transition from `approved` -> `scanned` upon entry.
- **Bulk Reset**: Admins can reset all scans, useful for multi-day events.
- **Audit Logs**: All scans are recorded in `scanner_log` via a secure API route (`/api/admin/scan`).

## 📁 Event & Category System
The platform uses a relational category system to allow dynamic event organization.

### Relational Schema
- **Categories Table**: Stores event categories (e.g., Cultural, Technical, Fun).
- **Event Linkage**: Events reference `category_id`. Frontend components (EventsClient, MyEventsClient) use joins to fetch category titles.
- **Join Handling**: The frontend handles relational data as both objects and arrays (Supabase fallback) to ensure badges always render titles correctly.

## 👥 Team Management Logic
A robust system for handling team registrations and member status.

### Join Request Flow
- **Requesting**: Students can browse open teams and "Request to Join".
- **Management**: Only the **Team Leader** can see and manage (Accept/Reject) join requests. This is handled in the **My Events** student page.
- **Acceptance**: Accepting a request adds the user to `team_members` and creates a matching `registrations` record.

### Stability & Dissolution
- **Leadership Transfer**: If a leader withdraws or is kicked, the system automatically promotes the next oldest member in the team to "Leader".
- **Dissolution Policy**: Teams are **not** automatically dissolved if they fall below the "minimum size" (since teams start with 1 person). A team only dissolves automatically when the **last member** is removed (0 members left).
- **Manual Control**: Admins maintain a "Dissolve Team" button for full manual override.

## 🕒 Timezone Management
Standardized to **Indian Standard Time (IST - Asia/Kolkata)**.
- **Utility**: `src/lib/utils/dateUtils.ts` handles all conversions.
- **UI**: Every timestamp shown to students or admins is formatted in IST to avoid server-side UTC confusion.

## 🚀 Deployment Notes
- **RLS**: The `users` table requires a "Public Profile" policy for Join Requests to show names:
  `CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT TO authenticated USING (true);`
- **Environment**: `SUPABASE_SERVICE_ROLE_KEY` is mandatory for admin functionalities.

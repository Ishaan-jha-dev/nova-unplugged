# Implementation Plan - Nova Unplugged Refinement

## Phase 1: Core Dashboard & Reliability [COMPLETED]
- **Admin Dashboard Reliability**: Service Role Integration and relationship resolution for KPI counters.
- **IST Standardization**: Global rollout of `formatIST` utility for all timestamps.
- **Professional UX**: Integrated Timeline/About Us views and Sidebar persistence.

## Phase 2: Data Display & Team Management [COMPLETED]
- **Dynamic Category Overhaul**:
    - Replaced static string categories with a relational `categories` table.
    - Updated `EventsClient`, `MyEventsClient`, and `Dashboard` to support dynamic category joins.
- **Team Join Request System**:
    - Implemented `team_join_requests` table with pending/accepted/rejected status.
    - Restricted request management (Accept/Reject) strictly to the **Team Leader**.
    - Moved join request management to the **My Events** page for better UX.
    - Added confirmation modals for accepting/rejecting requests.
- **RLS & Visibility**:
    - Implemented public profile visibility policy to allow team leaders to see applicants' names/emails.
- **Team Stability Logic**:
    - Removed automatic dissolution when dropping below minimum size.
    - **Leadership Transfer**: Automated promotion of the next oldest member if a leader withdraws or is kicked.
    - **0-Member Dissolution**: Teams only dissolve automatically when the last member is removed.

## Phase 3: Final Polish & Deployment [IN PROGRESS]
- [x] Escape ESLint entities in Categories admin panel.
- [x] Fix "Unknown Date" and "Blank Category" display issues.
- [x] Add "Leader" badge to Admin Registrations view.
- [ ] Final production smoke test.

## Verification Checklist
- [x] Category badges show titles correctly (handling Supabase join arrays).
- [x] Team leader can see names in Join Requests panel.
- [x] Withdrawing as leader transfers leadership correctly.
- [x] Dates show "Date TBD" or "IST String" instead of "Unknown".

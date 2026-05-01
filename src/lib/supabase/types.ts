export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PaymentStatus = 'pending' | 'approved' | 'rejected'
export type EntryStatus = 'not_approved' | 'approved' | 'scanned'
export type ParticipationType = 'individual' | 'team'
export type ScanResult = 'valid' | 'already_scanned' | 'invalid'
export type EventCategory = 'cultural' | 'technical' | 'sports' | 'fun' | 'other'

export interface Database {
  public: {
    Tables: {
      user_types: {
        Row: { id: string; name: string; description: string | null }
        Insert: { id?: string; name: string; description?: string | null }
        Update: { id?: string; name?: string; description?: string | null }
      }
      user_roles: {
        Row: { id: string; name: string; permissions_level: number }
        Insert: { id?: string; name: string; permissions_level: number }
        Update: { id?: string; name?: string; permissions_level?: number }
      }
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          college: string | null
          student_id: string | null
          phone: string | null
          course: string | null
          year: string | null
          type_id: string | null
          role_id: string | null
          payment_status: PaymentStatus
          entry_code: string | null
          entry_status: EntryStatus
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          college?: string | null
          student_id?: string | null
          phone?: string | null
          course?: string | null
          year?: string | null
          type_id?: string | null
          role_id?: string | null
          payment_status?: PaymentStatus
          entry_code?: string | null
          entry_status?: EntryStatus
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          college?: string | null
          student_id?: string | null
          phone?: string | null
          course?: string | null
          year?: string | null
          type_id?: string | null
          role_id?: string | null
          payment_status?: PaymentStatus
          entry_code?: string | null
          entry_status?: EntryStatus
        }
      }
      payment_submissions: {
        Row: {
          id: string
          user_id: string
          utr_number: string
          screenshot_url: string | null
          status: PaymentStatus
          admin_note: string | null
          reviewed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          utr_number: string
          screenshot_url?: string | null
          status?: PaymentStatus
          admin_note?: string | null
          reviewed_by?: string | null
          created_at?: string
        }
        Update: {
          status?: PaymentStatus
          admin_note?: string | null
          reviewed_by?: string | null
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          banner_url: string | null
          category: EventCategory
          participation_type: ParticipationType
          team_size_min: number | null
          team_size_max: number | null
          rulebook_url: string | null
          organizer_name: string | null
          organizer_contact: string | null
          group_join_link: string | null
          venue: string | null
          start_time: string | null
          end_time: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          banner_url?: string | null
          category?: EventCategory
          participation_type?: ParticipationType
          team_size_min?: number | null
          team_size_max?: number | null
          rulebook_url?: string | null
          organizer_name?: string | null
          organizer_contact?: string | null
          group_join_link?: string | null
          venue?: string | null
          start_time?: string | null
          end_time?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          banner_url?: string | null
          category?: EventCategory
          participation_type?: ParticipationType
          team_size_min?: number | null
          team_size_max?: number | null
          rulebook_url?: string | null
          organizer_name?: string | null
          organizer_contact?: string | null
          group_join_link?: string | null
          venue?: string | null
          start_time?: string | null
          end_time?: string | null
          is_active?: boolean
        }
      }
      teams: {
        Row: {
          id: string
          event_id: string
          name: string
          join_code: string
          leader_id: string
          is_open: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          join_code?: string
          leader_id: string
          is_open?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          is_open?: boolean
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          joined_at?: string
        }
        Update: { id?: string }
      }
      registrations: {
        Row: {
          id: string
          user_id: string
          event_id: string
          team_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          team_id?: string | null
          created_at?: string
        }
        Update: { id?: string }
      }
      announcements: {
        Row: {
          id: string
          title: string
          body: string
          posted_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          posted_by: string
          created_at?: string
        }
        Update: {
          title?: string
          body?: string
        }
      }
      scanner_log: {
        Row: {
          id: string
          entry_code: string
          scanned_by: string
          scan_result: ScanResult
          target_user_id: string | null
          scanned_at: string
        }
        Insert: {
          id?: string
          entry_code: string
          scanned_by: string
          scan_result: ScanResult
          target_user_id?: string | null
          scanned_at?: string
        }
        Update: { id?: string }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience type helpers
export type UserRow = Database['public']['Tables']['users']['Row']
export type EventRow = Database['public']['Tables']['events']['Row']
export type TeamRow = Database['public']['Tables']['teams']['Row']
export type TeamMemberRow = Database['public']['Tables']['team_members']['Row']
export type RegistrationRow = Database['public']['Tables']['registrations']['Row']
export type PaymentSubmissionRow = Database['public']['Tables']['payment_submissions']['Row']
export type AnnouncementRow = Database['public']['Tables']['announcements']['Row']
export type ScannerLogRow = Database['public']['Tables']['scanner_log']['Row']
export type UserTypeRow = Database['public']['Tables']['user_types']['Row']
export type UserRoleRow = Database['public']['Tables']['user_roles']['Row']

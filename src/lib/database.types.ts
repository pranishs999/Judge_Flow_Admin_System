export type UserRole = "SUPER_ADMIN" | "ADMIN" | "JUDGE" | "MAINTAINER";
export type UserStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
export type EventType = "HACKATHON" | "PROJECT_COMPETITION" | "STARTUP_PITCH" | "ROBOTICS" | "RESEARCH_PAPER" | "POSTER_PRESENTATION" | "INNOVATION_CHALLENGE" | "CUSTOM";
export type EventStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "JUDGING" | "JUDGING_COMPLETE" | "RESULTS_PROCESSING" | "RESULTS_READY" | "RESULTS_RELEASED" | "ARCHIVED";
export type ScoringPrecision = "INTEGER" | "DECIMAL";
export type ResultsVisibility = "HIDDEN" | "RANKING_ONLY" | "SELF_SCORE" | "FULL_LEADERBOARD";
export type RegistrationStatus = "DRAFT" | "SUBMITTED";
export type FieldType = "SHORT_TEXT" | "LONG_TEXT" | "EMAIL" | "PHONE" | "NUMBER" | "DROPDOWN" | "RADIO" | "CHECKBOX" | "DATE" | "TIME" | "FILE_UPLOAD" | "URL" | "SECTION_HEADER";
export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "VOID" | "PHASE_TRANSITION" | "LOGIN" | "LOGOUT" | "ROLE_CHANGE" | "DEADLINE_EXTEND" | "RESULTS_RELEASE" | "SCORE_SUBMIT" | "EXPORT";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  description: string;
  event_type: EventType;
  status: EventStatus;
  min_team_size: number;
  max_team_size: number;
  scoring_precision: ScoringPrecision;
  results_visibility: ResultsVisibility;
  registration_deadline?: string;
  form_edit_window_end?: string;
  judging_start?: string;
  judging_end?: string;
  allow_late_registration: boolean;
  created_by: string;
  approved_by?: string;
  approval_comment?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Form {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: string;
  form_id: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options: Record<string, unknown>;
  validation: Record<string, unknown>;
  sort_order: number;
  created_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  draft_id: string;
  team_name: string;
  recovery_email?: string;
  status: RegistrationStatus;
  submitted_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  registration_id: string;
  name: string;
  email?: string;
  role_in_team?: string;
  sort_order: number;
}

export interface RegistrationResponse {
  id: string;
  registration_id: string;
  field_id: string;
  value?: string;
  file_urls: string[];
}

export interface Project {
  id: string;
  event_id: string;
  registration_id: string;
  project_number: number;
  title: string;
  abstract: string;
  qr_code_url?: string;
  created_at: string;
}

export interface Criterion {
  id: string;
  event_id: string;
  name: string;
  description: string;
  min_marks: number;
  max_marks: number;
  weight: number;
  sort_order: number;
  created_at: string;
}

export interface Score {
  id: string;
  judge_id: string;
  project_id: string;
  criterion_id: string;
  event_id: string;
  marks: number;
  voided: boolean;
  voided_by?: string;
  voided_at?: string;
  void_reason?: string;
  created_at: string;
}

export interface EventJudge {
  id: string;
  event_id: string;
  judge_id: string;
  assigned_at: string;
}

export interface Ranking {
  id: string;
  event_id: string;
  project_id: string;
  total_score: number;
  average_score: number;
  rank: number;
  is_tied: boolean;
  computed_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: AuditAction;
  table_name?: string;
  record_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  reason?: string;
  created_at: string;
}

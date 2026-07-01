-- JFlow: Initial Schema Migration
-- Enums
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'JUDGE', 'MAINTAINER');
CREATE TYPE user_status AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');
CREATE TYPE event_type AS ENUM ('HACKATHON', 'PROJECT_COMPETITION', 'STARTUP_PITCH', 'ROBOTICS', 'RESEARCH_PAPER', 'POSTER_PRESENTATION', 'INNOVATION_CHALLENGE', 'CUSTOM');
CREATE TYPE event_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'JUDGING', 'JUDGING_COMPLETE', 'RESULTS_PROCESSING', 'RESULTS_READY', 'RESULTS_RELEASED', 'ARCHIVED');
CREATE TYPE scoring_precision AS ENUM ('INTEGER', 'DECIMAL');
CREATE TYPE results_visibility AS ENUM ('HIDDEN', 'RANKING_ONLY', 'SELF_SCORE', 'FULL_LEADERBOARD');
CREATE TYPE registration_status AS ENUM ('DRAFT', 'SUBMITTED');
CREATE TYPE field_type AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'DROPDOWN', 'RADIO', 'CHECKBOX', 'DATE', 'TIME', 'FILE_UPLOAD', 'URL', 'SECTION_HEADER');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'VOID', 'PHASE_TRANSITION', 'LOGIN', 'LOGOUT', 'ROLE_CHANGE', 'DEADLINE_EXTEND', 'RESULTS_RELEASE', 'SCORE_SUBMIT', 'EXPORT');

-- Extensions & Functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION nanoid(size INT DEFAULT 12)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  bytes BYTEA;
  i INT;
  val INT;
BEGIN
  bytes := gen_random_bytes(size);
  FOR i IN 0..size-1 LOOP
    val := get_byte(bytes, i);
    result := result || substr(chars, (val % length(chars)) + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tables
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'JUDGE',
  status user_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_email ON profiles(email);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_type event_type NOT NULL DEFAULT 'CUSTOM',
  status event_status NOT NULL DEFAULT 'DRAFT',
  min_team_size INT NOT NULL DEFAULT 1 CHECK (min_team_size >= 1),
  max_team_size INT NOT NULL DEFAULT 5 CHECK (max_team_size >= min_team_size),
  scoring_precision scoring_precision NOT NULL DEFAULT 'INTEGER',
  results_visibility results_visibility NOT NULL DEFAULT 'HIDDEN',
  registration_deadline TIMESTAMPTZ,
  form_edit_window_end TIMESTAMPTZ,
  judging_start TIMESTAMPTZ,
  judging_end TIMESTAMPTZ,
  allow_late_registration BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approval_comment TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_created_by ON events(created_by);

CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Registration Form',
  description TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_type field_type NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  placeholder TEXT,
  help_text TEXT,
  options JSONB DEFAULT '{}',
  validation JSONB DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_fields_form ON form_fields(form_id);
CREATE INDEX idx_form_fields_order ON form_fields(form_id, sort_order);

CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  draft_id TEXT UNIQUE NOT NULL DEFAULT nanoid(),
  team_name TEXT NOT NULL DEFAULT '',
  recovery_email TEXT,
  status registration_status NOT NULL DEFAULT 'DRAFT',
  submitted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_draft ON registrations(draft_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_email ON registrations(recovery_email);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role_in_team TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_team_members_registration ON team_members(registration_id);

CREATE TABLE registration_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES form_fields(id),
  value TEXT,
  file_urls JSONB DEFAULT '[]',
  UNIQUE(registration_id, field_id)
);

CREATE INDEX idx_reg_responses_registration ON registration_responses(registration_id);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  registration_id UUID UNIQUE NOT NULL REFERENCES registrations(id),
  project_number INT NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT NOT NULL DEFAULT '',
  qr_code_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, project_number)
);

CREATE INDEX idx_projects_event ON projects(event_id);

CREATE TABLE criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  min_marks NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (min_marks >= 0),
  max_marks NUMERIC(6,2) NOT NULL CHECK (max_marks > min_marks),
  weight NUMERIC(5,2) NOT NULL DEFAULT 1.0 CHECK (weight > 0),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_criteria_event ON criteria(event_id);
CREATE INDEX idx_criteria_order ON criteria(event_id, sort_order);

CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID NOT NULL REFERENCES profiles(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  criterion_id UUID NOT NULL REFERENCES criteria(id),
  event_id UUID NOT NULL REFERENCES events(id),
  marks NUMERIC(6,2) NOT NULL,
  voided BOOLEAN NOT NULL DEFAULT false,
  voided_by UUID REFERENCES profiles(id),
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(judge_id, project_id, criterion_id)
);

CREATE INDEX idx_scores_judge ON scores(judge_id);
CREATE INDEX idx_scores_project ON scores(project_id);
CREATE INDEX idx_scores_event ON scores(event_id);
CREATE INDEX idx_scores_judge_project ON scores(judge_id, project_id);

CREATE TABLE event_judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, judge_id)
);

CREATE INDEX idx_event_judges_event ON event_judges(event_id);
CREATE INDEX idx_event_judges_judge ON event_judges(judge_id);

CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  total_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  average_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  rank INT NOT NULL,
  is_tied BOOLEAN NOT NULL DEFAULT false,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, project_id)
);

CREATE INDEX idx_rankings_event ON rankings(event_id);
CREATE INDEX idx_rankings_rank ON rankings(event_id, rank);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  action audit_action NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Views
CREATE VIEW anonymized_projects AS
  SELECT id, event_id, project_number, title, abstract
  FROM projects;

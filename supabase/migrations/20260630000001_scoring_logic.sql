-- JFlow: Scoring Logic & RPC Functions Migration

-- Compute rankings
CREATE OR REPLACE FUNCTION compute_rankings(p_event_id UUID)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM rankings WHERE event_id = p_event_id;

  INSERT INTO rankings (event_id, project_id, total_score, average_score, rank, is_tied)
  WITH judge_totals AS (
    SELECT
      s.project_id,
      s.judge_id,
      SUM(s.marks * c.weight) AS judge_total
    FROM scores s
    JOIN criteria c ON c.id = s.criterion_id
    WHERE s.event_id = p_event_id AND s.voided = false
    GROUP BY s.project_id, s.judge_id
  ),
  project_averages AS (
    SELECT
      project_id,
      SUM(judge_total) AS total_score,
      AVG(judge_total) AS average_score
    FROM judge_totals
    GROUP BY project_id
  ),
  ranked_projects AS (
    SELECT
      project_id,
      total_score,
      average_score,
      RANK() OVER (ORDER BY average_score DESC) AS rank
    FROM project_averages
  ),
  tied_projects AS (
    SELECT
      project_id,
      total_score,
      average_score,
      rank,
      COUNT(*) OVER (PARTITION BY rank) > 1 AS is_tied
    FROM ranked_projects
  )
  SELECT
    p_event_id,
    project_id,
    total_score,
    average_score,
    rank,
    is_tied
  FROM tied_projects;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get judge progress
CREATE OR REPLACE FUNCTION get_judge_progress(p_judge_id UUID, p_event_id UUID)
RETURNS TABLE (
  project_id UUID,
  project_title TEXT,
  criteria_total INT,
  criteria_scored INT,
  is_complete BOOLEAN
) AS $$
BEGIN
  IF auth.uid() IS NULL OR (
    auth.uid() != p_judge_id AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS project_id,
    p.title AS project_title,
    (SELECT COUNT(*)::INT FROM criteria WHERE event_id = p_event_id) AS criteria_total,
    (SELECT COUNT(*)::INT FROM scores WHERE judge_id = p_judge_id AND project_id = p.id AND voided = false) AS criteria_scored,
    (SELECT COUNT(*)::INT FROM scores WHERE judge_id = p_judge_id AND project_id = p.id AND voided = false) =
      (SELECT COUNT(*)::INT FROM criteria WHERE event_id = p_event_id) AS is_complete
  FROM projects p
  WHERE p.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Registration draft creation
CREATE OR REPLACE FUNCTION create_registration_draft(p_event_id UUID, p_recovery_email TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_registration_id UUID;
  v_draft_id TEXT;
BEGIN
  INSERT INTO registrations (event_id, recovery_email)
  VALUES (p_event_id, p_recovery_email)
  RETURNING id, draft_id INTO v_registration_id, v_draft_id;

  RETURN jsonb_build_object(
    'registration_id', v_registration_id,
    'draft_id', v_draft_id,
    'status', 'DRAFT'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Registration submission
CREATE OR REPLACE FUNCTION submit_registration(p_draft_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_registration_id UUID;
  v_project_number INT;
  v_project_id UUID;
  v_event_id UUID;
  v_team_name TEXT;
BEGIN
  SELECT id, event_id, team_name INTO v_registration_id, v_event_id, v_team_name
  FROM registrations WHERE draft_id = p_draft_id AND status = 'DRAFT'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration not found or already submitted';
  END IF;

  UPDATE registrations
  SET status = 'SUBMITTED', submitted_at = now()
  WHERE id = v_registration_id;

  SELECT COALESCE(MAX(project_number), 0) + 1 INTO v_project_number
  FROM projects WHERE event_id = v_event_id;

  INSERT INTO projects (event_id, registration_id, project_number, title, abstract)
  VALUES (v_event_id, v_registration_id, v_project_number, v_team_name, '')
  RETURNING id INTO v_project_id;

  RETURN jsonb_build_object(
    'registration_id', v_registration_id,
    'project_number', v_project_number,
    'project_id', v_project_id,
    'status', 'SUBMITTED',
    'submitted_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Custom Access Token Hook for JWT Roles
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  user_role TEXT;
BEGIN
  SELECT role::TEXT INTO user_role FROM public.profiles WHERE id = (event->>'user_id')::uuid;
  claims := event->'claims';
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(user_role));
  END IF;
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Sequential scoring validation trigger
CREATE OR REPLACE FUNCTION validate_sequential_scoring()
RETURNS TRIGGER AS $$
DECLARE
  criterion_order INT;
  prev_scored BOOLEAN;
BEGIN
  SELECT sort_order INTO criterion_order FROM criteria WHERE id = NEW.criterion_id;

  IF criterion_order > 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM scores s
      JOIN criteria c ON c.id = s.criterion_id
      WHERE s.judge_id = NEW.judge_id
        AND s.project_id = NEW.project_id
        AND c.sort_order = criterion_order - 1
        AND s.voided = false
    ) INTO prev_scored;

    IF NOT prev_scored THEN
      RAISE EXCEPTION 'Previous criterion must be scored first';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_sequential_scoring
  BEFORE INSERT ON scores
  FOR EACH ROW EXECUTE FUNCTION validate_sequential_scoring();

-- Form lock trigger
CREATE OR REPLACE FUNCTION check_form_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_is_locked BOOLEAN;
BEGIN
  SELECT is_locked INTO v_is_locked FROM forms WHERE id = COALESCE(NEW.form_id, OLD.form_id);
  IF v_is_locked THEN
    RAISE EXCEPTION 'Form structure is locked and cannot be modified';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_form_lock
  BEFORE INSERT OR UPDATE OR DELETE ON form_fields
  FOR EACH ROW EXECUTE FUNCTION check_form_lock();

-- Audit log trigger
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (actor_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    CASE TG_OP WHEN 'INSERT' THEN 'CREATE' WHEN 'UPDATE' THEN 'UPDATE' WHEN 'DELETE' THEN 'DELETE' END::audit_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_events AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_scores AFTER INSERT OR UPDATE ON scores
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_profiles AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Auto-profile creation on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

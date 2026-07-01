-- JFlow: Row-Level Security Policies Migration

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (status = 'APPROVED' OR auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')));

CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND
    role = (SELECT role FROM profiles WHERE id = auth.uid()) AND
    status = (SELECT status FROM profiles WHERE id = auth.uid()));

CREATE POLICY "profiles_update_sa" ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (role = 'JUDGE' AND status IN ('APPROVED', 'REJECTED'));

-- events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select" ON events FOR SELECT
  USING (deleted_at IS NULL AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN'))
    OR (status IN ('REGISTRATION_OPEN', 'RESULTS_RELEASED'))
    OR (status = 'JUDGING' AND EXISTS (
      SELECT 1 FROM event_judges WHERE event_id = events.id AND judge_id = auth.uid()))
  ));

CREATE POLICY "events_insert" ON events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')));

CREATE POLICY "events_update" ON events FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')));

-- scores
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores_select_judge" ON scores FOR SELECT
  USING (judge_id = auth.uid());

CREATE POLICY "scores_select_admin" ON scores FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')));

CREATE POLICY "scores_insert" ON scores FOR INSERT
  WITH CHECK (
    judge_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'JUDGE' AND status = 'APPROVED')
    AND EXISTS (SELECT 1 FROM event_judges WHERE event_id = scores.event_id AND judge_id = auth.uid())
    AND EXISTS (SELECT 1 FROM events WHERE id = scores.event_id AND status = 'JUDGING')
  );

CREATE POLICY "scores_void_sa" ON scores FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'))
  WITH CHECK (voided = true);

-- registrations
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registrations_insert_public" ON registrations FOR INSERT
  WITH CHECK (status = 'DRAFT');

CREATE POLICY "registrations_select_public" ON registrations FOR SELECT
  USING (status = 'DRAFT' AND draft_id = current_setting('request.headers', true)::json->>'x-draft-id');

CREATE POLICY "registrations_select_admin" ON registrations FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')));

-- audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select_sa" ON audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

CREATE POLICY "audit_insert" ON audit_logs FOR INSERT
  WITH CHECK (false);

-- projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN'))
    OR EXISTS (SELECT 1 FROM event_judges WHERE event_id = projects.event_id AND judge_id = auth.uid())
  );

CREATE POLICY "projects_manage" ON projects FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')));

-- forms
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forms_select" ON forms FOR SELECT USING (true);
CREATE POLICY "forms_manage" ON forms FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')));

-- form_fields
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_fields_select" ON form_fields FOR SELECT USING (true);
CREATE POLICY "form_fields_manage" ON form_fields FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')));

-- criteria
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "criteria_select" ON criteria FOR SELECT USING (true);
CREATE POLICY "criteria_manage" ON criteria FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')));

-- team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_select" ON team_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN'))
    OR EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = team_members.registration_id
      AND r.status = 'DRAFT'
      AND r.draft_id = current_setting('request.headers', true)::json->>'x-draft-id'
    )
  );

CREATE POLICY "team_members_modify" ON team_members FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN'))
    OR EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = team_members.registration_id
      AND r.status = 'DRAFT'
      AND r.draft_id = current_setting('request.headers', true)::json->>'x-draft-id'
    )
  );

-- registration_responses
ALTER TABLE registration_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registration_responses_select" ON registration_responses FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN'))
    OR EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_responses.registration_id
      AND r.status = 'DRAFT'
      AND r.draft_id = current_setting('request.headers', true)::json->>'x-draft-id'
    )
  );

CREATE POLICY "registration_responses_modify" ON registration_responses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN'))
    OR EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_responses.registration_id
      AND r.status = 'DRAFT'
      AND r.draft_id = current_setting('request.headers', true)::json->>'x-draft-id'
    )
  );

-- event_judges
ALTER TABLE event_judges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_judges_select" ON event_judges FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN'))
    OR judge_id = auth.uid()
  );

CREATE POLICY "event_judges_manage" ON event_judges FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')));

-- rankings
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rankings_select" ON rankings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN'))
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = rankings.event_id
      AND e.status = 'RESULTS_RELEASED'
      AND e.results_visibility != 'HIDDEN'
    )
  );

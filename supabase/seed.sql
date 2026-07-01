-- JFlow: Development Seed Data

-- Insert a test super admin (requires a real auth.users entry - use Supabase dashboard for auth)
-- This is a placeholder for local development seeding

-- Sample event
INSERT INTO events (id, name, slug, description, event_type, status, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'National Innovation Hackathon 2026',
  'national-innovation-hackathon-2026',
  'Annual student-led innovation contest showcasing breakthrough ideas.',
  'HACKATHON',
  'DRAFT',
  (SELECT id FROM profiles LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- Sample criteria for the event
INSERT INTO criteria (event_id, name, description, min_marks, max_marks, weight, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Innovation', 'How novel is the proposed solution?', 0, 10, 1.5, 0),
  ('00000000-0000-0000-0000-000000000001', 'Technical Execution', 'Quality of implementation and technical depth', 0, 10, 1.5, 1),
  ('00000000-0000-0000-0000-000000000001', 'Presentation', 'Clarity and effectiveness of the pitch', 0, 10, 1.0, 2),
  ('00000000-0000-0000-0000-000000000001', 'Impact', 'Potential real-world impact and scalability', 0, 10, 1.0, 3)
ON CONFLICT DO NOTHING;

-- Sample form for the event
INSERT INTO forms (event_id, title, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Hackathon Registration',
  'Register your team for the National Innovation Hackathon 2026'
) ON CONFLICT (event_id) DO NOTHING;

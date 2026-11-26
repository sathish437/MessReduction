-- Allow NULL dob and phone_no when auto-provisioning StudentDetails on first HostelApp login/SSO.
-- Students complete these fields during the onboarding modal before accessing the dashboard.
ALTER TABLE IF EXISTS mr_student_details
    ALTER COLUMN dob DROP NOT NULL,
    ALTER COLUMN phone_no DROP NOT NULL;

-- V6__prefix_all_tables_mr.sql
-- Migration: Prefix all MessReduction tables with mr_ for shared database isolation

-- 1. mr_departments
CREATE TABLE IF NOT EXISTS mr_departments (
    id BIGSERIAL PRIMARY KEY,
    department_code VARCHAR(50) NOT NULL UNIQUE,
    department_name VARCHAR(150) NOT NULL UNIQUE,
    short_name VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed standard default departments if missing
INSERT INTO mr_departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'CSE', 'Computer Science and Engineering', 'CSE', 1, true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM mr_departments WHERE department_code = 'CSE');

INSERT INTO mr_departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'ECE', 'Electronics and Communication Engineering', 'ECE', 2, true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM mr_departments WHERE department_code = 'ECE');

INSERT INTO mr_departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'EEE', 'Electrical and Electronics Engineering', 'EEE', 3, true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM mr_departments WHERE department_code = 'EEE');

INSERT INTO mr_departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'MECH', 'Mechanical Engineering', 'MECH', 4, true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM mr_departments WHERE department_code = 'MECH');

INSERT INTO mr_departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'CIVIL', 'Civil Engineering', 'CIVIL', 5, true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM mr_departments WHERE department_code = 'CIVIL');

INSERT INTO mr_departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'MECHATRONICS', 'Mechatronics Engineering', 'MECHATRONICS', 6, true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM mr_departments WHERE department_code = 'MECHATRONICS');

INSERT INTO mr_departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'AI&DS', 'Artificial Intelligence and Data Science', 'AI&DS', 7, true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM mr_departments WHERE department_code = 'AI&DS');

-- Copy existing departments if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
        INSERT INTO mr_departments (id, department_code, department_name, short_name, description, display_order, is_active, created_at, updated_at)
        SELECT id, department_code, department_name, short_name, description, display_order, is_active, created_at, updated_at
        FROM departments
        ON CONFLICT (id) DO NOTHING;
        PERFORM setval('mr_departments_id_seq', COALESCE((SELECT MAX(id) FROM mr_departments), 1));
    END IF;
END $$;

-- 2. mr_student_details
CREATE TABLE IF NOT EXISTS mr_student_details (
    student_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    register_no VARCHAR(20) NOT NULL UNIQUE,
    roll_no VARCHAR(20) NOT NULL UNIQUE,
    department VARCHAR(255) NOT NULL,
    gender VARCHAR(20),
    dob DATE,
    email_id VARCHAR(255) NOT NULL UNIQUE,
    phone_no VARCHAR(10),
    current_year INT,
    daily_submission_count INT DEFAULT 0,
    extra_submission_granted INT DEFAULT 0,
    extra_submission_used INT DEFAULT 0,
    last_submission_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sd_register_no ON mr_student_details(register_no);
CREATE INDEX IF NOT EXISTS idx_sd_roll_no ON mr_student_details(roll_no);
CREATE INDEX IF NOT EXISTS idx_sd_email ON mr_student_details(email_id);
CREATE INDEX IF NOT EXISTS idx_sd_department ON mr_student_details(department);

-- Copy existing student_details if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_details') THEN
        INSERT INTO mr_student_details (student_id, name, register_no, roll_no, department, gender, dob, email_id, phone_no, current_year, daily_submission_count, extra_submission_granted, extra_submission_used, last_submission_date, created_at)
        SELECT student_id, name, register_no, roll_no, department, gender, dob, email_id, phone_no, current_year, daily_submission_count, extra_submission_granted, extra_submission_used, last_submission_date, created_at
        FROM student_details
        ON CONFLICT (student_id) DO NOTHING;
        PERFORM setval('mr_student_details_student_id_seq', COALESCE((SELECT MAX(student_id) FROM mr_student_details), 1));
    END IF;
END $$;

-- 3. mr_reduction_form
CREATE TABLE IF NOT EXISTS mr_reduction_form (
    form_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES mr_student_details(student_id),
    year INT NOT NULL,
    room_no BIGINT NOT NULL,
    leave_date DATE NOT NULL,
    leave_time TIME NOT NULL,
    arrival_date DATE NOT NULL,
    arrival_time TIME NOT NULL,
    present_date DATE NOT NULL,
    total_holidays BIGINT NOT NULL,
    reason TEXT NOT NULL,
    current_status VARCHAR(50) NOT NULL,
    assigned_deputy_warden VARCHAR(255),
    reject_reason VARCHAR(1000),
    to_date DATE,
    additional_remarks VARCHAR(1000),
    resubmission_count INT DEFAULT 0,
    rejected_stage VARCHAR(50),
    rejected_at TIMESTAMP,
    resume_stage VARCHAR(50),
    deleted_by_student BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reminder30_min_sent BOOLEAN DEFAULT false,
    reminder1_hour_sent BOOLEAN DEFAULT false,
    reminder3_hour_sent BOOLEAN DEFAULT false,
    last_reminder_sent_at TIMESTAMP,
    last_escalation_sent_at TIMESTAMP,
    last_summary_sent_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_rf_status_active ON mr_reduction_form(current_status, is_active);
CREATE INDEX IF NOT EXISTS idx_rf_deputy_active ON mr_reduction_form(assigned_deputy_warden, is_active);
CREATE INDEX IF NOT EXISTS idx_rf_deputy_status_active ON mr_reduction_form(assigned_deputy_warden, current_status, is_active);
CREATE INDEX IF NOT EXISTS idx_rf_year_status_active ON mr_reduction_form(year, current_status, is_active);
CREATE INDEX IF NOT EXISTS idx_rf_student_active ON mr_reduction_form(student_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rf_dates ON mr_reduction_form(leave_date, arrival_date);
CREATE INDEX IF NOT EXISTS idx_rf_submitted_at ON mr_reduction_form(submitted_at);

-- Copy existing reduction_form if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reduction_form') THEN
        INSERT INTO mr_reduction_form (form_id, student_id, year, room_no, leave_date, leave_time, arrival_date, arrival_time, present_date, total_holidays, reason, current_status, assigned_deputy_warden, reject_reason, to_date, additional_remarks, resubmission_count, rejected_stage, rejected_at, resume_stage, deleted_by_student, deleted_at, submitted_at, reminder30_min_sent, reminder1_hour_sent, reminder3_hour_sent, last_reminder_sent_at, last_escalation_sent_at, last_summary_sent_at, is_active)
        SELECT form_id, student_id, year, room_no, leave_date, leave_time, arrival_date, arrival_time, present_date, total_holidays, reason, current_status, assigned_deputy_warden, reject_reason, to_date, additional_remarks, resubmission_count, rejected_stage, rejected_at, resume_stage, deleted_by_student, deleted_at, submitted_at, reminder30_min_sent, reminder1_hour_sent, reminder3_hour_sent, last_reminder_sent_at, last_escalation_sent_at, last_summary_sent_at, is_active
        FROM reduction_form
        ON CONFLICT (form_id) DO NOTHING;
        PERFORM setval('mr_reduction_form_form_id_seq', COALESCE((SELECT MAX(form_id) FROM mr_reduction_form), 1));
    END IF;
END $$;

-- 4. mr_reduction_form_history
CREATE TABLE IF NOT EXISTS mr_reduction_form_history (
    id BIGSERIAL PRIMARY KEY,
    form_id BIGINT NOT NULL REFERENCES mr_reduction_form(form_id),
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    event_type VARCHAR(255),
    performed_by VARCHAR(255),
    comment VARCHAR(1000),
    event_timestamp TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_rfh_form_id ON mr_reduction_form_history(form_id);
CREATE INDEX IF NOT EXISTS idx_rfh_event_timestamp ON mr_reduction_form_history(event_timestamp);

-- Copy existing reduction_form_history if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reduction_form_history') THEN
        INSERT INTO mr_reduction_form_history (id, form_id, from_status, to_status, event_type, performed_by, comment, event_timestamp, is_active)
        SELECT id, form_id, from_status, to_status, event_type, performed_by, comment, event_timestamp, is_active
        FROM reduction_form_history
        ON CONFLICT (id) DO NOTHING;
        PERFORM setval('mr_reduction_form_history_id_seq', COALESCE((SELECT MAX(id) FROM mr_reduction_form_history), 1));
    END IF;
END $$;

-- 5. mr_extra_submission_request
CREATE TABLE IF NOT EXISTS mr_extra_submission_request (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES mr_student_details(student_id),
    reason VARCHAR(300) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_esr_student_id ON mr_extra_submission_request(student_id);
CREATE INDEX IF NOT EXISTS idx_esr_status ON mr_extra_submission_request(status);

-- Copy existing extra_submission_request if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'extra_submission_request') THEN
        INSERT INTO mr_extra_submission_request (id, student_id, reason, status, approved_by, approved_at, created_at, used)
        SELECT id, student_id, reason, status, approved_by, approved_at, created_at, used
        FROM extra_submission_request
        ON CONFLICT (id) DO NOTHING;
        PERFORM setval('mr_extra_submission_request_id_seq', COALESCE((SELECT MAX(id) FROM mr_extra_submission_request), 1));
    END IF;
END $$;

-- 6. mr_activity_log
CREATE TABLE IF NOT EXISTS mr_activity_log (
    id BIGSERIAL PRIMARY KEY,
    form_id BIGINT,
    student_id BIGINT,
    student_name VARCHAR(255),
    department VARCHAR(255),
    year INT,
    staff_role VARCHAR(50),
    staff_name VARCHAR(255),
    action VARCHAR(255),
    timestamp TIMESTAMP,
    arrival_date DATE,
    is_active BOOLEAN DEFAULT true,
    ip_address VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_al_staff_role_action ON mr_activity_log(staff_role, action, is_active);
CREATE INDEX IF NOT EXISTS idx_al_staff_name ON mr_activity_log(staff_name);
CREATE INDEX IF NOT EXISTS idx_al_form_id ON mr_activity_log(form_id);
CREATE INDEX IF NOT EXISTS idx_al_timestamp ON mr_activity_log(timestamp);

-- Copy existing activity_log if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log') THEN
        INSERT INTO mr_activity_log (id, form_id, student_id, student_name, department, year, staff_role, staff_name, action, timestamp, arrival_date, is_active, ip_address)
        SELECT id, form_id, student_id, student_name, department, year, staff_role, staff_name, action, timestamp, arrival_date, is_active, ip_address
        FROM activity_log
        ON CONFLICT (id) DO NOTHING;
        PERFORM setval('mr_activity_log_id_seq', COALESCE((SELECT MAX(id) FROM mr_activity_log), 1));
    END IF;
END $$;

-- 7. mr_app_notification
CREATE TABLE IF NOT EXISTS mr_app_notification (
    id BIGSERIAL PRIMARY KEY,
    recipient_username VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    related_form_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    whatsapp_status VARCHAR(20) DEFAULT 'PENDING',
    retry_count INT DEFAULT 0,
    sent_time TIMESTAMP,
    recipient_role VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_an_recipient_read ON mr_app_notification(recipient_username, is_read);
CREATE INDEX IF NOT EXISTS idx_an_whatsapp_status ON mr_app_notification(whatsapp_status);
CREATE INDEX IF NOT EXISTS idx_an_created_at ON mr_app_notification(created_at);

-- Copy existing app_notification if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_notification') THEN
        INSERT INTO mr_app_notification (id, recipient_username, message, type, is_read, related_form_id, created_at, whatsapp_status, retry_count, sent_time, recipient_role)
        SELECT id, recipient_username, message, type, is_read, related_form_id, created_at, whatsapp_status, retry_count, sent_time, recipient_role
        FROM app_notification
        ON CONFLICT (id) DO NOTHING;
        PERFORM setval('mr_app_notification_id_seq', COALESCE((SELECT MAX(id) FROM mr_app_notification), 1));
    END IF;
END $$;

-- 8. mr_audit_log
CREATE TABLE IF NOT EXISTS mr_audit_log (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(255),
    performed_by VARCHAR(255),
    performed_by_role VARCHAR(255),
    form_id BIGINT,
    timestamp TIMESTAMP,
    message VARCHAR(1000)
);

-- Copy existing audit_log if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        INSERT INTO mr_audit_log (id, event_type, performed_by, performed_by_role, form_id, timestamp, message)
        SELECT id, event_type, performed_by, performed_by_role, form_id, timestamp, message
        FROM audit_log
        ON CONFLICT (id) DO NOTHING;
        PERFORM setval('mr_audit_log_id_seq', COALESCE((SELECT MAX(id) FROM mr_audit_log), 1));
    END IF;
END $$;

-- 9. mr_auto_accept_settings
CREATE TABLE IF NOT EXISTS mr_auto_accept_settings (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    department VARCHAR(50),
    year VARCHAR(20),
    reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_username ON mr_auto_accept_settings(username);
CREATE INDEX IF NOT EXISTS idx_enabled_dates ON mr_auto_accept_settings(enabled, from_date, to_date);

-- Copy existing auto_accept_settings if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auto_accept_settings') THEN
        INSERT INTO mr_auto_accept_settings (id, username, role, enabled, from_date, to_date, department, year, reason, created_at)
        SELECT id, username, role, enabled, from_date, to_date, department, year, reason, created_at
        FROM auto_accept_settings
        ON CONFLICT (id) DO NOTHING;
        PERFORM setval('mr_auto_accept_settings_id_seq', COALESCE((SELECT MAX(id) FROM mr_auto_accept_settings), 1));
    END IF;
END $$;

-- 10. mr_fcm_tokens
CREATE TABLE IF NOT EXISTS mr_fcm_tokens (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    token TEXT NOT NULL UNIQUE,
    platform VARCHAR(50) DEFAULT 'web',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_username ON mr_fcm_tokens(username);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON mr_fcm_tokens(token);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_active ON mr_fcm_tokens(active);

-- Copy existing fcm_tokens if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fcm_tokens') THEN
        INSERT INTO mr_fcm_tokens (id, username, token, platform, active, created_at, updated_at)
        SELECT id, username, token, platform, active, created_at, updated_at
        FROM fcm_tokens
        ON CONFLICT (id) DO NOTHING;
        PERFORM setval('mr_fcm_tokens_id_seq', COALESCE((SELECT MAX(id) FROM mr_fcm_tokens), 1));
    END IF;
END $$;

-- 11. mr_notification_reminder_logs
CREATE TABLE IF NOT EXISTS mr_notification_reminder_logs (
    id BIGSERIAL PRIMARY KEY,
    recipient_username VARCHAR(255) NOT NULL,
    form_id BIGINT NOT NULL,
    last_reminder_sent_at TIMESTAMP NOT NULL,
    reminder_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing notification_reminder_logs if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_reminder_logs') THEN
        INSERT INTO mr_notification_reminder_logs (id, recipient_username, form_id, last_reminder_sent_at, reminder_count, created_at, updated_at)
        SELECT id, recipient_username, form_id, last_reminder_sent_at, reminder_count, created_at, updated_at
        FROM notification_reminder_logs
        ON CONFLICT (id) DO NOTHING;
        PERFORM setval('mr_notification_reminder_logs_id_seq', COALESCE((SELECT MAX(id) FROM mr_notification_reminder_logs), 1));
    END IF;
END $$;

-- 12. mr_push_subscriptions
CREATE TABLE IF NOT EXISTS mr_push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    subscriptions_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing push_subscriptions if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions') THEN
        INSERT INTO mr_push_subscriptions (id, username, subscriptions_json, created_at, updated_at)
        SELECT id, username, subscriptions_json, created_at, updated_at
        FROM push_subscriptions
        ON CONFLICT (id) DO NOTHING;
        PERFORM setval('mr_push_subscriptions_id_seq', COALESCE((SELECT MAX(id) FROM mr_push_subscriptions), 1));
    END IF;
END $$;

-- 13. mr_queued_notifications
CREATE TABLE IF NOT EXISTS mr_queued_notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_username VARCHAR(255) NOT NULL,
    notification_type VARCHAR(255) NOT NULL,
    reference_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMP
);

-- Copy existing queued_notifications if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'queued_notifications') THEN
        INSERT INTO mr_queued_notifications (id, recipient_username, notification_type, reference_id, created_at, processed, processed_at)
        SELECT id, recipient_username, notification_type, reference_id, created_at, processed, processed_at
        FROM queued_notifications
        ON CONFLICT (id) DO NOTHING;
        PERFORM setval('mr_queued_notifications_id_seq', COALESCE((SELECT MAX(id) FROM mr_queued_notifications), 1));
    END IF;
END $$;

-- 14. mr_staff_users
CREATE TABLE IF NOT EXISTS mr_staff_users (
    user_id BIGSERIAL PRIMARY KEY,
    role VARCHAR(20) NOT NULL,
    user_name VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    gmail VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    year INT,
    phone_no VARCHAR(15)
);

-- Copy existing staff_users if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_users') THEN
        INSERT INTO mr_staff_users (user_id, role, user_name, password, gmail, gender, year, phone_no)
        SELECT user_id, role, user_name, password, gmail, gender, year, phone_no
        FROM staff_users
        ON CONFLICT (user_id) DO NOTHING;
        PERFORM setval('mr_staff_users_user_id_seq', COALESCE((SELECT MAX(user_id) FROM mr_staff_users), 1));
    END IF;
END $$;

-- 15. mr_system_settings
CREATE TABLE IF NOT EXISTS mr_system_settings (
    setting_key VARCHAR(255) PRIMARY KEY,
    setting_value TEXT
);

-- Copy existing system_settings if legacy table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
        INSERT INTO mr_system_settings (setting_key, setting_value)
        SELECT setting_key, setting_value
        FROM system_settings
        ON CONFLICT (setting_key) DO NOTHING;
    END IF;
END $$;

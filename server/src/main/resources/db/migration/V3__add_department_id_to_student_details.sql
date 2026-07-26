-- Migration: Safe addition of department_id to student_details table
-- Handles existing rows containing NULL values without violating NOT NULL constraint

-- 1. Ensure departments table exists
CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    department_code VARCHAR(50) NOT NULL UNIQUE,
    department_name VARCHAR(150) NOT NULL UNIQUE,
    short_name VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 2. Seed default department if empty
INSERT INTO departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'CSE', 'Computer Science and Engineering', 'CSE', 1, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'CSE');

-- 3. Add department_id as NULLABLE first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'student_details' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE student_details ADD COLUMN department_id BIGINT;
    END IF;
END $$;

-- 4. Fill NULL values for existing student_details records with default department ID
UPDATE student_details
SET department_id = (SELECT id FROM departments ORDER BY id ASC LIMIT 1)
WHERE department_id IS NULL;

-- 5. Add NOT NULL constraint
ALTER TABLE student_details ALTER COLUMN department_id SET NOT NULL;

-- 6. Add Foreign Key constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_student_details_department'
    ) THEN
        ALTER TABLE student_details 
        ADD CONSTRAINT fk_student_details_department 
        FOREIGN KEY (department_id) REFERENCES departments(id);
    END IF;
END $$;

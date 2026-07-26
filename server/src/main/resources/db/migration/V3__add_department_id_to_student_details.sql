-- Migration V3: Department Master Migration
-- Preserves existing student_details.department string column for backward compatibility

-- 1. Create departments table first
CREATE TABLE IF NOT EXISTS departments (
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
INSERT INTO departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'CSE', 'Computer Science and Engineering', 'CSE', 1, true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'CSE');

INSERT INTO departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'ECE', 'Electronics and Communication Engineering', 'ECE', 2, true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'ECE');

INSERT INTO departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'EEE', 'Electrical and Electronics Engineering', 'EEE', 3, true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'EEE');

INSERT INTO departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'MECH', 'Mechanical Engineering', 'MECH', 4, true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'MECH');

INSERT INTO departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'CIVIL', 'Civil Engineering', 'CIVIL', 5, true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'CIVIL');

INSERT INTO departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
SELECT 'MECHATRONICS', 'Mechatronics Engineering', 'MECHATRONICS', 6, true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM departments WHERE department_code = 'MECHATRONICS');

-- 2. Insert unique department values from existing student_details.department into departments
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'student_details' AND column_name = 'department'
    ) THEN
        INSERT INTO departments (department_code, department_name, short_name, display_order, is_active, created_at, updated_at)
        SELECT DISTINCT 
            UPPER(TRIM(sd.department)), 
            TRIM(sd.department), 
            UPPER(TRIM(sd.department)), 
            99, 
            true, 
            NOW(), 
            NOW()
        FROM student_details sd
        WHERE sd.department IS NOT NULL AND TRIM(sd.department) <> ''
          AND NOT EXISTS (
              SELECT 1 FROM departments d 
              WHERE LOWER(d.department_code) = LOWER(TRIM(sd.department))
                 OR LOWER(d.department_name) = LOWER(TRIM(sd.department))
                 OR LOWER(d.short_name) = LOWER(TRIM(sd.department))
          );
    END IF;
END $$;

-- 3. Add department_id column as NULLABLE initially
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

-- 4. Populate department_id for every existing student by matching student_details.department with departments
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'student_details' AND column_name = 'department'
    ) THEN
        UPDATE student_details sd
        SET department_id = d.id
        FROM departments d
        WHERE sd.department_id IS NULL 
          AND sd.department IS NOT NULL
          AND (
              LOWER(TRIM(sd.department)) = LOWER(d.department_code)
              OR LOWER(TRIM(sd.department)) = LOWER(d.department_name)
              OR LOWER(TRIM(sd.department)) = LOWER(d.short_name)
          );
    END IF;
END $$;

-- 5. Fallback verification: ensure no student has NULL department_id
UPDATE student_details
SET department_id = (SELECT id FROM departments ORDER BY id ASC LIMIT 1)
WHERE department_id IS NULL;

-- 6. Apply NOT NULL constraint after all rows are updated
ALTER TABLE student_details ALTER COLUMN department_id SET NOT NULL;

-- 7. Add Foreign Key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_student_department'
    ) THEN
        ALTER TABLE student_details 
        ADD CONSTRAINT fk_student_department 
        FOREIGN KEY (department_id) REFERENCES departments(id);
    END IF;
END $$;

-- NOTE: Legacy string column 'department' is retained for migration compatibility.

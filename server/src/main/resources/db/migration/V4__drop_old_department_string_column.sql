-- Migration V4: Cleanup obsolete 'department' string column from student_details
-- Executed after confirming application stability with Department entity relationship

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'student_details' AND column_name = 'department'
    ) THEN
        ALTER TABLE student_details DROP COLUMN department;
    END IF;
END $$;

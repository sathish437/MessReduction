-- Migration: add assigned_deputy_warden column to reduction_form
-- Adds column as nullable to avoid failing on existing rows
ALTER TABLE IF EXISTS reduction_form
    ADD COLUMN IF NOT EXISTS assigned_deputy_warden VARCHAR(255);

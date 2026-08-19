-- Add missing columns to the users table for Staff Approval tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS staff_photo TEXT,
ADD COLUMN IF NOT EXISTS machines_photo TEXT,
ADD COLUMN IF NOT EXISTS utilities_photo TEXT,
ADD COLUMN IF NOT EXISTS location_details TEXT;

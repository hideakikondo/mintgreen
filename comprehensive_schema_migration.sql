
SELECT 'Before migration - Current table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'voters' 
ORDER BY ordinal_position;

SELECT 'Before migration - Current constraints:' as info;
SELECT conname, contype, confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE conrelid = 'voters'::regclass;

SELECT 'Before migration - Current RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'voters';

ALTER TABLE voters DROP CONSTRAINT IF EXISTS voters_voter_id_fkey;

ALTER TABLE voters DROP CONSTRAINT IF EXISTS voters_identification_number_key;
ALTER TABLE voters DROP CONSTRAINT IF EXISTS voters_name_key;
ALTER TABLE voters DROP COLUMN IF EXISTS identification_number;
ALTER TABLE voters DROP COLUMN IF EXISTS name;
ALTER TABLE voters DROP COLUMN IF EXISTS address;
ALTER TABLE voters DROP COLUMN IF EXISTS date_of_birth;

ALTER TABLE voters ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT '';
ALTER TABLE voters ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';

ALTER TABLE voters 
ALTER COLUMN voter_id SET DEFAULT gen_random_uuid();

DROP POLICY IF EXISTS "Users can insert their own voter record" ON voters;
DROP POLICY IF EXISTS "Users can view their own voter record" ON voters;
DROP POLICY IF EXISTS "Users can update their own voter record" ON voters;
DROP POLICY IF EXISTS "Allow anonymous voter registration" ON voters;
DROP POLICY IF EXISTS "Allow authenticated voter registration" ON voters;
DROP POLICY IF EXISTS "Allow voter lookup for authentication" ON voters;

CREATE POLICY "Allow anonymous voter registration" ON voters
    FOR INSERT 
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow authenticated voter registration" ON voters
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow voter lookup for authentication" ON voters
    FOR SELECT
    TO anon, authenticated
    USING (true);

ALTER TABLE voters ENABLE ROW LEVEL SECURITY;

SELECT 'After migration - Updated table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'voters' 
ORDER BY ordinal_position;

SELECT 'After migration - Updated constraints:' as info;
SELECT conname, contype, confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE conrelid = 'voters'::regclass;

SELECT 'After migration - Updated RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'voters';

SELECT 'Testing new schema - Inserting test record:' as info;
INSERT INTO voters (display_name, password, is_eligible) 
VALUES ('TestMigration', 'TestPassword123!', true);

SELECT 'Verification - Test record created:' as info;
SELECT voter_id, display_name, is_eligible, length(password) as password_length
FROM voters 
WHERE display_name = 'TestMigration';

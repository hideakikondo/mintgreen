
SELECT 'Before changes - Current RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'voters';

SELECT 'Before changes - Table structure:' as info;
\d voters;

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

SELECT 'After changes - Updated RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'voters';

SELECT 'After changes - Updated table structure:' as info;
\d voters;

SELECT 'Testing voter registration:' as info;
INSERT INTO voters (display_name, password, is_eligible) 
VALUES ('TestUser', 'TestPassword123!', true);

SELECT 'Verification - New voter record:' as info;
SELECT voter_id, display_name, is_eligible, length(password) as password_length
FROM voters 
WHERE display_name = 'TestUser';

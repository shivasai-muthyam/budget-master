-- -------------------------------------------------
-- Diagnostic Check for Database Issues
-- -------------------------------------------------

-- 1️⃣ Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('expenses', 'categories');

-- 2️⃣ Check if functions exist
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('set_expense_user', 'set_category_user');

-- 3️⃣ Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('expenses', 'categories');

-- 4️⃣ Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'expenses'
ORDER BY ordinal_position;

-- 5️⃣ Check if there are any categories
SELECT COUNT(*) as category_count FROM public.categories;

-- 6️⃣ Check if there are any users
SELECT COUNT(*) as user_count FROM public.users;

-- 7️⃣ Check current user authentication (this will show your user info)
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email = current_setting('request.jwt.claims', true)::json->>'email';

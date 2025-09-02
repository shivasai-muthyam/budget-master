-- -------------------------------------------------
-- Fix for Expenses Table - Auto-set user_id
-- -------------------------------------------------
-- This fixes the issue where expenses aren't being inserted due to RLS policies

-- 1️⃣ Drop the existing trigger and function first
DROP TRIGGER IF EXISTS set_user_on_expense ON public.expenses;
DROP FUNCTION IF EXISTS public.set_expense_user();

-- 2️⃣ Create an improved trigger function
CREATE OR REPLACE FUNCTION public.set_expense_user()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current authenticated user ID
    current_user_id := auth.uid();
    
    -- If no authenticated user, raise an error
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found. Please log in first.';
    END IF;
    
    -- Always set the user_id to the current authenticated user
    NEW.user_id := current_user_id;
    
    -- Log the operation for debugging
    RAISE NOTICE 'Setting user_id to % for expense insert', current_user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3️⃣ Attach the trigger to public.expenses
CREATE TRIGGER set_user_on_expense
    BEFORE INSERT ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.set_expense_user();

-- 4️⃣ Update the RLS policies to be more permissive
DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
CREATE POLICY "Users can insert own expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 5️⃣ Also fix the categories table to auto-set user_id
DROP TRIGGER IF EXISTS set_user_on_category ON public.categories;
DROP FUNCTION IF EXISTS public.set_category_user();

CREATE OR REPLACE FUNCTION public.set_category_user()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found. Please log in first.';
    END IF;
    
    NEW.user_id := current_user_id;
    RAISE NOTICE 'Setting user_id to % for category insert', current_user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_user_on_category
    BEFORE INSERT ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.set_category_user();

-- 6️⃣ Test the trigger (this will fail in SQL editor but work in the app)
-- INSERT INTO public.expenses (category_id, amount, description, date)
-- VALUES (
--   (SELECT id FROM public.categories LIMIT 1),
--   25.50,
--   'Test expense from trigger',
--   CURRENT_DATE
-- );

-- -------------------------------------------------
-- ✅ Trigger Fix Complete!
-- -------------------------------------------------
-- Now the app will automatically set user_id when inserting expenses
-- The trigger will work when called from the authenticated web app
-- Manual SQL inserts will fail (as expected) since there's no auth context

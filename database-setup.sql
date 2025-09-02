-- -------------------------------------------------
-- BudgetMaster Database Setup for Supabase
-- -------------------------------------------------

-- 1️⃣  Enable RLS on the tables you own
-- (auth.users already has RLS – no need to touch it)

-- -------------------------------------------------
-- 2️⃣  Create a public profile table linked to Supabase Auth
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS policies for the public.users table
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- -------------------------------------------------
-- 3️⃣  Budgets table
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    total_budget NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, month)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets"
    ON public.budgets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
    ON public.budgets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
    ON public.budgets FOR DELETE
    USING (auth.uid() = user_id);

-- -------------------------------------------------
-- 4️⃣  Categories table
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    allocated_budget NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, category_name)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
    ON public.categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- -------------------------------------------------
-- 5️⃣  Expenses table
-- -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
    ON public.expenses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
    ON public.expenses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
    ON public.expenses FOR DELETE
    USING (auth.uid() = user_id);

-- -------------------------------------------------
-- 6️⃣  Indexes for performance
-- -------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_expenses_user_id      ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date        ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_categories_user_id   ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id      ON public.budgets(user_id);

-- -------------------------------------------------
-- 7️⃣  Auto‑create a profile row when a new auth user signs up
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------
-- 8️⃣  Permissions for the authenticated role
-- -------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses   TO authenticated;

-- -------------------------------------------------
-- 9️⃣  Auto-set user_id for expenses (RLS fix)
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_expense_user()
RETURNS TRIGGER AS $$
BEGIN
  -- If the client omitted user_id, set it to the current auth user
  IF NEW.user_id IS NULL THEN
    NEW.user_id := (SELECT auth.uid());
  END IF;

  -- Enforce that the supplied user_id matches auth.uid()
  IF NEW.user_id <> (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'user_id does not match authenticated user';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to public.expenses
DROP TRIGGER IF EXISTS set_user_on_expense ON public.expenses;
CREATE TRIGGER set_user_on_expense
    BEFORE INSERT ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.set_expense_user();

-- -------------------------------------------------
-- 🔟  Insert some default categories for testing
-- -------------------------------------------------
-- Note: These will be created per user when they sign up, but you can add some here for testing
-- INSERT INTO public.categories (user_id, category_name, allocated_budget) VALUES 
-- ('00000000-0000-0000-0000-000000000000', 'Food 🍔', 0),
-- ('00000000-0000-0000-0000-000000000000', 'Shopping 🛍️', 0),
-- ('00000000-0000-0000-0000-000000000000', 'Bills 💡', 0),
-- ('00000000-0000-0000-0000-000000000000', 'Transportation 🚗', 0),
-- ('00000000-0000-0000-0000-000000000000', 'Entertainment 🎬', 0);

-- -------------------------------------------------
-- ✅ Setup Complete!
-- -------------------------------------------------
-- Your database is now ready for the BudgetMaster application.
-- The tables will be automatically populated when users sign up and start using the app.

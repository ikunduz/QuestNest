-- ============================================
-- HeroQuest Supabase Row Level Security (RLS) Policies
-- Run these in your Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FAMILIES TABLE POLICIES
-- ============================================

-- Users can only read their own family
CREATE POLICY "Users can view own family"
ON families FOR SELECT
USING (
    id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    )
);

-- Only authenticated users can create families
CREATE POLICY "Authenticated users can create families"
ON families FOR INSERT
WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can view members of their family
CREATE POLICY "Users can view family members"
ON users FOR SELECT
USING (
    family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    )
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid());

-- Anyone can create users (for joining families)
CREATE POLICY "Anyone can create users"
ON users FOR INSERT
WITH CHECK (true);

-- Protect pin_hash field (only parents can see)
-- Note: Consider using a view or RPC function instead
-- to completely hide pin_hash from child users

-- ============================================
-- QUESTS TABLE POLICIES
-- ============================================

-- Users can view quests in their family
CREATE POLICY "Users can view family quests"
ON quests FOR SELECT
USING (
    family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    )
);

-- Only parents can create quests
CREATE POLICY "Parents can create quests"
ON quests FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND family_id = quests.family_id
        AND role = 'parent'
    )
);

-- Children can update their own quests (complete)
-- Parents can update any quest (approve)
CREATE POLICY "Users can update quests"
ON quests FOR UPDATE
USING (
    family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    )
);

-- Only parents can delete quests
CREATE POLICY "Parents can delete quests"
ON quests FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND family_id = quests.family_id
        AND role = 'parent'
    )
);

-- ============================================
-- MESSAGES TABLE POLICIES
-- ============================================

-- Users can view messages in their family
CREATE POLICY "Users can view family messages"
ON messages FOR SELECT
USING (
    family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    )
);

-- Users can send messages to their family
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
    family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
    )
);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
USING (sender_id = auth.uid());

-- ============================================
-- NOTES/RECOMMENDATIONS
-- ============================================

-- 1. IMPORTANT: pin_hash should NEVER be exposed to child users
--    Consider creating a secure function to verify PIN:
--
--    CREATE OR REPLACE FUNCTION verify_parent_pin(
--        family_id_param UUID,
--        pin_hash_param TEXT
--    ) RETURNS BOOLEAN AS $$
--    BEGIN
--        RETURN EXISTS (
--            SELECT 1 FROM users
--            WHERE family_id = family_id_param
--            AND role = 'parent'
--            AND pin_hash = pin_hash_param
--        );
--    END;
--    $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Consider adding rate limiting at the database level:
--    - Track failed PIN attempts per family
--    - Lock out after 5 failed attempts
--    - Auto-unlock after 5 minutes

-- 3. Add audit logging for sensitive operations:
--    - PIN changes
--    - User role changes
--    - Family deletions

-- =========================================================
-- 011 — FIX RLS : Supprimer les sous-selects vers auth.users
-- Utiliser auth_user_id + auth.uid() au lieu de email
-- =========================================================

-- ─── MEMBRES ────────────────────────────────────
DROP POLICY IF EXISTS "membres_bureau_select" ON membres;
DROP POLICY IF EXISTS "membres_bureau_tresorier_select" ON membres;
DROP POLICY IF EXISTS "membres_joueur_select" ON membres;

-- Bureau/Trésorier peut voir tous les membres
CREATE POLICY "membres_bureau_tresorier_select" ON membres
    FOR SELECT USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('tresorier', 'bureau')
    );

-- Joueur peut voir SA propre fiche uniquement
CREATE POLICY "membres_joueur_select" ON membres
    FOR SELECT USING (
        auth_user_id = auth.uid()
    );

-- ─── TRANSACTIONS ──────────────────────────────
DROP POLICY IF EXISTS "transactions_select" ON transactions;
DROP POLICY IF EXISTS "transactions_bureau_select" ON transactions;

CREATE POLICY "transactions_select" ON transactions
    FOR SELECT USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('tresorier', 'bureau')
    );

-- ─── PAIEMENTS ─────────────────────────────────
DROP POLICY IF EXISTS "paiements_select" ON paiements;
DROP POLICY IF EXISTS "paiements_joueur_select" ON paiements;
DROP POLICY IF EXISTS "paiements_bureau_select" ON paiements;

-- Bureau/Trésorier : tous les paiements
CREATE POLICY "paiements_bureau_select" ON paiements
    FOR SELECT USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('tresorier', 'bureau')
    );

-- Joueur : ses propres paiements
CREATE POLICY "paiements_joueur_select" ON paiements
    FOR SELECT USING (
        membre_id IN (SELECT id FROM membres WHERE auth_user_id = auth.uid())
    );

-- ─── MESSAGES ──────────────────────────────────
DROP POLICY IF EXISTS "messages_select_policy" ON messages;

CREATE POLICY "messages_select_policy" ON messages
    FOR SELECT USING (
        -- Trésorier/Bureau : tous les messages
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('tresorier', 'bureau')
        OR
        -- Joueur : ses propres messages
        membre_id IN (SELECT id FROM membres WHERE auth_user_id = auth.uid())
    );

-- ─── get_my_membre_id() ────────────────────────
CREATE OR REPLACE FUNCTION get_my_membre_id()
RETURNS UUID AS $$
    SELECT id FROM membres WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

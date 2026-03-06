-- =============================================
-- SÉCURISATION DES POLITIQUES RLS
-- Panthères de Fès – Dashboard Financier
-- À exécuter dans Supabase SQL Editor
-- =============================================
-- STRATÉGIE :
--   Trésorier  → accès complet (SELECT / INSERT / UPDATE / DELETE)
--   Bureau     → lecture seule sur toutes les tables
--   Joueur     → lecture de ses propres données uniquement (membres + paiements)
--
-- On identifie le rôle via auth.jwt()->'user_metadata'->>'role'
-- On identifie un joueur via membres.auth_user_id = auth.uid()
--
-- NOTE : on utilise auth.jwt() (pas de SELECT sur membres) pour éviter
--        la récursion infinie sur la table "membres".
-- =============================================

-- ============================================================
-- HELPER : fonction sécurisée pour lire le rôle dans le JWT
--          sans requête récursive sur "membres"
-- ============================================================
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    auth.jwt()->'user_metadata'->>'role',
    'joueur'
  );
$$;

-- ============================================================
-- TABLE : membres
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users full access" ON membres;
DROP POLICY IF EXISTS "membres_tresorier_all"           ON membres;
DROP POLICY IF EXISTS "membres_bureau_select"           ON membres;
DROP POLICY IF EXISTS "membres_joueur_self"             ON membres;

-- Trésorier : accès complet
CREATE POLICY "membres_tresorier_all" ON membres
  FOR ALL TO authenticated
  USING     (auth_role() = 'tresorier')
  WITH CHECK(auth_role() = 'tresorier');

-- Bureau : lecture seule
CREATE POLICY "membres_bureau_select" ON membres
  FOR SELECT TO authenticated
  USING (auth_role() = 'bureau');

-- Joueur : lecture de sa propre fiche uniquement
CREATE POLICY "membres_joueur_self" ON membres
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'joueur'
    AND auth_user_id = auth.uid()
  );

-- ============================================================
-- TABLE : paiements
-- ============================================================
DROP POLICY IF EXISTS "Authenticated access paiements"  ON paiements;
DROP POLICY IF EXISTS "paiements_tresorier_all"          ON paiements;
DROP POLICY IF EXISTS "paiements_bureau_select"          ON paiements;
DROP POLICY IF EXISTS "paiements_joueur_self"            ON paiements;

-- Trésorier : accès complet
CREATE POLICY "paiements_tresorier_all" ON paiements
  FOR ALL TO authenticated
  USING     (auth_role() = 'tresorier')
  WITH CHECK(auth_role() = 'tresorier');

-- Bureau : lecture seule
CREATE POLICY "paiements_bureau_select" ON paiements
  FOR SELECT TO authenticated
  USING (auth_role() = 'bureau');

-- Joueur : lecture de ses propres paiements uniquement
CREATE POLICY "paiements_joueur_self" ON paiements
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'joueur'
    AND membre_id IN (
      SELECT id FROM membres WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- TABLE : transactions  (finances du club → pas visible aux joueurs)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated access transactions" ON transactions;
DROP POLICY IF EXISTS "transactions_tresorier_all"        ON transactions;
DROP POLICY IF EXISTS "transactions_bureau_select"        ON transactions;

-- Trésorier : accès complet
CREATE POLICY "transactions_tresorier_all" ON transactions
  FOR ALL TO authenticated
  USING     (auth_role() = 'tresorier')
  WITH CHECK(auth_role() = 'tresorier');

-- Bureau : lecture seule
CREATE POLICY "transactions_bureau_select" ON transactions
  FOR SELECT TO authenticated
  USING (auth_role() = 'bureau');

-- Joueurs : aucun accès (pas de policy → implicitement bloqué)

-- ============================================================
-- TABLE : budget  (finances du club → pas visible aux joueurs)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated access budget" ON budget;
DROP POLICY IF EXISTS "budget_tresorier_all"         ON budget;
DROP POLICY IF EXISTS "budget_bureau_select"          ON budget;

-- Trésorier : accès complet
CREATE POLICY "budget_tresorier_all" ON budget
  FOR ALL TO authenticated
  USING     (auth_role() = 'tresorier')
  WITH CHECK(auth_role() = 'tresorier');

-- Bureau : lecture seule
CREATE POLICY "budget_bureau_select" ON budget
  FOR SELECT TO authenticated
  USING (auth_role() = 'bureau');

-- ============================================================
-- TABLE : parametres  (config globale → Trésorier seulement)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated access parametres" ON parametres;
DROP POLICY IF EXISTS "parametres_tresorier_all"         ON parametres;
DROP POLICY IF EXISTS "parametres_bureau_select"          ON parametres;

-- Trésorier : accès complet
CREATE POLICY "parametres_tresorier_all" ON parametres
  FOR ALL TO authenticated
  USING     (auth_role() = 'tresorier')
  WITH CHECK(auth_role() = 'tresorier');

-- Bureau : lecture seule (montants, période, etc.)
CREATE POLICY "parametres_bureau_select" ON parametres
  FOR SELECT TO authenticated
  USING (auth_role() IN ('bureau', 'tresorier'));

-- ============================================================
-- TABLE : notifications_log  (interne – Trésorier uniquement)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated access notifications_log" ON notifications_log;
DROP POLICY IF EXISTS "notif_log_tresorier_all"                 ON notifications_log;

CREATE POLICY "notif_log_tresorier_all" ON notifications_log
  FOR ALL TO authenticated
  USING     (auth_role() = 'tresorier')
  WITH CHECK(auth_role() = 'tresorier');

-- ============================================================
-- TABLE : audit_log  (interne – Trésorier uniquement)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated access audit_log" ON audit_log;
DROP POLICY IF EXISTS "audit_log_tresorier_all"         ON audit_log;

CREATE POLICY "audit_log_tresorier_all" ON audit_log
  FOR ALL TO authenticated
  USING     (auth_role() = 'tresorier')
  WITH CHECK(auth_role() = 'tresorier');

-- ============================================================
-- VÉRIFICATION
-- ============================================================
-- Exécuter après pour voir les politiques en vigueur :
-- SELECT schemaname, tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

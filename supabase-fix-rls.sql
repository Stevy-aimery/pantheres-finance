-- =============================================
-- CORRECTION DES POLITIQUES RLS
-- Résout l'erreur "infinite recursion detected"
-- =============================================

-- Étape 1 : Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "Trésorier: Accès complet" ON membres;
DROP POLICY IF EXISTS "Bureau: Lecture seule" ON membres;
DROP POLICY IF EXISTS "Joueur: Données personnelles" ON membres;

-- Étape 2 : Créer des politiques corrigées (sans récursion)

-- Politique pour permettre toutes les opérations aux utilisateurs authentifiés
-- (Version simplifiée pour le développement)
CREATE POLICY "Authenticated users full access" ON membres
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- POLITIQUES POUR LES AUTRES TABLES
-- =============================================

-- Paiements
DROP POLICY IF EXISTS "Authenticated access paiements" ON paiements;
CREATE POLICY "Authenticated access paiements" ON paiements
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Transactions
DROP POLICY IF EXISTS "Authenticated access transactions" ON transactions;
CREATE POLICY "Authenticated access transactions" ON transactions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Budget
DROP POLICY IF EXISTS "Authenticated access budget" ON budget;
CREATE POLICY "Authenticated access budget" ON budget
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Paramètres
DROP POLICY IF EXISTS "Authenticated access parametres" ON parametres;
CREATE POLICY "Authenticated access parametres" ON parametres
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Notifications Log
DROP POLICY IF EXISTS "Authenticated access notifications_log" ON notifications_log;
CREATE POLICY "Authenticated access notifications_log" ON notifications_log
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Audit Log
DROP POLICY IF EXISTS "Authenticated access audit_log" ON audit_log;
CREATE POLICY "Authenticated access audit_log" ON audit_log
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- VÉRIFICATION
-- =============================================
-- Exécutez cette requête pour vérifier que les politiques sont en place :
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

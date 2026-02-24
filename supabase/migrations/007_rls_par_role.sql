-- =============================================
-- MIGRATION 007 : Politiques RLS strictes par rôle
-- Remplace les politiques USING(true) par des contrôles par rôle
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- ─────────────────────────────────────────────
-- FONCTIONS HELPER (éviter la répétition)
-- ─────────────────────────────────────────────

-- Fonction : vérifier si l'utilisateur est trésorier
CREATE OR REPLACE FUNCTION is_tresorier()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'tresorier'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction : vérifier si l'utilisateur est bureau
CREATE OR REPLACE FUNCTION is_bureau()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'bureau'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction : récupérer le membre_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_my_membre_id()
RETURNS UUID AS $$
DECLARE
  _membre_id UUID;
BEGIN
  SELECT id INTO _membre_id
  FROM membres
  WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid());
  RETURN _membre_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ═══════════════════════════════════════════════
-- TABLE : membres
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated users full access" ON membres;
DROP POLICY IF EXISTS "Trésorier: Accès complet" ON membres;
DROP POLICY IF EXISTS "Bureau: Lecture seule" ON membres;
DROP POLICY IF EXISTS "Joueur: Données personnelles" ON membres;

-- Trésorier : CRUD complet
CREATE POLICY "membres_tresorier_all" ON membres
  FOR ALL TO authenticated
  USING (is_tresorier())
  WITH CHECK (is_tresorier());

-- Bureau : Lecture seule
CREATE POLICY "membres_bureau_select" ON membres
  FOR SELECT TO authenticated
  USING (is_bureau());

-- Joueur : Lecture de ses propres données uniquement
CREATE POLICY "membres_joueur_select" ON membres
  FOR SELECT TO authenticated
  USING (
    NOT is_tresorier()
    AND NOT is_bureau()
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );


-- ═══════════════════════════════════════════════
-- TABLE : transactions
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated access transactions" ON transactions;

-- Trésorier : CRUD complet
CREATE POLICY "transactions_tresorier_all" ON transactions
  FOR ALL TO authenticated
  USING (is_tresorier())
  WITH CHECK (is_tresorier());

-- Bureau : Lecture seule
CREATE POLICY "transactions_bureau_select" ON transactions
  FOR SELECT TO authenticated
  USING (is_bureau());

-- Joueur : Aucun accès (pas de politique = pas d'accès)


-- ═══════════════════════════════════════════════
-- TABLE : paiements
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated access paiements" ON paiements;

-- Trésorier : CRUD complet
CREATE POLICY "paiements_tresorier_all" ON paiements
  FOR ALL TO authenticated
  USING (is_tresorier())
  WITH CHECK (is_tresorier());

-- Bureau : Lecture seule
CREATE POLICY "paiements_bureau_select" ON paiements
  FOR SELECT TO authenticated
  USING (is_bureau());

-- Joueur : Lecture de ses propres paiements uniquement
CREATE POLICY "paiements_joueur_select" ON paiements
  FOR SELECT TO authenticated
  USING (
    NOT is_tresorier()
    AND NOT is_bureau()
    AND membre_id = get_my_membre_id()
  );


-- ═══════════════════════════════════════════════
-- TABLE : budget
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated access budget" ON budget;

-- Trésorier : CRUD complet
CREATE POLICY "budget_tresorier_all" ON budget
  FOR ALL TO authenticated
  USING (is_tresorier())
  WITH CHECK (is_tresorier());

-- Bureau : Lecture seule
CREATE POLICY "budget_bureau_select" ON budget
  FOR SELECT TO authenticated
  USING (is_bureau());

-- Joueur : Aucun accès


-- ═══════════════════════════════════════════════
-- TABLE : parametres
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated access parametres" ON parametres;

-- Trésorier uniquement : CRUD complet
CREATE POLICY "parametres_tresorier_all" ON parametres
  FOR ALL TO authenticated
  USING (is_tresorier())
  WITH CHECK (is_tresorier());

-- Bureau et Joueur : Aucun accès direct
-- (les paramètres sont lus via les triggers/fonctions SECURITY DEFINER)


-- ═══════════════════════════════════════════════
-- TABLE : notifications_log
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated access notifications_log" ON notifications_log;

-- Trésorier uniquement
CREATE POLICY "notifications_tresorier_all" ON notifications_log
  FOR ALL TO authenticated
  USING (is_tresorier())
  WITH CHECK (is_tresorier());


-- ═══════════════════════════════════════════════
-- TABLE : audit_log
-- ═══════════════════════════════════════════════
DROP POLICY IF EXISTS "Authenticated access audit_log" ON audit_log;

-- Trésorier : Lecture seule (les insertions se font via triggers SECURITY DEFINER)
CREATE POLICY "audit_tresorier_select" ON audit_log
  FOR SELECT TO authenticated
  USING (is_tresorier());


-- ═══════════════════════════════════════════════
-- TABLE : messages (FIX INSERT)
-- ═══════════════════════════════════════════════

-- Supprimer l'ancienne politique INSERT trop permissive
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;

-- Nouvelle politique INSERT :
-- Trésorier : peut insérer avec n'importe quel membre_id (pour répondre)
-- Autres : le membre_id DOIT correspondre à leur propre membre
CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Trésorier peut répondre à n'importe qui
    is_tresorier()
    OR
    -- Autres : membre_id doit être le leur
    membre_id = get_my_membre_id()
  );


-- ═══════════════════════════════════════════════
-- FIX : Trigger calculer_cotisation doit être SECURITY DEFINER
-- (Il accède à la table parametres, qui est maintenant restreinte)
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION calculer_cotisation()
RETURNS TRIGGER AS $$
DECLARE
  montant_joueur DECIMAL(10,2);
  montant_bureau DECIMAL(10,2);
BEGIN
  SELECT CAST(valeur AS DECIMAL) INTO montant_joueur FROM parametres WHERE cle = 'montant_joueur';
  SELECT CAST(valeur AS DECIMAL) INTO montant_bureau FROM parametres WHERE cle = 'montant_bureau';

  IF NEW.role_bureau = TRUE THEN
    NEW.cotisation_mensuelle := montant_bureau;
  ELSIF NEW.role_joueur = TRUE THEN
    NEW.cotisation_mensuelle := montant_joueur;
  ELSE
    NEW.cotisation_mensuelle := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════
-- Exécuter pour vérifier les politiques :
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- =============================================
-- MIGRATION 010 : FK auth_user_id dans membres
-- Ajoute un lien direct Auth ↔ Membres via UUID
-- Remplace le lien fragile par email
-- À exécuter dans Supabase SQL Editor
-- =============================================


-- ───── 1. Ajouter la colonne ─────

ALTER TABLE membres
ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- Index pour les lookups rapides
CREATE INDEX IF NOT EXISTS idx_membres_auth_user_id ON membres(auth_user_id);


-- ───── 2. Peupler avec les comptes Auth existants ─────
-- Lie chaque membre à son compte Auth en matchant par email (LOWER pour éviter les problèmes de casse)

UPDATE membres m
SET auth_user_id = au.id
FROM auth.users au
WHERE LOWER(m.email) = LOWER(au.email)
  AND m.auth_user_id IS NULL;


-- ───── 3. Mettre à jour get_my_membre_id() ─────
-- Utilise auth_user_id au lieu du sous-select par email
-- Fallback sur email si auth_user_id n'est pas encore rempli

CREATE OR REPLACE FUNCTION get_my_membre_id()
RETURNS UUID AS $$
DECLARE
  _membre_id UUID;
BEGIN
  -- D'abord chercher par auth_user_id (lien direct, plus fiable)
  SELECT id INTO _membre_id
  FROM membres
  WHERE auth_user_id = auth.uid();

  -- Fallback : chercher par email si auth_user_id pas encore peuplé
  IF _membre_id IS NULL THEN
    SELECT id INTO _membre_id
    FROM membres
    WHERE LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()));
  END IF;

  RETURN _membre_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ───── 4. Mettre à jour la RLS joueur sur membres ─────
-- Utilise auth_user_id au lieu de email pour la vérification

DROP POLICY IF EXISTS "membres_joueur_select" ON membres;

CREATE POLICY "membres_joueur_select" ON membres
  FOR SELECT TO authenticated
  USING (
    NOT is_tresorier()
    AND NOT is_bureau()
    AND (
      auth_user_id = auth.uid()
      OR (auth_user_id IS NULL AND LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid())))
    )
  );


-- ───── 5. Vérification ─────
-- Exécuter pour vérifier le peuplement :
-- SELECT id, nom_prenom, email, auth_user_id FROM membres ORDER BY nom_prenom;
-- Les membres avec auth_user_id = NULL n'ont pas de compte Auth correspondant

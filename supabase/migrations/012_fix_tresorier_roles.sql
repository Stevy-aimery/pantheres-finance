-- =========================================================
-- 012 — Mettre à jour les user_metadata des comptes existants
-- Ajouter le tableau roles[] manquant
-- =========================================================
-- À exécuter dans Supabase SQL Editor

-- 1. Trésorier : a tous les rôles
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"roles": ["tresorier", "bureau", "joueur"]}'::jsonb
WHERE id = '8f1b569d-cb4c-4516-9216-6f027c31cc20';

-- 2. Membre du bureau : rôles bureau + joueur
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"roles": ["bureau", "joueur"]}'::jsonb
WHERE email = 'bureau@pantheres.com';

-- Vérifier les mises à jour
SELECT id, email, raw_user_meta_data->>'role' as role, raw_user_meta_data->'roles' as roles
FROM auth.users
WHERE email IN ('stevykabalera@gmail.com', 'bureau@pantheres.com');

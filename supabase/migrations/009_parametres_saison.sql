-- =============================================
-- MIGRATION 009 : Paramètres de saison
-- Ajoute les dates de saison dans la table parametres
-- pour les rendre éditables depuis l'interface
-- À exécuter dans Supabase SQL Editor
-- =============================================

INSERT INTO parametres (cle, valeur, type, description) VALUES
  ('saison_nom', '2025-2026', 'string', 'Nom de la saison en cours'),
  ('saison_debut', '2026-03-01', 'string', 'Date de début de saison (format YYYY-MM-DD)'),
  ('saison_fin', '2026-07-31', 'string', 'Date de fin de saison (format YYYY-MM-DD)'),
  ('saison_duree_mois', '5', 'number', 'Durée de la saison en mois')
ON CONFLICT (cle) DO NOTHING;

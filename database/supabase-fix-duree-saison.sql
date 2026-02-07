-- =============================================
-- CORRECTION: Vue v_etat_cotisations
-- Utilisation de la durée de saison au lieu de 12 mois
-- =============================================

-- 1. Supprimer l'ancienne vue
DROP VIEW IF EXISTS v_etat_cotisations;

-- 2. Créer la nouvelle vue avec durée de saison dynamique
CREATE OR REPLACE VIEW v_etat_cotisations AS
SELECT 
  m.id,
  m.nom_prenom,
  m.telephone,
  m.email,
  m.cotisation_mensuelle,
  m.statut,
  COALESCE(SUM(p.montant), 0) AS total_paye,
  -- Utiliser la durée de saison au lieu de 12 mois
  (m.cotisation_mensuelle * CAST((SELECT valeur FROM parametres WHERE cle = 'duree_saison_mois') AS INTEGER)) 
    - COALESCE(SUM(p.montant), 0) AS reste_a_payer,
  CASE 
    WHEN (m.cotisation_mensuelle * CAST((SELECT valeur FROM parametres WHERE cle = 'duree_saison_mois') AS INTEGER)) 
         - COALESCE(SUM(p.montant), 0) <= 0 THEN 'À Jour'
    ELSE 'Retard'
  END AS etat_paiement,
  CASE 
    WHEN (m.cotisation_mensuelle * CAST((SELECT valeur FROM parametres WHERE cle = 'duree_saison_mois') AS INTEGER)) > 0 THEN
      ROUND((COALESCE(SUM(p.montant), 0) / 
        (m.cotisation_mensuelle * CAST((SELECT valeur FROM parametres WHERE cle = 'duree_saison_mois') AS INTEGER))) * 100, 2)
    ELSE 100
  END AS pourcentage_paye
FROM membres m
LEFT JOIN paiements p ON m.id = p.membre_id AND p.annee = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE m.statut = 'Actif'
GROUP BY m.id, m.nom_prenom, m.telephone, m.email, m.cotisation_mensuelle, m.statut;

-- =============================================
-- CORRECTION: Vue v_kpis_financiers
-- Utilisation de la durée de saison pour le taux de recouvrement
-- =============================================

DROP VIEW IF EXISTS v_kpis_financiers;

CREATE OR REPLACE VIEW v_kpis_financiers AS
SELECT 
  (SELECT COALESCE(SUM(entree), 0) FROM transactions) AS total_recettes,
  (SELECT COALESCE(SUM(sortie), 0) FROM transactions) AS total_depenses,
  (SELECT COALESCE(SUM(entree), 0) - COALESCE(SUM(sortie), 0) FROM transactions) AS solde_actuel,
  (SELECT COALESCE(SUM(entree), 0) * 0.1 FROM transactions) AS fonds_reserve,
  (SELECT 
     CASE 
       WHEN SUM(m.cotisation_mensuelle * CAST((SELECT valeur FROM parametres WHERE cle = 'duree_saison_mois') AS INTEGER)) > 0 THEN
         ROUND((SUM(COALESCE(p.total_paye, 0)) / 
           SUM(m.cotisation_mensuelle * CAST((SELECT valeur FROM parametres WHERE cle = 'duree_saison_mois') AS INTEGER))) * 100, 2)
       ELSE 0
     END
   FROM membres m
   LEFT JOIN (
     SELECT membre_id, SUM(montant) as total_paye
     FROM paiements
     WHERE annee = EXTRACT(YEAR FROM CURRENT_DATE)
     GROUP BY membre_id
   ) p ON m.id = p.membre_id
   WHERE m.statut = 'Actif'
  ) AS taux_recouvrement;

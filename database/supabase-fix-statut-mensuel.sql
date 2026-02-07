-- =============================================
-- CORRECTION: Logique de statut basée sur le mois en cours
-- 
-- Règle: Un membre est "En retard" si:
--   1. Aujourd'hui est APRÈS le 5 du mois (jour >= 6)
--   2. Le mois en cours fait partie de la saison (Mars-Juillet = mois 3-7)
--   3. Le paiement du mois en cours n'a PAS été effectué
--
-- Sinon, le membre est "À jour"
-- =============================================

-- Supprimer l'ancienne vue
DROP VIEW IF EXISTS v_etat_cotisations;

-- Créer la nouvelle vue avec logique mensuelle
CREATE OR REPLACE VIEW v_etat_cotisations AS
WITH mois_saison AS (
  -- Mois de la saison: Mars (3) à Juillet (7)
  SELECT generate_series(3, 7) AS mois_numero
),
paiements_annee AS (
  -- Paiements de l'année en cours
  SELECT membre_id, mois, montant
  FROM paiements
  WHERE annee = EXTRACT(YEAR FROM CURRENT_DATE)
),
mois_actuel AS (
  -- Informations sur la date actuelle
  SELECT 
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER AS mois,
    EXTRACT(DAY FROM CURRENT_DATE)::INTEGER AS jour,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER AS annee
),
etat_membres AS (
  SELECT 
    m.id,
    m.nom_prenom,
    m.telephone,
    m.email,
    m.cotisation_mensuelle,
    m.statut,
    COALESCE(SUM(p.montant), 0) AS total_paye,
    -- Nombre de mois de la saison (paramètre)
    CAST((SELECT valeur FROM parametres WHERE cle = 'duree_saison_mois') AS INTEGER) AS duree_saison,
    -- Vérifier si le mois actuel est dans la saison (3-7)
    CASE 
      WHEN (SELECT mois FROM mois_actuel) BETWEEN 3 AND 7 THEN TRUE
      ELSE FALSE
    END AS est_dans_saison,
    -- Vérifier si on est après le 5 du mois
    CASE 
      WHEN (SELECT jour FROM mois_actuel) >= 6 THEN TRUE
      ELSE FALSE
    END AS apres_echeance,
    -- Vérifier si le mois actuel est payé
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM paiements_annee pa 
        WHERE pa.membre_id = m.id 
        AND pa.mois = (SELECT mois FROM mois_actuel)
        AND pa.montant >= m.cotisation_mensuelle
      ) THEN TRUE
      ELSE FALSE
    END AS mois_actuel_paye
  FROM membres m
  LEFT JOIN paiements_annee p ON m.id = p.membre_id
  WHERE m.statut = 'Actif'
  GROUP BY m.id, m.nom_prenom, m.telephone, m.email, m.cotisation_mensuelle, m.statut
)
SELECT 
  id,
  nom_prenom,
  telephone,
  email,
  cotisation_mensuelle,
  statut,
  total_paye,
  -- Reste à payer sur la saison complète
  (cotisation_mensuelle * duree_saison) - total_paye AS reste_a_payer,
  -- État de paiement basé sur le mois en cours
  CASE 
    -- Pas dans la saison → À jour
    WHEN NOT est_dans_saison THEN 'À Jour'
    -- Avant le 6 du mois → À jour (pas encore d'échéance)
    WHEN NOT apres_echeance THEN 'À Jour'
    -- Après le 5 et mois payé → À jour
    WHEN mois_actuel_paye THEN 'À Jour'
    -- Après le 5 et mois NON payé → Retard
    ELSE 'Retard'
  END AS etat_paiement,
  -- Pourcentage payé (sur la saison complète)
  CASE 
    WHEN (cotisation_mensuelle * duree_saison) > 0 THEN
      ROUND((total_paye / (cotisation_mensuelle * duree_saison)) * 100, 2)
    ELSE 100
  END AS pourcentage_paye
FROM etat_membres;

-- =============================================
-- Vérification: Afficher l'état actuel
-- =============================================
SELECT 
  'Aujourd''hui' AS info,
  CURRENT_DATE AS date,
  EXTRACT(DAY FROM CURRENT_DATE) AS jour,
  EXTRACT(MONTH FROM CURRENT_DATE) AS mois,
  CASE 
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) BETWEEN 3 AND 7 THEN 'Oui'
    ELSE 'Non'
  END AS dans_saison,
  CASE 
    WHEN EXTRACT(DAY FROM CURRENT_DATE) >= 6 THEN 'Oui'
    ELSE 'Non'
  END AS apres_echeance;

-- Tester avec les membres
SELECT 
  nom_prenom, 
  cotisation_mensuelle,
  total_paye,
  etat_paiement,
  pourcentage_paye
FROM v_etat_cotisations
ORDER BY etat_paiement DESC, nom_prenom;

-- =============================================
-- SCRIPTS SQL : Modification des Montants de Cotisations
-- À exécuter sur Supabase selon vos besoins
-- =============================================

-- =============================================
-- 1. VÉRIFIER LES MONTANTS ACTUELS
-- =============================================
SELECT cle, valeur, description 
FROM parametres 
WHERE cle IN ('montant_joueur', 'montant_bureau')
ORDER BY cle;

-- =============================================
-- 2. MODIFICATION RAPIDE - Exemples Courants
-- =============================================

-- ========== Joueur : 100 → 120 MAD (Augmentation de 20 MAD) ==========
UPDATE parametres SET valeur = '120' WHERE cle = 'montant_joueur';

-- ========== Bureau : 150 → 180 MAD (Augmentation de 30 MAD) ==========
UPDATE parametres SET valeur = '180' WHERE cle = 'montant_bureau';

-- ========== Augmentation de 10% ==========
-- Joueur : 100 → 110 MAD
UPDATE parametres SET valeur = '110' WHERE cle = 'montant_joueur';
-- Bureau : 150 → 165 MAD
UPDATE parametres SET valeur = '165' WHERE cle = 'montant_bureau';

-- ========== Augmentation de 20% ==========
-- Joueur : 100 → 120 MAD
UPDATE parametres SET valeur = '120' WHERE cle = 'montant_joueur';
-- Bureau : 150 → 180 MAD
UPDATE parametres SET valeur = '180' WHERE cle = 'montant_bureau';

-- ========== Montants égaux (simplification) ==========
-- Joueur et Bureau : 150 MAD
UPDATE parametres SET valeur = '150' WHERE cle = 'montant_joueur';
UPDATE parametres SET valeur = '150' WHERE cle = 'montant_bureau';

-- ========== Bureau = Double du Joueur ==========
-- Joueur : 100 MAD, Bureau : 200 MAD
UPDATE parametres SET valeur = '100' WHERE cle = 'montant_joueur';
UPDATE parametres SET valeur = '200' WHERE cle = 'montant_bureau';

-- =============================================
-- 3. FORCER LE RECALCUL DES COTISATIONS EXISTANTES
-- =============================================

-- Recalcule automatiquement toutes les cotisations mensuelles
-- en déclenchant le trigger calculer_cotisation()
UPDATE membres SET updated_at = NOW();

-- OU recalculer uniquement les joueurs
UPDATE membres 
SET updated_at = NOW() 
WHERE role_joueur = true AND role_bureau = false;

-- OU recalculer uniquement les membres du bureau
UPDATE membres 
SET updated_at = NOW() 
WHERE role_bureau = true;

-- =============================================
-- 4. VÉRIFICATION APRÈS MODIFICATION
-- =============================================

-- Voir tous les membres avec leurs nouvelles cotisations
SELECT 
  nom_prenom,
  role_joueur,
  role_bureau,
  fonction_bureau,
  cotisation_mensuelle,
  cotisation_mensuelle * CAST((SELECT valeur FROM parametres WHERE cle = 'duree_saison_mois') AS INTEGER) AS total_saison
FROM membres
ORDER BY cotisation_mensuelle DESC, nom_prenom;

-- Statistiques par type
SELECT 
  CASE 
    WHEN role_bureau THEN 'Bureau'
    WHEN role_joueur AND NOT role_bureau THEN 'Joueur'
    ELSE 'Aucun'
  END AS type_membre,
  COUNT(*) as nombre,
  AVG(cotisation_mensuelle) as cotisation_moyenne,
  SUM(cotisation_mensuelle * CAST((SELECT valeur FROM parametres WHERE cle = 'duree_saison_mois') AS INTEGER)) as total_attendu_saison
FROM membres
WHERE statut = 'Actif'
GROUP BY 
  CASE 
    WHEN role_bureau THEN 'Bureau'
    WHEN role_joueur AND NOT role_bureau THEN 'Joueur'
    ELSE 'Aucun'
  END
ORDER BY cotisation_moyenne DESC;

-- =============================================
-- 5. HISTORIQUE DES MODIFICATIONS (Optionnel)
-- =============================================

-- Créer une table pour tracker l'historique des montants (optionnel)
/*
CREATE TABLE IF NOT EXISTS historique_montants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('joueur', 'bureau')),
  ancien_montant DECIMAL(10, 2) NOT NULL,
  nouveau_montant DECIMAL(10, 2) NOT NULL,
  raison TEXT,
  modifie_par UUID REFERENCES auth.users(id),
  date_modification TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exemple d'insertion
INSERT INTO historique_montants (type, ancien_montant, nouveau_montant, raison)
VALUES ('joueur', 100, 120, 'Ajustement inflation 2027');
*/

-- =============================================
-- NOTES IMPORTANTES
-- =============================================

/*
1. Toujours modifier `.env.local` en parallèle :
   NEXT_PUBLIC_MONTANT_JOUEUR=120
   NEXT_PUBLIC_MONTANT_BUREAU=180

2. Redémarrer l'application Next.js après modification

3. Les nouveaux membres auront automatiquement les nouveaux montants

4. Pour les membres existants, exécutez la section 3 (FORCER LE RECALCUL)

5. Impact sur la saison (5 mois actuellement) :
   - Joueur 100→120 : 500 MAD → 600 MAD (+100 MAD)
   - Bureau 150→180 : 750 MAD → 900 MAD (+150 MAD)
*/

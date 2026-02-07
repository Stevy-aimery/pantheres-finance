-- =============================================
-- SCRIPT: Ajouter le paramètre durée de saison
-- À exécuter sur Supabase si pas encore fait
-- =============================================

-- Vérifier si le paramètre existe déjà
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM parametres WHERE cle = 'duree_saison_mois') THEN
    INSERT INTO parametres (cle, valeur, type, description) 
    VALUES ('duree_saison_mois', '5', 'number', 'Durée de la saison en mois (Mars à Juillet 2026)');
    
    RAISE NOTICE 'Paramètre duree_saison_mois ajouté avec succès';
  ELSE
    RAISE NOTICE 'Paramètre duree_saison_mois existe déjà';
  END IF;
END $$;

-- Afficher la valeur actuelle
SELECT cle, valeur, description 
FROM parametres 
WHERE cle = 'duree_saison_mois';

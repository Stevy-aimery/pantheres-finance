-- =============================================
-- CORRECTION: SOLDE PROGRESSIF - Sans récursion
-- 
-- Le trigger précédent causait une boucle infinie car
-- il faisait UPDATE sur transactions, ce qui redéclenchait le trigger.
-- 
-- SOLUTION: Utiliser pg_trigger_depth() pour éviter la récursion
-- =============================================

-- 1. Supprimer l'ancien trigger problématique
DROP TRIGGER IF EXISTS trigger_recalculer_soldes ON transactions;
DROP FUNCTION IF EXISTS recalculer_soldes_progressifs();

-- 2. Nouvelle fonction avec vérification de récursion
CREATE OR REPLACE FUNCTION recalculer_soldes_progressifs()
RETURNS TRIGGER AS $$
DECLARE
  running_balance DECIMAL(10, 2) := 0;
  t RECORD;
BEGIN
  -- Éviter la récursion infinie : ne pas exécuter si appelé depuis un autre trigger
  IF pg_trigger_depth() > 1 THEN
    RETURN NULL;
  END IF;

  -- Recalculer tous les soldes
  FOR t IN 
    SELECT id, entree, sortie 
    FROM transactions 
    ORDER BY date ASC, created_at ASC
  LOOP
    running_balance := running_balance + COALESCE(t.entree, 0) - COALESCE(t.sortie, 0);
    UPDATE transactions SET solde_progressif = running_balance WHERE id = t.id;
  END LOOP;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Recréer le trigger
CREATE TRIGGER trigger_recalculer_soldes
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH STATEMENT
EXECUTE FUNCTION recalculer_soldes_progressifs();

-- =============================================
-- 4. Recalculer les soldes existants maintenant 
--    (exécution manuelle, pas via trigger)
-- =============================================
DO $$
DECLARE
  running_balance DECIMAL(10, 2) := 0;
  t RECORD;
BEGIN
  -- Désactiver temporairement le trigger
  ALTER TABLE transactions DISABLE TRIGGER trigger_recalculer_soldes;
  
  FOR t IN 
    SELECT id, entree, sortie 
    FROM transactions 
    ORDER BY date ASC, created_at ASC
  LOOP
    running_balance := running_balance + COALESCE(t.entree, 0) - COALESCE(t.sortie, 0);
    UPDATE transactions SET solde_progressif = running_balance WHERE id = t.id;
  END LOOP;
  
  -- Réactiver le trigger
  ALTER TABLE transactions ENABLE TRIGGER trigger_recalculer_soldes;
  
  RAISE NOTICE 'Soldes progressifs recalculés. Solde final: %', running_balance;
END $$;

-- =============================================
-- 5. Vérification
-- =============================================
SELECT 
  date,
  type,
  categorie,
  libelle,
  entree,
  sortie,
  solde_progressif
FROM transactions
ORDER BY date ASC, created_at ASC;

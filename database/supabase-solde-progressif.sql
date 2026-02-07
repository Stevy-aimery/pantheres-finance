-- =============================================
-- SOLDE PROGRESSIF - Calcul automatique
-- 
-- Ce script ajoute un trigger qui recalcule le solde progressif
-- après chaque INSERT/UPDATE/DELETE sur la table transactions
-- =============================================

-- Fonction pour recalculer tous les soldes progressifs
CREATE OR REPLACE FUNCTION recalculer_soldes_progressifs()
RETURNS TRIGGER AS $$
DECLARE
  running_balance DECIMAL(10, 2) := 0;
  t RECORD;
BEGIN
  -- Recalculer tous les soldes pour maintenir la cohérence
  FOR t IN 
    SELECT id, entree, sortie 
    FROM transactions 
    ORDER BY date ASC, created_at ASC
  LOOP
    running_balance := running_balance + t.entree - t.sortie;
    UPDATE transactions SET solde_progressif = running_balance WHERE id = t.id;
  END LOOP;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_recalculer_soldes ON transactions;

-- Créer le trigger qui se déclenche après chaque modification
CREATE TRIGGER trigger_recalculer_soldes
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH STATEMENT
EXECUTE FUNCTION recalculer_soldes_progressifs();

-- =============================================
-- Recalculer les soldes existants maintenant
-- =============================================
DO $$
DECLARE
  running_balance DECIMAL(10, 2) := 0;
  t RECORD;
BEGIN
  FOR t IN 
    SELECT id, entree, sortie 
    FROM transactions 
    ORDER BY date ASC, created_at ASC
  LOOP
    running_balance := running_balance + t.entree - t.sortie;
    UPDATE transactions SET solde_progressif = running_balance WHERE id = t.id;
  END LOOP;
  
  RAISE NOTICE 'Soldes progressifs recalculés. Solde final: %', running_balance;
END $$;

-- =============================================
-- Vérification
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

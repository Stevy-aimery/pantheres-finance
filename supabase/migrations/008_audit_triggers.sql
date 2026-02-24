-- =============================================
-- MIGRATION 008 : Triggers d'audit automatiques
-- Alimente la table audit_log pour traçabilité
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- ─────────────────────────────────────────────
-- FONCTION GÉNÉRIQUE D'AUDIT
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
        VALUES (auth.uid(), 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_values)
        VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────────
-- TRIGGERS SUR LES TABLES CRITIQUES
-- ─────────────────────────────────────────────

-- Audit : membres
DROP TRIGGER IF EXISTS trigger_audit_membres ON membres;
CREATE TRIGGER trigger_audit_membres
    AFTER INSERT OR UPDATE OR DELETE ON membres
    FOR EACH ROW
    EXECUTE FUNCTION log_audit();

-- Audit : transactions
DROP TRIGGER IF EXISTS trigger_audit_transactions ON transactions;
CREATE TRIGGER trigger_audit_transactions
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION log_audit();

-- Audit : paiements
DROP TRIGGER IF EXISTS trigger_audit_paiements ON paiements;
CREATE TRIGGER trigger_audit_paiements
    AFTER INSERT OR UPDATE OR DELETE ON paiements
    FOR EACH ROW
    EXECUTE FUNCTION log_audit();

-- Audit : budget
DROP TRIGGER IF EXISTS trigger_audit_budget ON budget;
CREATE TRIGGER trigger_audit_budget
    AFTER INSERT OR UPDATE OR DELETE ON budget
    FOR EACH ROW
    EXECUTE FUNCTION log_audit();

-- Audit : parametres
DROP TRIGGER IF EXISTS trigger_audit_parametres ON parametres;
CREATE TRIGGER trigger_audit_parametres
    AFTER INSERT OR UPDATE OR DELETE ON parametres
    FOR EACH ROW
    EXECUTE FUNCTION log_audit();

-- Audit : messages
DROP TRIGGER IF EXISTS trigger_audit_messages ON messages;
CREATE TRIGGER trigger_audit_messages
    AFTER INSERT OR UPDATE OR DELETE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION log_audit();


-- ─────────────────────────────────────────────
-- VÉRIFICATION
-- ─────────────────────────────────────────────
-- Exécuter pour vérifier les triggers :
-- SELECT trigger_name, event_object_table, action_timing 
-- FROM information_schema.triggers 
-- WHERE trigger_name LIKE 'trigger_audit%';

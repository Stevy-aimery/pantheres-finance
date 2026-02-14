-- =============================================
-- Table MESSAGES pour la messagerie interne
-- Style Chat (WhatsApp-like)
-- =============================================
-- À exécuter dans Supabase SQL Editor

-- ─── 1. CRÉATION DE LA TABLE ───
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membre_id UUID NOT NULL REFERENCES membres(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    sujet TEXT DEFAULT '',
    contenu TEXT NOT NULL,
    type_message TEXT NOT NULL DEFAULT 'autre' CHECK (type_message IN ('remarque', 'anomalie', 'question', 'autre')),
    statut TEXT NOT NULL DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_cours', 'resolu')),
    is_from_tresorier BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 2. INDEX POUR LA PERFORMANCE ───
CREATE INDEX IF NOT EXISTS idx_messages_membre_id ON messages(membre_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_statut ON messages(statut);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);

-- ─── 3. TRIGGER UPDATED_AT ───
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_messages_updated_at ON messages;
CREATE TRIGGER trigger_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- ─── 4. ROW LEVEL SECURITY (RLS) ───
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages" ON messages;

-- ──────────────────────────────────────────
-- POLICY SELECT : 
--   Trésorier → Voit TOUS les messages
--   Joueur/Bureau → Voit UNIQUEMENT ses propres messages (membre_id = son id)
-- ──────────────────────────────────────────
CREATE POLICY "messages_select_policy" ON messages
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND (
            -- Trésorier : accès total
            EXISTS (
                SELECT 1 FROM auth.users u 
                WHERE u.id = auth.uid() 
                AND u.raw_user_meta_data->>'role' = 'tresorier'
            )
            OR
            -- Autres : uniquement leurs messages
            membre_id IN (
                SELECT m.id FROM membres m 
                WHERE m.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            )
        )
    );

-- ──────────────────────────────────────────
-- POLICY INSERT :
--   Tout utilisateur authentifié peut envoyer un message
--   Chaque message est lié à un membre_id
-- ──────────────────────────────────────────
CREATE POLICY "messages_insert_policy" ON messages
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ──────────────────────────────────────────
-- POLICY UPDATE :
--   Seul le trésorier peut modifier le statut des messages
-- ──────────────────────────────────────────
CREATE POLICY "messages_update_policy" ON messages
    FOR UPDATE
    USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM auth.users u 
            WHERE u.id = auth.uid() 
            AND u.raw_user_meta_data->>'role' = 'tresorier'
        )
    );

-- ─── 5. ACTIVER REALTIME SUR LA TABLE ───
-- Dans Supabase Dashboard > Database > Replication
-- Ajouter la table "messages" aux tables répliquées
-- OU exécuter :
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

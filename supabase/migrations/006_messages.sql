-- =============================================
-- Table MESSAGES pour la messagerie interne
-- =============================================
-- À exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membre_id UUID NOT NULL REFERENCES membres(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- Pour les réponses
    sujet TEXT NOT NULL,
    contenu TEXT NOT NULL,
    type_message TEXT NOT NULL DEFAULT 'autre' CHECK (type_message IN ('remarque', 'anomalie', 'question', 'autre')),
    statut TEXT NOT NULL DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_cours', 'resolu')),
    is_from_tresorier BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_messages_membre_id ON messages(membre_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_messages_statut ON messages(statut);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Trigger pour updated_at
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

-- RLS Policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs authentifiés
CREATE POLICY "Users can view messages" ON messages
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update messages" ON messages
    FOR UPDATE
    USING (auth.role() = 'authenticated');

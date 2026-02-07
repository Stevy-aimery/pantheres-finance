-- =============================================
-- TABLE: sponsors
-- Gestion des sponsors et partenaires du club
-- =============================================

-- Créer la table sponsors
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) DEFAULT 'Sponsor' CHECK (type IN ('Sponsor', 'Partenaire', 'Mécène', 'Fournisseur')),
  contact_nom VARCHAR(255),
  contact_telephone VARCHAR(20),
  contact_email VARCHAR(255),
  montant_contribution DECIMAL(10, 2) DEFAULT 0,
  date_debut DATE,
  date_fin DATE,
  actif BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_sponsors_nom ON sponsors(nom);
CREATE INDEX IF NOT EXISTS idx_sponsors_actif ON sponsors(actif);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_sponsors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sponsors ON sponsors;
CREATE TRIGGER trigger_update_sponsors
BEFORE UPDATE ON sponsors
FOR EACH ROW
EXECUTE FUNCTION update_sponsors_updated_at();

-- Activer RLS
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Lecture sponsors pour tous" ON sponsors
FOR SELECT TO authenticated
USING (true);

-- Politique d'écriture pour trésorier
CREATE POLICY "Écriture sponsors pour trésorier" ON sponsors
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id
    AND raw_user_meta_data->>'role' = 'tresorier'
  )
);

-- =============================================
-- Données d'exemple
-- =============================================
INSERT INTO sponsors (nom, type, contact_nom, montant_contribution, date_debut, date_fin, actif) VALUES
  ('Sponsor Principal ABC', 'Sponsor', 'Mohamed ABC', 5000, '2026-03-01', '2026-07-31', true),
  ('Partenaire Équipement XYZ', 'Partenaire', 'Ahmed XYZ', 2000, '2026-03-01', '2026-07-31', true),
  ('Restaurant du Coin', 'Mécène', 'Karim Restaurant', 1000, '2026-03-01', '2026-07-31', true),
  ('Fournisseur Maillots', 'Fournisseur', 'Youssef Maillots', 0, '2026-03-01', '2026-07-31', true)
ON CONFLICT (nom) DO NOTHING;

-- =============================================
-- Vérification
-- =============================================
SELECT id, nom, type, actif, montant_contribution FROM sponsors ORDER BY nom;

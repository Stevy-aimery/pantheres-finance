-- =============================================
-- SCHÉMA DE BASE DE DONNÉES SUPABASE
-- Dashboard Financier Panthères de Fès
-- =============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: membres
-- Gestion unifiée des joueurs et membres du bureau
-- =============================================
CREATE TABLE membres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_prenom VARCHAR(255) NOT NULL,
  telephone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  statut VARCHAR(20) NOT NULL DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Blessé', 'Arrêt/Départ')),
  role_joueur BOOLEAN DEFAULT FALSE,
  role_bureau BOOLEAN DEFAULT FALSE,
  fonction_bureau VARCHAR(100),
  cotisation_mensuelle DECIMAL(10, 2) DEFAULT 0,
  photo_url TEXT,
  date_entree DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_membres_email ON membres(email);
CREATE INDEX idx_membres_telephone ON membres(telephone);
CREATE INDEX idx_membres_statut ON membres(statut);

-- =============================================
-- TABLE: paiements
-- Tracking des paiements mensuels de cotisations
-- =============================================
CREATE TABLE paiements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membre_id UUID NOT NULL REFERENCES membres(id) ON DELETE CASCADE,
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL,
  montant DECIMAL(10, 2) NOT NULL,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  mode_paiement VARCHAR(50) NOT NULL CHECK (mode_paiement IN ('Espèces', 'Virement', 'Chèque', 'Wafacash/CashPlus')),
  justificatif_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique : un membre ne peut payer qu'une fois par mois
  UNIQUE(membre_id, mois, annee)
);

-- Index pour recherche par membre et période
CREATE INDEX idx_paiements_membre ON paiements(membre_id);
CREATE INDEX idx_paiements_date ON paiements(annee, mois);

-- =============================================
-- TABLE: transactions
-- Journal de toutes les entrées et sorties
-- =============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mois INTEGER NOT NULL, -- Calculé automatiquement depuis la date
  annee INTEGER NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('Recette', 'Dépense')),
  categorie VARCHAR(100) NOT NULL,
  sous_categorie VARCHAR(100),
  tiers VARCHAR(255),
  membre_id UUID REFERENCES membres(id) ON DELETE SET NULL, -- Si tiers = membre
  libelle TEXT NOT NULL,
  entree DECIMAL(10, 2) DEFAULT 0 CHECK (entree >= 0),
  sortie DECIMAL(10, 2) DEFAULT 0 CHECK (sortie >= 0),
  mode_paiement VARCHAR(50) NOT NULL,
  solde_progressif DECIMAL(10, 2), -- Calculé automatiquement
  justificatif_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte : soit entrée soit sortie, pas les deux
  CHECK ((entree > 0 AND sortie = 0) OR (sortie > 0 AND entree = 0))
);

-- Index pour recherche et tri
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_categorie ON transactions(categorie);
CREATE INDEX idx_transactions_membre ON transactions(membre_id);

-- =============================================
-- TABLE: budget
-- Budget prévisionnel par catégorie et période
-- =============================================
CREATE TABLE budget (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categorie VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('Recette', 'Dépense')),
  budget_alloue DECIMAL(10, 2) NOT NULL,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique : une catégorie par type et période
  UNIQUE(categorie, type, periode_debut, periode_fin)
);

CREATE INDEX idx_budget_periode ON budget(periode_debut, periode_fin);

-- =============================================
-- TABLE: parametres
-- Configuration globale de l'application
-- =============================================
CREATE TABLE parametres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cle VARCHAR(100) NOT NULL UNIQUE,
  valeur TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('number', 'string', 'json', 'boolean')),
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion des paramètres par défaut
INSERT INTO parametres (cle, valeur, type, description) VALUES
  ('montant_joueur', '100', 'number', 'Montant mensuel de cotisation pour un joueur (MAD)'),
  ('montant_bureau', '150', 'number', 'Montant mensuel de cotisation pour un membre du bureau (MAD)'),
  ('jour_cotisation', '5', 'number', 'Jour du mois où les cotisations sont dues'),
  ('jour_relance', '15', 'number', 'Jour du mois pour l''envoi des rappels automatiques'),
  ('seuil_alerte_solde', '10', 'number', 'Seuil d''alerte pour solde faible (% du budget annuel)'),
  ('pourcentage_reserve', '10', 'number', 'Pourcentage des revenus à mettre en réserve'),
  ('email_tresorier', '', 'string', 'Email du trésorier pour les notifications'),
  ('email_bureau', '', 'string', 'Emails du bureau (séparés par des virgules)');

-- =============================================
-- TABLE: notifications_log
-- Journal des emails envoyés
-- =============================================
CREATE TABLE notifications_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  destinataire_email VARCHAR(255) NOT NULL,
  destinataire_id UUID REFERENCES membres(id) ON DELETE SET NULL,
  objet TEXT NOT NULL,
  corps TEXT,
  statut VARCHAR(20) NOT NULL CHECK (statut IN ('success', 'failed', 'pending')),
  error_message TEXT,
  date_envoi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_type ON notifications_log(type);
CREATE INDEX idx_notifications_date ON notifications_log(date_envoi DESC);

-- =============================================
-- TABLE: audit_log
-- Historique de toutes les modifications
-- =============================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_table ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_date ON audit_log(created_at DESC);

-- =============================================
-- FONCTIONS & TRIGGERS
-- =============================================

-- Fonction pour calculer la cotisation mensuelle d'un membre
CREATE OR REPLACE FUNCTION calculer_cotisation()
RETURNS TRIGGER AS $$
DECLARE
  montant_joueur DECIMAL(10,2);
  montant_bureau DECIMAL(10,2);
BEGIN
  -- Récupérer les montants depuis les paramètres
  SELECT CAST(valeur AS DECIMAL) INTO montant_joueur FROM parametres WHERE cle = 'montant_joueur';
  SELECT CAST(valeur AS DECIMAL) INTO montant_bureau FROM parametres WHERE cle = 'montant_bureau';
  
  -- Règle: Si membre bureau, priorité au montant bureau
  IF NEW.role_bureau = TRUE THEN
    NEW.cotisation_mensuelle := montant_bureau;
  ELSIF NEW.role_joueur = TRUE THEN
    NEW.cotisation_mensuelle := montant_joueur;
  ELSE
    NEW.cotisation_mensuelle := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calcul automatique de la cotisation
CREATE TRIGGER trigger_calculer_cotisation
BEFORE INSERT OR UPDATE OF role_joueur, role_bureau ON membres
FOR EACH ROW
EXECUTE FUNCTION calculer_cotisation();

-- Fonction pour extraire mois et année de la date de transaction
CREATE OR REPLACE FUNCTION extraire_mois_annee()
RETURNS TRIGGER AS $$
BEGIN
  NEW.mois := EXTRACT(MONTH FROM NEW.date);
  NEW.annee := EXTRACT(YEAR FROM NEW.date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour extraction automatique mois/année
CREATE TRIGGER trigger_extraire_mois_annee
BEFORE INSERT OR UPDATE OF date ON transactions
FOR EACH ROW
EXECUTE FUNCTION extraire_mois_annee();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at sur toutes les tables concernées
CREATE TRIGGER trigger_update_membres
BEFORE UPDATE ON membres
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_transactions
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_budget
BEFORE UPDATE ON budget
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =============================================
-- POLITIQUES DE SÉCURITÉ (RLS)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Politique pour trésorier (accès complet)
CREATE POLICY "Trésorier: Accès complet" ON membres
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id
    AND raw_user_meta_data->>'role' = 'tresorier'
  )
);

-- Politique pour membres bureau (lecture seule)
CREATE POLICY "Bureau: Lecture seule" ON membres
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id
    AND raw_user_meta_data->>'role' = 'bureau'
  )
);

-- Politique pour joueurs (accès à leurs propres données uniquement)
CREATE POLICY "Joueur: Données personnelles" ON membres
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM membres m
    WHERE m.email = auth.jwt()->>'email'
    AND membres.id = m.id
  )
);

-- Répliquer les politiques pour les autres tables (simplifié)
-- Note: À personnaliser selon les besoins spécifiques de chaque table

-- =============================================
-- VUES UTILES
-- =============================================

-- Vue: État des cotisations par membre
CREATE OR REPLACE VIEW v_etat_cotisations AS
SELECT 
  m.id,
  m.nom_prenom,
  m.telephone,
  m.email,
  m.cotisation_mensuelle,
  m.statut,
  COALESCE(SUM(p.montant), 0) AS total_paye,
  (m.cotisation_mensuelle * 12) - COALESCE(SUM(p.montant), 0) AS reste_a_payer,
  CASE 
    WHEN (m.cotisation_mensuelle * 12) - COALESCE(SUM(p.montant), 0) <= 0 THEN 'À Jour'
    ELSE 'Retard'
  END AS etat_paiement,
  CASE 
    WHEN (m.cotisation_mensuelle * 12) > 0 THEN
      ROUND((COALESCE(SUM(p.montant), 0) / (m.cotisation_mensuelle * 12)) * 100, 2)
    ELSE 100
  END AS pourcentage_paye
FROM membres m
LEFT JOIN paiements p ON m.id = p.membre_id AND p.annee = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE m.statut = 'Actif'
GROUP BY m.id, m.nom_prenom, m.telephone, m.email, m.cotisation_mensuelle, m.statut;

-- Vue: Solde actuel et KPIs
CREATE OR REPLACE VIEW v_kpis_financiers AS
SELECT 
  (SELECT COALESCE(SUM(entree), 0) FROM transactions) AS total_recettes,
  (SELECT COALESCE(SUM(sortie), 0) FROM transactions) AS total_depenses,
  (SELECT COALESCE(SUM(entree), 0) - COALESCE(SUM(sortie), 0) FROM transactions) AS solde_actuel,
  (SELECT COALESCE(SUM(entree), 0) * 0.1 FROM transactions) AS fonds_reserve,
  (SELECT 
     CASE 
       WHEN SUM(m.cotisation_mensuelle * 12) > 0 THEN
         ROUND((SUM(COALESCE(p.total_paye, 0)) / SUM(m.cotisation_mensuelle * 12)) * 100, 2)
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

-- =============================================
-- DONNÉES D'EXEMPLE (pour tests)
-- =============================================

-- Exemples de membres
INSERT INTO membres (nom_prenom, telephone, email, statut, role_joueur, role_bureau, fonction_bureau, date_entree) VALUES
  ('Karim El Capitano', '0600000000', 'karim@pantheres.com', 'Actif', true, true, 'Capitaine', '2026-01-01'),
  ('Ahmed Gardien', '0611111111', 'ahmed@pantheres.com', 'Actif', true, false, NULL, '2026-01-01'),
  ('Youssef Trésorier', '0622222222', 'tresorier@pantheres.com', 'Actif', false, true, 'Trésorier', '2026-01-01');

-- Exemples de catégories dans le budget
INSERT INTO budget (categorie, type, budget_alloue, periode_debut, periode_fin) VALUES
  ('Location Terrain', 'Dépense', 7200, '2026-02-01', '2026-07-31'),
  ('Cotisations', 'Recette', 16800, '2026-02-01', '2026-07-31'),
  ('Sponsoring', 'Recette', 3000, '2026-02-01', '2026-07-31');

-- =============================================
-- FIN DU SCHÉMA
-- =============================================

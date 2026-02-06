-- Ajouter le paramètre de durée de saison dans la table parametres
INSERT INTO parametres (cle, valeur, type, description) 
VALUES ('duree_saison_mois', '5', 'number', 'Durée de la saison en mois (pour calcul cotisation totale)')
ON CONFLICT (cle) DO UPDATE 
SET valeur = '5', description = 'Durée de la saison en mois (pour calcul cotisation totale)';

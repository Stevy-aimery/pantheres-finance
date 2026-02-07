# 💰 Guide : Modifier les Montants de Cotisations

Ce guide explique **comment modifier rapidement** les montants de cotisations pour les joueurs et membres du bureau.

---

## 🎯 Système Centralisé

Votre application utilise **3 sources synchronisées** pour gérer les montants :

### 1. **Variables d'environnement** (Frontend)
📁 Fichier : `.env.local`
```env
NEXT_PUBLIC_MONTANT_JOUEUR=100   # Joueur : 100 MAD/mois
NEXT_PUBLIC_MONTANT_BUREAU=150   # Bureau : 150 MAD/mois
```

### 2. **Configuration TypeScript** (Code)
📁 Fichier : `lib/config/cotisations.ts`
```typescript
export const MONTANT_COTISATION_JOUEUR = Number(process.env.NEXT_PUBLIC_MONTANT_JOUEUR || 100)
export const MONTANT_COTISATION_BUREAU = Number(process.env.NEXT_PUBLIC_MONTANT_BUREAU || 150)
```

### 3. **Paramètres Supabase** (Base de données)
📁 Table : `parametres`
```sql
-- Joueur
UPDATE parametres SET valeur = '100' WHERE cle = 'montant_joueur';

-- Bureau
UPDATE parametres SET valeur = '150' WHERE cle = 'montant_bureau';
```

---

## 🚀 Modification Rapide : Checklist

### ✅ Exemple : Passer de 100 à 120 MAD pour les joueurs

#### Étape 1 : Variable d'environnement
```env
# Fichier: .env.local
NEXT_PUBLIC_MONTANT_JOUEUR=120  # Changez 100 en 120
NEXT_PUBLIC_MONTANT_BUREAU=150  # Inchangé
```

#### Étape 2 : Supabase (SQL Editor)
```sql
UPDATE parametres SET valeur = '120' WHERE cle = 'montant_joueur';
```

#### Étape 3 : Redémarrer l'application
```bash
# Arrêtez le serveur (Ctrl+C) puis relancez
npm run dev
```

---

### ✅ Exemple : Passer de 150 à 200 MAD pour le bureau

#### Étape 1 : Variable d'environnement
```env
# Fichier: .env.local
NEXT_PUBLIC_MONTANT_JOUEUR=100  # Inchangé
NEXT_PUBLIC_MONTANT_BUREAU=200  # Changez 150 en 200
```

#### Étape 2 : Supabase (SQL Editor)
```sql
UPDATE parametres SET valeur = '200' WHERE cle = 'montant_bureau';
```

#### Étape 3 : Redémarrer
```bash
npm run dev
```

---

## 📋 Checklist Complète

Quand vous changez les montants de cotisations :

- [ ] **`.env.local`** : Variables `NEXT_PUBLIC_MONTANT_*` modifiées
- [ ] **Supabase** : Paramètres `montant_joueur` et/ou `montant_bureau` mis à jour via SQL
- [ ] **Serveur redémarré** : Nouveau `npm run dev`
- [ ] **Membres existants** : Vérifier que les cotisations se recalculent automatiquement ✅

---

## 🔍 Où les Montants sont Utilisés

### Frontend (React/TypeScript)
1. **`lib/config/cotisations.ts`** 🆕
   - Constantes centralisées
   - Fonctions : `obtenirMontantCotisation()`, `formaterMontantMAD()`

2. **`app/dashboard/membres/membre-form.tsx`**
   - Calcul automatique au choix du rôle
   - Affichage du montant mensuel

3. **`components/dashboard/membre-detail-modal.tsx`**
   - Affichage des cotisations dans le modal

4. **Page Dashboard**
   - Statistiques et KPIs

### Backend (Supabase SQL)
1. **Fonction `calculer_cotisation()`**
   - Trigger automatique lors de la création/modification d'un membre
   - Règle : Bureau a priorité sur Joueur

2. **Table `parametres`**
   - Stockage centralisé des montants
   - Source unique de vérité pour le backend

---

## 📊 Impact des Changements

### Changement Joueur : 100 → 120 MAD

**Pour la saison (5 mois)** :
```
Avant : 100 MAD/mois × 5 = 500 MAD
Après : 120 MAD/mois × 5 = 600 MAD (+100 MAD)
```

**Membres affectés** :
- ✅ Joueurs uniquement (pas au bureau)
- ❌ Bureau : non affecté

### Changement Bureau : 150 → 200 MAD

**Pour la saison (5 mois)** :
```
Avant : 150 MAD/mois × 5 = 750 MAD
Après : 200 MAD/mois × 5 = 1000 MAD (+250 MAD)
```

**Membres affectés** :
- ✅ Membres du bureau
- ✅ Double rôle (Joueur + Bureau) → Prennent le montant Bureau
- ❌ Joueurs seuls : non affectés

---

## 🛠️ Scripts SQL Prêts à l'Emploi

### Vérifier les montants actuels
```sql
SELECT cle, valeur, description 
FROM parametres 
WHERE cle IN ('montant_joueur', 'montant_bureau')
ORDER BY cle;
```

### Montants courants (2026)
```sql
-- Joueur : 100 MAD
-- Bureau : 150 MAD
SELECT * FROM parametres WHERE cle IN ('montant_joueur', 'montant_bureau');
```

### Augmenter de 20% (arrondi)
```sql
-- Joueur : 100 → 120 MAD
UPDATE parametres SET valeur = '120' WHERE cle = 'montant_joueur';

-- Bureau : 150 → 180 MAD
UPDATE parametres SET valeur = '180' WHERE cle = 'montant_bureau';
```

### Augmenter de 10 MAD
```sql
-- Joueur : 100 → 110 MAD
UPDATE parametres SET valeur = '110' WHERE cle = 'montant_joueur';

-- Bureau : 150 → 160 MAD
UPDATE parametres SET valeur = '160' WHERE cle = 'montant_bureau';
```

### Montants égaux (simplification)
```sql
-- Joueur et Bureau : 120 MAD
UPDATE parametres SET valeur = '120' WHERE cle = 'montant_joueur';
UPDATE parametres SET valeur = '120' WHERE cle = 'montant_bureau';
```

---

## ⚙️ Recalcul Automatique

### Les cotisations se recalculent automatiquement pour :
✅ **Nouveaux membres** : Dès la création  
✅ **Membres existants** : Au prochain changement de rôle  
✅ **Affichage** : Redémarrage de l'app suffit  

### Pour forcer le recalcul de TOUS les membres existants :
```sql
-- Recalcule TOUTES les cotisations mensuelles
UPDATE membres SET updated_at = NOW();
```

---

## ⚠️ Important : Synchronisation

**Les 3 sources DOIVENT être synchronisées** :

| Source | Valeur | Statut |
|--------|--------|--------|
| `.env.local` | `NEXT_PUBLIC_MONTANT_JOUEUR` | ✅ |
| Supabase | `parametres.montant_joueur` | ✅ |
| Frontend | `lib/config/cotisations.ts` | ✅ Lit depuis .env |

**Ordre recommandé** :
1. Modifier `.env.local`
2. Modifier Supabase
3. Redémarrer `npm run dev`

---

## 📝 Tableau Récapitulatif

| Rôle | Montant Actuel | Saison (5 mois) | Variable |
|------|----------------|-----------------|----------|
| **Joueur** | 100 MAD/mois | 500 MAD | `NEXT_PUBLIC_MONTANT_JOUEUR` |
| **Bureau** | 150 MAD/mois | 750 MAD | `NEXT_PUBLIC_MONTANT_BUREAU` |
| **Les deux** | 150 MAD/mois | 750 MAD | Priorité au Bureau |

---

## 🎯 Cas d'Usage Courants

### Inflation annuelle (+5%)
```sql
-- Joueur : 100 → 105 MAD
-- Bureau : 150 → 158 MAD (arrondi)
UPDATE parametres SET valeur = '105' WHERE cle = 'montant_joueur';
UPDATE parametres SET valeur = '158' WHERE cle = 'montant_bureau';
```

### Augmentation forfaitaire (+10 MAD)
```sql
UPDATE parametres SET valeur = '110' WHERE cle = 'montant_joueur';
UPDATE parametres SET valeur = '160' WHERE cle = 'montant_bureau';
```

### Différenciation Bureau (×2)
```sql
-- Bureau = Joueur × 2
UPDATE parametres SET valeur = '100' WHERE cle = 'montant_joueur';
UPDATE parametres SET valeur = '200' WHERE cle = 'montant_bureau';
```

---

## 📍 Fichiers Importants

1. **Configuration** : `lib/config/cotisations.ts` 🆕
2. **Variables env** : `.env.local`
3. **Schéma SQL** : `supabase-schema.sql`
4. **Ce guide** : `GUIDE_MONTANTS_COTISATIONS.md`

---

**Modification rapide en 3 étapes !** 🚀

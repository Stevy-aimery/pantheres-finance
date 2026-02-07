# 📅 Guide : Modifier la Durée de Saison

Ce guide explique **comment modifier rapidement** la durée de votre saison (actuellement 5 mois) pour l'adapter aux années futures.

---

## 🎯 Système Centralisé

Votre application utilise **3 sources synchronisées** pour gérer la durée de saison :

### 1. **Variable d'environnement** (Frontend)
📁 Fichier : `.env.local`
```env
NEXT_PUBLIC_DUREE_SAISON_MOIS=5
```

### 2. **Configuration TypeScript** (Code)
📁 Fichier : `lib/config/saison.ts`
```typescript
export const DUREE_SAISON_MOIS = Number(process.env.NEXT_PUBLIC_DUREE_SAISON_MOIS || 5)
```

### 3. **Paramètre Supabase** (Base de données)
📁 Table : `parametres`
```sql
UPDATE parametres 
SET valeur = '5' 
WHERE cle = 'duree_saison_mois';
```

---

## 🚀 Modification Rapide : Checklist

### ✅ Pour passer de 5 à 6 mois (par exemple)

#### Étape 1 : Variable d'environnement
```bash
# Fichier: .env.local
NEXT_PUBLIC_DUREE_SAISON_MOIS=6  # Changez 5 en 6
```

#### Étape 2 : Supabase (SQL Editor)
```sql
UPDATE parametres 
SET valeur = '6' 
WHERE cle = 'duree_saison_mois';
```

#### Étape 3 : Configuration TypeScript (optionnel)
```typescript
// Fichier: lib/config/saison.ts
// Changez aussi DATE_FIN_SAISON si nécessaire
export const DATE_DEBUT_SAISON = "2027-03-05"
export const DATE_FIN_SAISON = "2027-08-31"  // Un mois de plus
```

#### Étape 4 : Redémarrer l'application
```bash
# Arrêtez le serveur (Ctrl+C) puis relancez
npm run dev
```

---

## 📋 Checklist Complète

Quand vous changez la durée de saison, vérifiez ces 3 points :

- [ ] **`.env.local`** : `NEXT_PUBLIC_DUREE_SAISON_MOIS` modifié
- [ ] **Supabase** : Paramètre `duree_saison_mois` mis à jour via SQL
- [ ] **Serveur redémarré** : Nouveau `npm run dev`

---

## 🔍 Où la Durée de Saison est Utilisée

### Frontend (React/TypeScript)
1. **`lib/config/saison.ts`**
   - Fonctions de calcul centralisées
   - `calculerCotisationSaison()`, `calculerPourcentagePaiement()`, etc.

2. **`app/dashboard/membres/membre-form.tsx`**
   - Affichage "Cotisation total de la saison"
   - Calcul : `cotisation_mensuelle × durée_saison`

3. **`components/dashboard/membre-detail-modal.tsx`**
   - Modal de détails membre
   - Affichage du total saison

### Backend (Supabase SQL)
1. **Vue : `v_etat_cotisations`**
   - Calcul du `reste_a_payer`
   - Calcul du `pourcentage_paye`
   - Détermination de l'`etat_paiement`

2. **Vue : `v_kpis_financiers`**
   - Calcul du `taux_recouvrement` global

---

## 📊 Exemples de Calculs

### Avec 5 mois (Mars à Juillet)
```
Joueur : 100 MAD/mois × 5 = 500 MAD total saison
Bureau : 150 MAD/mois × 5 = 750 MAD total saison
```

### Avec 6 mois (Mars à Août)
```
Joueur : 100 MAD/mois × 6 = 600 MAD total saison
Bureau : 150 MAD/mois × 6 = 900 MAD total saison
```

### Avec 7 mois (Mars à Septembre)
```
Joueur : 100 MAD/mois × 7 = 700 MAD total saison
Bureau : 150 MAD/mois × 7 = 1050 MAD total saison
```

---

## ⚠️ Important : Synchronisation

**Les 3 sources DOIVENT être synchronisées** :
- ❌ Si `.env.local` = 5 et Supabase = 6 → **Incohérence !**
- ✅ Si `.env.local` = 6 et Supabase = 6 → **Parfait !**

**Astuce** : Modifiez toujours les 3 en même temps pour éviter les bugs.

---

## 🛠️ Scripts SQL Prêts à l'Emploi

### Vérifier la valeur actuelle
```sql
SELECT valeur FROM parametres WHERE cle = 'duree_saison_mois';
```

### Passer à 6 mois
```sql
UPDATE parametres SET valeur = '6' WHERE cle = 'duree_saison_mois';
```

### Passer à 7 mois
```sql
UPDATE parametres SET valeur = '7' WHERE cle = 'duree_saison_mois';
```

### Passer à 8 mois
```sql
UPDATE parametres SET valeur = '8' WHERE cle = 'duree_saison_mois';
```

---

## 📝 Résumé

| Paramètre | Emplacement | Action |
|-----------|-------------|--------|
| **Frontend** | `.env.local` | Modifier `NEXT_PUBLIC_DUREE_SAISON_MOIS` |
| **Backend** | Supabase SQL | Modifier paramètre `duree_saison_mois` |
| **Code** | `lib/config/saison.ts` | Modifier dates si nécessaire |
| **Finalisation** | Terminal | Redémarrer `npm run dev` |

**C'est tout !** 🎉

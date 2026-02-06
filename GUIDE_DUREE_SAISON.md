# 📝 Guide : Modifier la durée de la saison

## 🎯 Où modifier le paramètre

### Fichier : `app/dashboard/membres/membre-form.tsx`

**Ligne 311** : Changez le multiplicateur

```typescript
// ACTUELLEMENT (5 mois) :
<span className="font-semibold">{getCotisationPreview() * 5} MAD</span>

// Pour 6 mois, changez en :
<span className="font-semibold">{getCotisationPreview() * 6} MAD</span>

// Pour 7 mois, changez en :
<span className="font-semibold">{getCotisationPreview() * 7} MAD</span>
```

---

## 🔄 Modification rapide étape par étape

1. **Ouvrir** : `app/dashboard/membres/membre-form.tsx`
2. **Aller à** : Ligne 311 (ou chercher `* 5`)
3. **Remplacer** : `* 5` par `* 6` (ou le nombre de mois voulu)
4. **Sauvegarder** : Le serveur Next.js rechargera automatiquement

---

## 💡 Pour plus tard : Base de données dynamique

Pour ne plus avoir à modifier le code, vous pourriez :

### Option 1 : Utiliser le paramètre Supabase

1. Exécutez ce SQL (déjà créé dans `supabase-add-duree-saison.sql`) :
```sql
INSERT INTO parametres (cle, valeur, type, description) 
VALUES ('duree_saison_mois', '5', 'number', 'Durée de la saison en mois');
```

2. Modifiez ensuite le code pour lire ce paramètre depuis la DB

### Option 2 : Variable d'environnement

Ajoutez dans `.env.local` :
```env
NEXT_PUBLIC_DUREE_SAISON_MOIS=5
```

Puis utilisez :
```typescript
{getCotisationPreview() * Number(process.env.NEXT_PUBLIC_DUREE_SAISON_MOIS || 5)} MAD
```

---

## ✅ Actuellement configuré

- **Durée saison** : 5 mois
- **Fichier** : `membre-form.tsx` ligne 311
- **Label** : "Cotisation total de la saison" (au lieu de "annuelle")

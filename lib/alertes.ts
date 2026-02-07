import { createClient } from "@/lib/supabase/server"
import type { Alerte } from "@/components/dashboard/alertes-panel"

/**
 * Génère les alertes pour le dashboard en fonction des KPIs
 */
export async function genererAlertes(): Promise<Alerte[]> {
    const supabase = await createClient()
    const alertes: Alerte[] = []

    // 1. Vérifier le taux de recouvrement des cotisations
    const { data: kpis } = await supabase
        .from("v_kpis_financiers")
        .select("*")
        .single()

    const tauxRecouvrement = kpis?.taux_recouvrement || 0

    if (tauxRecouvrement < 70) {
        alertes.push({
            id: "recouvrement-critique",
            type: "critique",
            categorie: "recouvrement",
            titre: "Taux de recouvrement très faible",
            description: `Seulement ${tauxRecouvrement.toFixed(0)}% des cotisations ont été collectées. Relance urgente nécessaire.`,
            lien: "/dashboard/membres",
            libelleAction: "Voir les membres en retard",
        })
    } else if (tauxRecouvrement < 85) {
        alertes.push({
            id: "recouvrement-warning",
            type: "warning",
            categorie: "recouvrement",
            titre: "Taux de recouvrement à surveiller",
            description: `${tauxRecouvrement.toFixed(0)}% des cotisations collectées. Objectif : 90%+`,
            lien: "/dashboard/membres",
            libelleAction: "Consulter les paiements",
        })
    }

    // 2. Vérifier le solde actuel
    const soldeActuel = kpis?.solde_actuel || 0
    const totalRecettes = kpis?.total_recettes || 0
    const seuilAlerte = totalRecettes * 0.1 // 10% du total des recettes

    if (soldeActuel < seuilAlerte && soldeActuel > 0) {
        alertes.push({
            id: "solde-faible",
            type: "warning",
            categorie: "solde",
            titre: "Solde faible",
            description: `Solde actuel : ${soldeActuel.toFixed(2)} MAD (< 10% des recettes totales)`,
            lien: "/dashboard/transactions",
            libelleAction: "Voir les transactions",
        })
    } else if (soldeActuel <= 0) {
        alertes.push({
            id: "solde-negatif",
            type: "critique",
            categorie: "solde",
            titre: "Solde négatif",
            description: `Le solde est négatif : ${soldeActuel.toFixed(2)} MAD. Action immédiate requise.`,
            lien: "/dashboard/budget",
            libelleAction: "Consulter le budget",
        })
    }

    // 3. Vérifier les dépassements de budget
    const currentYear = new Date().getFullYear()
    const periodeDebut = `${currentYear}-03-01`
    const periodeFin = `${currentYear}-07-31`

    const { data: budgets } = await supabase
        .from("budget")
        .select("*")
        .gte("periode_debut", periodeDebut)
        .lte("periode_fin", periodeFin)

    const { data: transactions } = await supabase
        .from("transactions")
        .select("type, categorie, entree, sortie")
        .gte("date", periodeDebut)
        .lte("date", periodeFin)

    // Calculer les réalisés par catégorie
    const realiseParCategorie: Record<string, number> = {}
    transactions?.forEach(t => {
        const key = `${t.type}-${t.categorie}`
        const montant = t.type === "Recette" ? t.entree : t.sortie
        realiseParCategorie[key] = (realiseParCategorie[key] || 0) + montant
    })

    // Trouver les dépassements (uniquement pour les dépenses)
    const depassements = budgets
        ?.filter(b => b.type === "Dépense")
        .map(b => {
            const key = `${b.type}-${b.categorie}`
            const realise = realiseParCategorie[key] || 0
            const pourcentage = b.budget_alloue > 0 ? (realise / b.budget_alloue) * 100 : 0
            const ecart = realise - b.budget_alloue

            return { ...b, realise, pourcentage, ecart }
        })
        .filter(b => b.pourcentage > 100)
        .sort((a, b) => b.ecart - a.ecart)

    // Ajouter les alertes de dépassement (max 3)
    depassements?.slice(0, 3).forEach((dep, index) => {
        alertes.push({
            id: `depassement-${index}`,
            type: dep.pourcentage > 120 ? "critique" : "warning",
            categorie: "budget",
            titre: `Dépassement : ${dep.categorie}`,
            description: `${dep.pourcentage.toFixed(0)}% du budget consommé (+${dep.ecart.toFixed(0)} MAD)`,
            lien: "/dashboard/budget",
            libelleAction: "Consulter le budget",
        })
    })

    // 4. Vérifier les catégories de dépenses proches du dépassement (> 80% < 100%)
    const prochesDepassement = budgets
        ?.filter(b => b.type === "Dépense")
        .map(b => {
            const key = `${b.type}-${b.categorie}`
            const realise = realiseParCategorie[key] || 0
            const pourcentage = b.budget_alloue > 0 ? (realise / b.budget_alloue) * 100 : 0
            return { ...b, realise, pourcentage }
        })
        .filter(b => b.pourcentage > 80 && b.pourcentage <= 100)
        .sort((a, b) => b.pourcentage - a.pourcentage)

    // Ajouter 1 alerte si proche du dépassement
    if (prochesDepassement && prochesDepassement.length > 0) {
        const proche = prochesDepassement[0]
        alertes.push({
            id: "proche-depassement",
            type: "warning",
            categorie: "budget",
            titre: `Attention : ${proche.categorie}`,
            description: `${proche.pourcentage.toFixed(0)}% du budget consommé (${proche.realise.toFixed(0)}/${proche.budget_alloue} MAD)`,
            lien: "/dashboard/budget",
            libelleAction: "Surveiller le budget",
        })
    }

    // Trier les alertes par priorité (critique d'abord)
    return alertes.sort((a, b) => {
        const priorite = { critique: 0, warning: 1, info: 2 }
        return priorite[a.type] - priorite[b.type]
    })
}

import { createClient } from "@/lib/supabase/server"
import { BudgetClient } from "./budget-client"

export default async function BudgetPage() {
    const supabase = await createClient()

    // Définir la période par défaut (saison Mars-Juillet 2026)
    const currentYear = new Date().getFullYear()
    const periodeDebut = `${currentYear}-03-01`
    const periodeFin = `${currentYear}-07-31`

    // Récupérer les budgets
    const { data: budgets, error: budgetError } = await supabase
        .from("budget")
        .select("*")
        .order("type")
        .order("categorie")

    if (budgetError) {
        console.error("Erreur chargement budgets:", budgetError)
    }

    // Récupérer les transactions pour calculer le réalisé
    const { data: transactions, error: transError } = await supabase
        .from("transactions")
        .select("type, categorie, entree, sortie, date")
        .gte("date", periodeDebut)
        .lte("date", periodeFin)

    if (transError) {
        console.error("Erreur chargement transactions:", transError)
    }

    // Calculer les montants réalisés par catégorie
    const realiseParCategorie: Record<string, number> = {}

    transactions?.forEach(t => {
        // Normaliser la clé (type + catégorie)
        const key = `${t.type}-${t.categorie}`
        const montant = t.type === "Recette" ? t.entree : t.sortie
        realiseParCategorie[key] = (realiseParCategorie[key] || 0) + montant
    })

    // Enrichir les budgets avec les montants réalisés
    const budgetsEnrichis = (budgets || []).map(b => {
        const key = `${b.type}-${b.categorie}`
        const realise = realiseParCategorie[key] || 0
        const ecart = realise - b.budget_alloue
        const pourcentage = b.budget_alloue > 0 ? (realise / b.budget_alloue) * 100 : 0

        let statut: "OK" | "Attention" | "Dépassé"
        if (b.type === "Dépense") {
            // Pour les dépenses : dépassé si > 100%, attention si > 80%
            statut = pourcentage > 100 ? "Dépassé" : pourcentage > 80 ? "Attention" : "OK"
        } else {
            // Pour les recettes : OK si >= 100%, attention si >= 80%, sinon dépassé (sous-performance)
            statut = pourcentage >= 100 ? "OK" : pourcentage >= 80 ? "Attention" : "Dépassé"
        }

        return {
            ...b,
            realise,
            ecart,
            pourcentage,
            statut,
        }
    })

    return (
        <BudgetClient
            budgets={budgetsEnrichis}
            periodeDebut={periodeDebut}
            periodeFin={periodeFin}
        />
    )
}

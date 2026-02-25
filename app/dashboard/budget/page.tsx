import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { BudgetClient } from "./budget-client"

export default async function BudgetPage() {
    const supabase = await createClient()

    // 🔒 Vérification du rôle — Trésorier ou Bureau uniquement
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")
    const role = user.user_metadata?.role || "joueur"
    if (role === "joueur") redirect("/dashboard")

    // Lire les dates de saison depuis les paramètres
    const { data: params } = await supabase
        .from("parametres")
        .select("cle, valeur")
        .in("cle", ["saison_debut", "saison_fin"])

    const paramsMap: Record<string, string> = {}
    params?.forEach(p => { paramsMap[p.cle] = p.valeur })

    // Fallback sur les valeurs par défaut si pas encore en BDD
    const periodeDebut = paramsMap["saison_debut"] || `${new Date().getFullYear()}-03-01`
    const periodeFin = paramsMap["saison_fin"] || `${new Date().getFullYear()}-07-31`

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

    // Déterminer si lecture seule (profil Bureau)
    const cookieStore = await cookies()
    const activeRole = cookieStore.get('active-role')?.value || 'tresorier'
    const readOnly = activeRole === 'bureau'

    return (
        <BudgetClient
            budgets={budgetsEnrichis}
            periodeDebut={periodeDebut}
            periodeFin={periodeFin}
            readOnly={readOnly}
        />
    )
}

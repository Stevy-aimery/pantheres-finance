"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireTresorier } from "@/lib/auth-guard"
import { budgetSchema, uuidSchema, formatZodErrors } from "@/lib/validations"
import type { BudgetFormData } from "@/lib/validations"

// Réexport du type pour les composants existants
export type { BudgetFormData }

export async function createBudget(data: BudgetFormData) {
    // 🔒 Vérification backend : Trésorier uniquement
    try { await requireTresorier() } catch { return { error: "Accès refusé. Action réservée au Trésorier.", success: false } }

    // 🛡️ Validation des données
    const parsed = budgetSchema.safeParse(data)
    if (!parsed.success) {
        return { error: formatZodErrors(parsed.error), success: false }
    }
    const validated = parsed.data

    const supabase = await createClient()

    const { error } = await supabase.from("budget").insert({
        categorie: validated.categorie,
        type: validated.type,
        budget_alloue: validated.budget_alloue,
        periode_debut: validated.periode_debut,
        periode_fin: validated.periode_fin,
    })

    if (error) {
        console.error("Erreur création budget:", error.message)
        return { error: "Erreur lors de la création du budget.", success: false }
    }

    revalidatePath("/dashboard/budget")
    return { success: true }
}

export async function updateBudget(id: string, data: BudgetFormData) {
    // 🔒 Vérification backend : Trésorier uniquement
    try { await requireTresorier() } catch { return { error: "Accès refusé. Action réservée au Trésorier.", success: false } }

    // 🛡️ Validation des données
    const idParsed = uuidSchema.safeParse(id)
    if (!idParsed.success) { return { error: "ID de budget invalide.", success: false } }

    const parsed = budgetSchema.safeParse(data)
    if (!parsed.success) {
        return { error: formatZodErrors(parsed.error), success: false }
    }
    const validated = parsed.data

    const supabase = await createClient()

    const { error } = await supabase
        .from("budget")
        .update({
            categorie: validated.categorie,
            type: validated.type,
            budget_alloue: validated.budget_alloue,
            periode_debut: validated.periode_debut,
            periode_fin: validated.periode_fin,
        })
        .eq("id", idParsed.data)

    if (error) {
        console.error("Erreur mise à jour budget:", error.message)
        return { error: "Erreur lors de la mise à jour du budget.", success: false }
    }

    revalidatePath("/dashboard/budget")
    return { success: true }
}

export async function deleteBudget(id: string) {
    // 🔒 Vérification backend : Trésorier uniquement
    try { await requireTresorier() } catch { return { error: "Accès refusé. Action réservée au Trésorier.", success: false } }

    // 🛡️ Validation de l'ID
    const idParsed = uuidSchema.safeParse(id)
    if (!idParsed.success) { return { error: "ID de budget invalide.", success: false } }

    const supabase = await createClient()

    const { error } = await supabase.from("budget").delete().eq("id", idParsed.data)

    if (error) {
        console.error("Erreur suppression budget:", error.message)
        return { error: "Erreur lors de la suppression du budget.", success: false }
    }

    revalidatePath("/dashboard/budget")
    return { success: true }
}

// Récupérer le budget avec les montants réalisés
export async function getBudgetWithRealise(periodeDebut: string, periodeFin: string) {
    const supabase = await createClient()

    // ⚡ Exécuter les 2 requêtes en parallèle (optimisation N+1)
    const [budgetResult, transResult] = await Promise.all([
        supabase
            .from("budget")
            .select("*")
            .gte("periode_debut", periodeDebut)
            .lte("periode_fin", periodeFin)
            .order("type")
            .order("categorie"),
        supabase
            .from("transactions")
            .select("type, categorie, entree, sortie")
            .gte("date", periodeDebut)
            .lte("date", periodeFin),
    ])

    if (budgetResult.error) {
        console.error("Erreur chargement budgets:", budgetResult.error.message)
        return { error: "Erreur lors du chargement des budgets." }
    }

    if (transResult.error) {
        console.error("Erreur chargement transactions:", transResult.error.message)
        return { error: "Erreur lors du chargement des transactions." }
    }

    const budgets = budgetResult.data
    const transactions = transResult.data

    // Calculer les montants réalisés par catégorie
    const realiseParCategorie: Record<string, number> = {}

    transactions?.forEach(t => {
        const key = `${t.type}-${t.categorie}`
        const montant = t.type === "Recette" ? t.entree : t.sortie
        realiseParCategorie[key] = (realiseParCategorie[key] || 0) + montant
    })

    // Enrichir les budgets avec les montants réalisés
    const budgetsEnrichis = budgets?.map(b => {
        const key = `${b.type}-${b.categorie}`
        const realise = realiseParCategorie[key] || 0
        const ecart = realise - b.budget_alloue
        const pourcentage = b.budget_alloue > 0 ? (realise / b.budget_alloue) * 100 : 0

        let statut: "OK" | "Attention" | "Dépassé"
        if (b.type === "Dépense") {
            statut = pourcentage > 100 ? "Dépassé" : pourcentage > 80 ? "Attention" : "OK"
        } else {
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

    return { data: budgetsEnrichis }
}

"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export interface BudgetFormData {
    categorie: string
    type: "Recette" | "Dépense"
    budget_alloue: number
    periode_debut: string
    periode_fin: string
}

export async function createBudget(data: BudgetFormData) {
    const supabase = await createClient()

    const { error } = await supabase.from("budget").insert({
        categorie: data.categorie,
        type: data.type,
        budget_alloue: data.budget_alloue,
        periode_debut: data.periode_debut,
        periode_fin: data.periode_fin,
    })

    if (error) {
        return { error: error.message, success: false }
    }

    revalidatePath("/dashboard/budget")
    return { success: true }
}

export async function updateBudget(id: string, data: BudgetFormData) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("budget")
        .update({
            categorie: data.categorie,
            type: data.type,
            budget_alloue: data.budget_alloue,
            periode_debut: data.periode_debut,
            periode_fin: data.periode_fin,
        })
        .eq("id", id)

    if (error) {
        return { error: error.message, success: false }
    }

    revalidatePath("/dashboard/budget")
    return { success: true }
}

export async function deleteBudget(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from("budget").delete().eq("id", id)

    if (error) {
        return { error: error.message, success: false }
    }

    revalidatePath("/dashboard/budget")
    return { success: true }
}

// Récupérer le budget avec les montants réalisés
export async function getBudgetWithRealise(periodeDebut: string, periodeFin: string) {
    const supabase = await createClient()

    // Récupérer les budgets de la période
    const { data: budgets, error: budgetError } = await supabase
        .from("budget")
        .select("*")
        .gte("periode_debut", periodeDebut)
        .lte("periode_fin", periodeFin)
        .order("type")
        .order("categorie")

    if (budgetError) {
        return { error: budgetError.message }
    }

    // Récupérer les transactions réalisées par catégorie
    const { data: transactions, error: transError } = await supabase
        .from("transactions")
        .select("type, categorie, entree, sortie")
        .gte("date", periodeDebut)
        .lte("date", periodeFin)

    if (transError) {
        return { error: transError.message }
    }

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

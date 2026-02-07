"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export interface TransactionFormData {
    date: string
    type: "Recette" | "Dépense"
    categorie: string
    sous_categorie?: string
    tiers?: string
    membre_id?: string
    libelle: string
    montant: number
    mode_paiement: string
}

// Version sans redirect pour permettre les toasts côté client
export async function createTransactionAction(data: TransactionFormData) {
    const supabase = await createClient()

    // Calculer entrée ou sortie selon le type
    const entree = data.type === "Recette" ? data.montant : 0
    const sortie = data.type === "Dépense" ? data.montant : 0

    const { error } = await supabase.from("transactions").insert({
        date: data.date,
        type: data.type,
        categorie: data.categorie,
        sous_categorie: data.sous_categorie || null,
        tiers: data.tiers || null,
        membre_id: data.membre_id || null,
        libelle: data.libelle,
        entree,
        sortie,
        mode_paiement: data.mode_paiement,
    })

    if (error) {
        return { error: error.message, success: false }
    }

    revalidatePath("/dashboard/transactions")
    return { success: true }
}

export async function updateTransactionAction(id: string, data: TransactionFormData) {
    const supabase = await createClient()

    const entree = data.type === "Recette" ? data.montant : 0
    const sortie = data.type === "Dépense" ? data.montant : 0

    const { error } = await supabase
        .from("transactions")
        .update({
            date: data.date,
            type: data.type,
            categorie: data.categorie,
            sous_categorie: data.sous_categorie || null,
            tiers: data.tiers || null,
            membre_id: data.membre_id || null,
            libelle: data.libelle,
            entree,
            sortie,
            mode_paiement: data.mode_paiement,
        })
        .eq("id", id)

    if (error) {
        return { error: error.message, success: false }
    }

    revalidatePath("/dashboard/transactions")
    return { success: true }
}

export async function deleteTransaction(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from("transactions").delete().eq("id", id)

    if (error) {
        return { error: error.message, success: false }
    }

    revalidatePath("/dashboard/transactions")
    return { success: true }
}

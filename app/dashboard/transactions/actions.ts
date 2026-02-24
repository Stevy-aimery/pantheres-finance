"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireTresorier } from "@/lib/auth-guard"
import { transactionSchema, uuidSchema, formatZodErrors } from "@/lib/validations"
import type { TransactionFormData } from "@/lib/validations"

// Réexport du type pour les composants existants
export type { TransactionFormData }

export async function createTransactionAction(data: TransactionFormData) {
    // 🔒 Vérification backend : Trésorier uniquement
    try { await requireTresorier() } catch { return { error: "Accès refusé. Action réservée au Trésorier.", success: false } }

    // 🛡️ Validation des données
    const parsed = transactionSchema.safeParse(data)
    if (!parsed.success) {
        return { error: formatZodErrors(parsed.error), success: false }
    }
    const validated = parsed.data

    const supabase = await createClient()

    const entree = validated.type === "Recette" ? validated.montant : 0
    const sortie = validated.type === "Dépense" ? validated.montant : 0

    const { error } = await supabase.from("transactions").insert({
        date: validated.date,
        type: validated.type,
        categorie: validated.categorie,
        sous_categorie: validated.sous_categorie || null,
        tiers: validated.tiers || null,
        membre_id: validated.membre_id || null,
        libelle: validated.libelle,
        entree,
        sortie,
        mode_paiement: validated.mode_paiement,
    })

    if (error) {
        console.error("Erreur création transaction:", error.message)
        return { error: "Erreur lors de la création de la transaction.", success: false }
    }

    revalidatePath("/dashboard/transactions")
    return { success: true }
}

export async function updateTransactionAction(id: string, data: TransactionFormData) {
    // 🔒 Vérification backend : Trésorier uniquement
    try { await requireTresorier() } catch { return { error: "Accès refusé. Action réservée au Trésorier.", success: false } }

    // 🛡️ Validation des données
    const idParsed = uuidSchema.safeParse(id)
    if (!idParsed.success) { return { error: "ID de transaction invalide.", success: false } }

    const parsed = transactionSchema.safeParse(data)
    if (!parsed.success) {
        return { error: formatZodErrors(parsed.error), success: false }
    }
    const validated = parsed.data

    const supabase = await createClient()

    const entree = validated.type === "Recette" ? validated.montant : 0
    const sortie = validated.type === "Dépense" ? validated.montant : 0

    const { error } = await supabase
        .from("transactions")
        .update({
            date: validated.date,
            type: validated.type,
            categorie: validated.categorie,
            sous_categorie: validated.sous_categorie || null,
            tiers: validated.tiers || null,
            membre_id: validated.membre_id || null,
            libelle: validated.libelle,
            entree,
            sortie,
            mode_paiement: validated.mode_paiement,
        })
        .eq("id", idParsed.data)

    if (error) {
        console.error("Erreur mise à jour transaction:", error.message)
        return { error: "Erreur lors de la mise à jour de la transaction.", success: false }
    }

    revalidatePath("/dashboard/transactions")
    return { success: true }
}

export async function deleteTransaction(id: string) {
    // 🔒 Vérification backend : Trésorier uniquement
    try { await requireTresorier() } catch { return { error: "Accès refusé. Action réservée au Trésorier.", success: false } }

    // 🛡️ Validation de l'ID
    const idParsed = uuidSchema.safeParse(id)
    if (!idParsed.success) { return { error: "ID de transaction invalide.", success: false } }

    const supabase = await createClient()

    const { error } = await supabase.from("transactions").delete().eq("id", idParsed.data)

    if (error) {
        console.error("Erreur suppression transaction:", error.message)
        return { error: "Erreur lors de la suppression de la transaction.", success: false }
    }

    revalidatePath("/dashboard/transactions")
    return { success: true }
}

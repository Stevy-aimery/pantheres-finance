"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireTresorier } from "@/lib/auth-guard"
import { membreSchema, uuidSchema, formatZodErrors } from "@/lib/validations"
import type { MembreFormData } from "@/lib/validations"

// Réexport du type pour les composants existants
export type { MembreFormData }

export async function createMembre(data: MembreFormData) {
    // 🔒 Vérification backend : Trésorier uniquement
    try { await requireTresorier() } catch { return { error: "Accès refusé. Action réservée au Trésorier." } }

    // 🛡️ Validation des données
    const parsed = membreSchema.safeParse(data)
    if (!parsed.success) {
        return { error: formatZodErrors(parsed.error) }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from("membres")
        .insert([parsed.data])
        .select()
        .single()

    if (error) {
        console.error("Erreur création membre:", error.message)
        return { error: "Erreur lors de la création du membre." }
    }

    revalidatePath("/dashboard/membres")
    redirect("/dashboard/membres")
}

export async function updateMembre(id: string, data: MembreFormData) {
    // 🔒 Vérification backend : Trésorier uniquement
    try { await requireTresorier() } catch { return { error: "Accès refusé. Action réservée au Trésorier." } }

    // 🛡️ Validation des données
    const idParsed = uuidSchema.safeParse(id)
    if (!idParsed.success) { return { error: "ID de membre invalide." } }

    const parsed = membreSchema.safeParse(data)
    if (!parsed.success) {
        return { error: formatZodErrors(parsed.error) }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from("membres")
        .update(parsed.data)
        .eq("id", idParsed.data)

    if (error) {
        console.error("Erreur mise à jour membre:", error.message)
        return { error: "Erreur lors de la mise à jour du membre." }
    }

    revalidatePath("/dashboard/membres")
    redirect("/dashboard/membres")
}

export async function deleteMembre(id: string) {
    // 🔒 Vérification backend : Trésorier uniquement
    try { await requireTresorier() } catch { return { error: "Accès refusé. Action réservée au Trésorier." } }

    // 🛡️ Validation de l'ID
    const idParsed = uuidSchema.safeParse(id)
    if (!idParsed.success) { return { error: "ID de membre invalide." } }

    const supabase = await createClient()

    const { error } = await supabase
        .from("membres")
        .delete()
        .eq("id", idParsed.data)

    if (error) {
        console.error("Erreur suppression membre:", error.message)
        return { error: "Erreur lors de la suppression du membre." }
    }

    revalidatePath("/dashboard/membres")
    return { success: true }
}


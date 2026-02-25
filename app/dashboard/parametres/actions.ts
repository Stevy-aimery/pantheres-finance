"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { requireTresorier } from "@/lib/auth-guard"
import { z } from "zod"

// ───── Schéma de validation ─────
const updateParametreSchema = z.object({
    id: z.string().uuid("ID invalide"),
    valeur: z.string().min(1, "La valeur ne peut pas être vide").max(1000, "Valeur trop longue"),
})

// ───── Server Action : mise à jour ─────

export async function updateParametre(id: string, valeur: string) {
    // 🔒 Trésorier uniquement
    try { await requireTresorier() } catch { return { error: "Accès refusé. Réservé au Trésorier.", success: false } }

    // 🛡️ Validation
    const parsed = updateParametreSchema.safeParse({ id, valeur })
    if (!parsed.success) {
        return { error: parsed.error.issues.map(e => e.message).join(". "), success: false }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
        .from("parametres")
        .update({
            valeur: parsed.data.valeur,
            updated_by: user?.id || null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", parsed.data.id)

    if (error) {
        console.error("Erreur mise à jour paramètre:", error.message)
        return { error: "Erreur lors de la mise à jour du paramètre.", success: false }
    }

    revalidatePath("/dashboard/parametres")
    return { success: true }
}

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
    const validatedData = parsed.data

    // 1. Insérer le membre en BDD
    const { data: newMembre, error: insertError } = await supabase
        .from("membres")
        .insert([{ ...validatedData, email: validatedData.email.toLowerCase() }])
        .select("id")
        .single()

    if (insertError) {
        console.error("Erreur création membre:", insertError.message)
        if (insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
            return { error: "Un membre avec cet email existe déjà." }
        }
        return { error: "Erreur lors de la création du membre." }
    }

    // 2. Créer le compte Auth Supabase via l'API admin
    try {
        const { createAdminClient } = await import("@/lib/supabase/admin")
        const adminClient = createAdminClient()

        // Déterminer le rôle Auth principal
        let authRole = "joueur"
        if (validatedData.fonction_bureau === "Trésorier") {
            authRole = "tresorier"
        } else if (validatedData.role_bureau) {
            authRole = "bureau"
        }

        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: validatedData.email.toLowerCase(),
            password: "123456",
            email_confirm: true,
            user_metadata: {
                role: authRole,
                nom_prenom: validatedData.nom_prenom,
                force_password_change: true,
                roles: [
                    ...(validatedData.role_joueur ? ["joueur"] : []),
                    ...(validatedData.role_bureau ? ["bureau"] : []),
                    ...(validatedData.fonction_bureau === "Trésorier" ? ["tresorier"] : []),
                ],
            },
        })

        if (authError) {
            console.error("Erreur création Auth:", authError.message)
            // Ne pas bloquer la création du membre si Auth échoue
            // Le trésorier pourra relancer manuellement
        } else if (authData?.user) {
            // 3. Lier le auth_user_id au membre
            await supabase
                .from("membres")
                .update({ auth_user_id: authData.user.id })
                .eq("id", newMembre.id)
        }
    } catch (authErr) {
        console.error("Erreur module Auth:", authErr)
        // Continuer même si Auth n'est pas configuré (SUPABASE_SERVICE_ROLE_KEY manquante)
    }

    // 4. Envoyer l'email de bienvenue (non-bloquant)
    try {
        const { envoyerEmailBienvenue } = await import("@/app/actions/emails")
        await envoyerEmailBienvenue(newMembre.id)
    } catch (emailErr) {
        console.error("Erreur envoi email bienvenue:", emailErr)
        // Non-bloquant : le membre est créé même si l'email échoue
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


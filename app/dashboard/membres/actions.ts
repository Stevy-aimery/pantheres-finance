"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireTresorier } from "@/lib/auth-guard"
import { membreSchema, uuidSchema, formatZodErrors } from "@/lib/validations"
import type { MembreFormData } from "@/lib/validations"



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
    return { success: true, message: "Membre créé avec succès" }
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

    // Récupérer l'ancien email pour détecter un changement
    const { data: existing } = await supabase
        .from("membres")
        .select("email, auth_user_id")
        .eq("id", idParsed.data)
        .maybeSingle()

    const emailChanged = existing && existing.email !== parsed.data.email.toLowerCase()

    // Mettre à jour le membre en BDD
    const { error } = await supabase
        .from("membres")
        .update({ ...parsed.data, email: parsed.data.email.toLowerCase() })
        .eq("id", idParsed.data)

    if (error) {
        console.error("Erreur mise à jour membre:", error.message)
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
            return { error: "Cet email est déjà utilisé par un autre membre." }
        }
        return { error: `Erreur lors de la mise à jour : ${error.message}` }
    }

    // 🔄 Synchroniser l'email dans Auth Supabase si changé
    if (emailChanged && existing?.auth_user_id) {
        try {
            const { createAdminClient } = await import("@/lib/supabase/admin")
            const adminClient = createAdminClient()
            const { error: authError } = await adminClient.auth.admin.updateUserById(
                existing.auth_user_id,
                { email: parsed.data.email.toLowerCase() }
            )
            if (authError) {
                console.warn("Mise à jour email Auth échouée (non bloquant):", authError.message)
            }
        } catch (e) {
            console.warn("Module admin non disponible pour sync email Auth:", e)
        }
    }

    revalidatePath("/dashboard/membres")
    return { success: true, message: "Membre mis à jour avec succès" }
}


export async function deleteMembre(id: string) {
    // 🔒 Vérification backend : Trésorier uniquement
    try { await requireTresorier() } catch { return { error: "Accès refusé. Action réservée au Trésorier." } }

    // 🛡️ Validation de l'ID
    const idParsed = uuidSchema.safeParse(id)
    if (!idParsed.success) { return { error: "ID de membre invalide." } }

    const supabase = await createClient()

    // ⛔ Vérifier qu'on ne supprime pas un compte vital (Trésorier ou Président)
    const { data: membreToCheck } = await supabase
        .from("membres")
        .select("fonction_bureau")
        .eq("id", idParsed.data)
        .single()

    if (membreToCheck && (membreToCheck.fonction_bureau === "Trésorier" || membreToCheck.fonction_bureau === "Président")) {
        return { error: "Action interdite : Impossible de supprimer le Trésorier ou le Président." }
    }

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

export async function toggleMembreStatus(id: string, isDesactive: boolean) {
    // 🔒 Vérification backend : Trésorier uniquement
    try { await requireTresorier() } catch { return { error: "Accès refusé. Action réservée au Trésorier." } }

    const idParsed = uuidSchema.safeParse(id)
    if (!idParsed.success) { return { error: "ID de membre invalide." } }

    const supabase = await createClient()
    const newStatut = isDesactive ? "Désactivé" : "Actif"

    // ⛔ Éviter de désactiver le propre compte du trésorier ou président
    if (isDesactive) {
        const { data: membreToCheck } = await supabase
            .from("membres")
            .select("fonction_bureau")
            .eq("id", idParsed.data)
            .single()

        if (membreToCheck && (membreToCheck.fonction_bureau === "Trésorier" || membreToCheck.fonction_bureau === "Président")) {
            return { error: "Action interdite : Impossible de désactiver le compte du Trésorier ou du Président." }
        }
    }

    const { error } = await supabase
        .from("membres")
        .update({ statut: newStatut })
        .eq("id", idParsed.data)

    if (error) {
        console.error("Erreur toggle statut:", error.message)
        return { error: "Erreur lors de la modification du statut." }
    }

    revalidatePath("/dashboard/membres")
    return { success: true, message: `Membre ${isDesactive ? 'désactivé' : 'réactivé'} avec succès.` }
}


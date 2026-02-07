"use server"

import { resend, EMAIL_FROM } from "@/lib/resend"
import { EmailRelanceCotisation, EmailConfirmationPaiement, EmailRapportMensuel } from "@/emails/templates"
import { createClient } from "@/lib/supabase/server"

/**
 * Envoie un email de relance de cotisation à un membre en retard
 */
export async function envoyerRelanceCotisation(membreId: string) {
    const supabase = await createClient()

    // Récupérer les infos du membre
    const { data: membre } = await supabase
        .from("membres")
        .select("nom_prenom, email, cotisation_mensuelle")
        .eq("id", membreId)
        .single()

    if (!membre) {
        return { error: "Membre introuvable" }
    }

    const moisActuel = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(new Date())

    try {
        const { data, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: [membre.email],
            subject: `Rappel Cotisation - Panthères de Fès`,
            react: EmailRelanceCotisation({
                nomMembre: membre.nom_prenom,
                montant: membre.cotisation_mensuelle,
                mois: moisActuel,
            }),
        })

        if (error) {
            // Logger l'erreur dans la base
            await supabase.from("notifications_log").insert({
                type: "relance_cotisation",
                destinataire_email: membre.email,
                destinataire_id: membreId,
                objet: `Rappel Cotisation - Panthères de Fès`,
                statut: "failed",
                error_message: error.message,
            })

            return { error: error.message }
        }

        // Logger le succès
        await supabase.from("notifications_log").insert({
            type: "relance_cotisation",
            destinataire_email: membre.email,
            destinataire_id: membreId,
            objet: `Rappel Cotisation - Panthères de Fès`,
            corps: `Relance envoyée pour ${moisActuel}`,
            statut: "success",
        })

        return { success: true, messageId: data?.id }
    } catch (error) {
        return { error: String(error) }
    }
}

/**
 * Envoie un email de confirmation de paiement après enregistrement
 */
export async function envoyerConfirmationPaiement(membreId: string, paiementId: string) {
    const supabase = await createClient()

    // Récupérer les infos du membre et du paiement
    const { data: membre } = await supabase
        .from("membres")
        .select("nom_prenom, email, cotisation_mensuelle")
        .eq("id", membreId)
        .single()

    const { data: paiement } = await supabase
        .from("paiements")
        .select("*")
        .eq("id", paiementId)
        .single()

    if (!membre || !paiement) {
        return { error: "Données introuvables" }
    }

    // Calculer le total payé et reste à payer
    const { data: paiements } = await supabase
        .from("paiements")
        .select("montant")
        .eq("membre_id", membreId)
        .eq("annee", new Date().getFullYear())

    const totalPaye = paiements?.reduce((sum, p) => sum + p.montant, 0) || 0
    const totalDu = membre.cotisation_mensuelle * 12
    const resteAPayer = Math.max(0, totalDu - totalPaye)

    const moisNom = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(
        new Date(2026, paiement.mois - 1)
    )

    try {
        const { data, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to: [membre.email],
            subject: `Confirmation de Paiement - Panthères de Fès`,
            react: EmailConfirmationPaiement({
                nomMembre: membre.nom_prenom,
                montant: paiement.montant,
                mois: moisNom,
                totalPaye,
                resteAPayer,
            }),
        })

        if (error) {
            await supabase.from("notifications_log").insert({
                type: "confirmation_paiement",
                destinataire_email: membre.email,
                destinataire_id: membreId,
                objet: `Confirmation de Paiement - Panthères de Fès`,
                statut: "failed",
                error_message: error.message,
            })

            return { error: error.message }
        }

        await supabase.from("notifications_log").insert({
            type: "confirmation_paiement",
            destinataire_email: membre.email,
            destinataire_id: membreId,
            objet: `Confirmation de Paiement - Panthères de Fès`,
            corps: `Confirmation envoyée pour paiement de ${paiement.montant} MAD`,
            statut: "success",
        })

        return { success: true, messageId: data?.id }
    } catch (error) {
        return { error: String(error) }
    }
}

/**
 * Envoie le rapport mensuel à tous les membres du bureau
 */
export async function envoyerRapportMensuel() {
    const supabase = await createClient()

    // Récupérer tous les membres du bureau
    const { data: membresBureau } = await supabase
        .from("membres")
        .select("nom_prenom, email")
        .eq("role_bureau", true)
        .eq("statut", "Actif")

    if (!membresBureau || membresBureau.length === 0) {
        return { error: "Aucun membre du bureau trouvé" }
    }

    // Récupérer les KPIs
    const { data: kpis } = await supabase.from("v_kpis_financiers").select("*").single()

    // Calculer les dépenses du mois en cours
    const moisActuel = new Date().getMonth() + 1
    const anneeActuelle = new Date().getFullYear()

    const { data: depensesMois } = await supabase
        .from("transactions")
        .select("sortie")
        .eq("type", "Dépense")
        .eq("mois", moisActuel)
        .eq("annee", anneeActuelle)

    const totalDepensesMois = depensesMois?.reduce((sum, t) => sum + t.sortie, 0) || 0

    const moisNom = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date())

    const emailsEnvoyes: string[] = []
    const erreursEnvoi: string[] = []

    // Envoyer à chaque membre du bureau
    for (const membre of membresBureau) {
        try {
            const { data, error } = await resend.emails.send({
                from: EMAIL_FROM,
                to: [membre.email],
                subject: `Rapport Financier Mensuel - ${moisNom}`,
                react: EmailRapportMensuel({
                    mois: moisNom,
                    soldeActuel: kpis?.solde_actuel || 0,
                    tauxRecouvrement: kpis?.taux_recouvrement || 0,
                    depensesMois: totalDepensesMois,
                    totalRecettes: kpis?.total_recettes || 0,
                    totalDepenses: kpis?.total_depenses || 0,
                }),
            })

            if (error) {
                erreursEnvoi.push(membre.email)
                await supabase.from("notifications_log").insert({
                    type: "rapport_mensuel",
                    destinataire_email: membre.email,
                    objet: `Rapport Financier Mensuel - ${moisNom}`,
                    statut: "failed",
                    error_message: error.message,
                })
            } else {
                emailsEnvoyes.push(membre.email)
                await supabase.from("notifications_log").insert({
                    type: "rapport_mensuel",
                    destinataire_email: membre.email,
                    objet: `Rapport Financier Mensuel - ${moisNom}`,
                    corps: `Rapport mensuel ${moisNom}`,
                    statut: "success",
                })
            }
        } catch (error) {
            erreursEnvoi.push(membre.email)
        }
    }

    return {
        success: true,
        emailsEnvoyes,
        erreursEnvoi,
        total: membresBureau.length,
    }
}

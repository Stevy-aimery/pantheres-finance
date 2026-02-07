

import { createClient } from "@/lib/supabase/server"
import { envoyerRelanceCotisation } from "@/app/actions/emails"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    // 1. Sécurité : Vérifier le Cron Secret (pour Vercel)
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== "development") {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    // 2. Vérifier la date (double sécurité, le cron ne doit tourner que le 15)
    const today = new Date()
    if (today.getDate() !== 15 && process.env.NODE_ENV !== "development") {
        // return new NextResponse("Ce n'est pas le 15 du mois", { status: 200 })
        // On laisse passer pour les tests manuels ou si le cron est mal configuré mais lancé intentionnellement
    }

    const supabase = await createClient()

    // 3. Identifier les membres en retard
    // On utilise la vue v_etat_cotisations qui calcule déjà le statut "Retard"
    const { data: membresEnRetard, error } = await supabase
        .from("v_etat_cotisations")
        .select("id, nom_prenom, email, reste_a_payer")
        .eq("etat_paiement", "Retard")
        .gt("reste_a_payer", 0) // Sécurité supplémentaire

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!membresEnRetard || membresEnRetard.length === 0) {
        return NextResponse.json({ message: "Aucun membre en retard à relancer" })
    }

    // 4. Envoyer les emails de relance
    const resultats = {
        succes: 0,
        echecs: 0,
        details: [] as any[]
    }

    for (const membre of membresEnRetard) {
        // Vérifier si une relance a déjà été envoyée aujourd'hui pour éviter le spam
        // (Optionnel mais recommandé)

        const result = await envoyerRelanceCotisation(membre.id)

        if (result.success) {
            resultats.succes++
            resultats.details.push({ email: membre.email, status: "sent" })
        } else {
            resultats.echecs++
            resultats.details.push({ email: membre.email, status: "failed", error: result.error })
        }
    }

    return NextResponse.json({
        message: "Traitement des relances terminé",
        stats: resultats
    })
}

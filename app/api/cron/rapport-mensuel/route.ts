

import { envoyerRapportMensuel } from "@/app/actions/emails"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    // 1. Sécurité : Vérifier le Cron Secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== "development") {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    // 2. Vérifier la date (le cron doit tourner le 1er du mois)
    const today = new Date()
    if (today.getDate() !== 1 && process.env.NODE_ENV !== "development") {
        // return new NextResponse("Ce n'est pas le 1er du mois", { status: 200 })
    }

    // 3. Envoyer le rapport mensuel
    const result = await envoyerRapportMensuel()

    if (result.success) {
        return NextResponse.json({
            message: "Rapport mensuel envoyé",
            stats: {
                total: result.total,
                envoyes: result.emailsEnvoyes?.length || 0,
                erreurs: result.erreursEnvoi?.length || 0
            }
        })
    } else {
        return NextResponse.json({
            error: "Erreur lors de l'envoi du rapport",
            details: result.error
        }, { status: 500 })
    }
}

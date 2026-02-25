import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_PASSWORD = "123456"

/**
 * POST /api/admin/create-auth-user
 * Crée un compte Auth Supabase pour un nouveau membre
 * Sécurisé : seul le trésorier connecté peut appeler cette route
 */
export async function POST(request: NextRequest) {
    try {
        // 🔒 Vérifier que l'appelant est le trésorier
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
        }

        const callerRole = user.user_metadata?.role
        if (callerRole !== "tresorier") {
            return NextResponse.json({ error: "Accès refusé. Trésorier uniquement." }, { status: 403 })
        }

        // Récupérer les données du membre
        const body = await request.json()
        const { email, nom_prenom, role_joueur, role_bureau, fonction_bureau } = body

        if (!email || !nom_prenom) {
            return NextResponse.json({ error: "Email et nom sont requis" }, { status: 400 })
        }

        // Déterminer le rôle Auth principal
        let authRole = "joueur"
        if (fonction_bureau === "Trésorier") {
            authRole = "tresorier"
        } else if (role_bureau) {
            authRole = "bureau"
        }

        // Créer le compte Auth via Admin API
        const adminClient = createAdminClient()

        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: email.toLowerCase(),
            password: DEFAULT_PASSWORD,
            email_confirm: true, // Confirmer l'email automatiquement
            user_metadata: {
                role: authRole,
                nom_prenom,
                force_password_change: true,
                roles: [
                    ...(role_joueur ? ["joueur"] : []),
                    ...(role_bureau ? ["bureau"] : []),
                    ...(fonction_bureau === "Trésorier" ? ["tresorier"] : []),
                ],
            },
        })

        if (authError) {
            console.error("[create-auth-user] Erreur Auth:", authError.message)

            // Message d'erreur lisible
            if (authError.message.includes("already been registered")) {
                return NextResponse.json(
                    { error: "Un compte existe déjà avec cet email." },
                    { status: 409 }
                )
            }

            return NextResponse.json(
                { error: "Erreur lors de la création du compte." },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            authUserId: authData.user.id,
        })
    } catch (error) {
        console.error("[create-auth-user] Erreur inattendue:", error)
        return NextResponse.json(
            { error: "Erreur serveur inattendue." },
            { status: 500 }
        )
    }
}

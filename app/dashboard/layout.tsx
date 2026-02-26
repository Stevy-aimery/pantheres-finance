import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { DashboardLayout } from "@/components/dashboard/layout"

export default async function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }


    // Récupérer les informations du membre (par auth_user_id, fallback email)
    let fonctionBureau: string | null = null
    let memberId: string | null = null

    let { data: membre } = await supabase
        .from("membres")
        .select("id, fonction_bureau, statut")
        .eq("auth_user_id", user.id)
        .single()

    // Fallback par email si auth_user_id pas encore peuplé
    if (!membre) {
        const { data: membreByEmail } = await supabase
            .from("membres")
            .select("id, fonction_bureau, statut")
            .eq("email", user.email)
            .single()
        membre = membreByEmail
    }

    // 🛡️ Blocage d'accès : Membre supprimé ou Désactivé
    if (!membre) {
        // Le compte auth existe mais plus le membre
        redirect("/login?error=account_deleted")
    }

    if (membre.statut === "Désactivé") {
        redirect("/login?error=account_disabled")
    }

    if (membre) {
        memberId = membre.id
        fonctionBureau = membre.fonction_bureau
    }

    // Déterminer le rôle effectif (cookie active-role > user_metadata.role)
    const cookieStore = await cookies()
    const activeRoleCookie = cookieStore.get('active-role')?.value
    const mainRole = user.user_metadata?.role || "joueur"
    // Construire roles[] avec fallback si absent (anciens comptes)
    let roles = (user.user_metadata?.roles as string[]) || []
    if (roles.length === 0) {
        roles = [mainRole]
    }
    const effectiveRole = activeRoleCookie || mainRole
    const hasMultiRoles = roles.length > 1

    return (
        <DashboardLayout
            user={user}
            role={effectiveRole}
            fonctionBureau={fonctionBureau}
            memberId={memberId}
            hasMultiRoles={hasMultiRoles}
        >
            {children}
        </DashboardLayout>
    )
}

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
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

    // Récupérer le rôle de l'utilisateur depuis les metadata
    const role = user.user_metadata?.role || "joueur"

    // Récupérer les informations du membre liées à cet utilisateur
    let fonctionBureau: string | null = null
    let memberId: string | null = null

    const { data: membre } = await supabase
        .from("membres")
        .select("id, fonction_bureau")
        .eq("email", user.email)
        .single()

    if (membre) {
        memberId = membre.id
        fonctionBureau = membre.fonction_bureau
    }

    return (
        <DashboardLayout
            user={user}
            role={role}
            fonctionBureau={fonctionBureau}
            memberId={memberId}
        >
            {children}
        </DashboardLayout>
    )
}

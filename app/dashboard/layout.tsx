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

    // Récupérer le rôle de l'utilisateur
    const role = user.user_metadata?.role || "joueur"

    return (
        <DashboardLayout user={user} role={role}>
            {children}
        </DashboardLayout>
    )
}

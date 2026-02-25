import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ParametresClient } from "./parametres-client"
import type { Parametre } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function ParametresPage() {
    const supabase = await createClient()

    // 🔒 Trésorier uniquement
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")
    const role = user.user_metadata?.role || "joueur"
    if (role !== "tresorier") redirect("/dashboard")

    // Charger les paramètres
    const { data, error } = await supabase
        .from("parametres")
        .select("*")
        .order("cle")

    if (error) {
        console.error("Erreur chargement paramètres:", error.message)
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-muted-foreground">Erreur lors du chargement des paramètres.</p>
            </div>
        )
    }

    return <ParametresClient parametres={(data as Parametre[]) || []} />
}

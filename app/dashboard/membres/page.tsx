import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MembresClient } from "./membres-client"

export const dynamic = "force-dynamic"

async function requireBureauOrTresorier() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")
    const role = user.user_metadata?.role || "joueur"
    if (role === "joueur") redirect("/dashboard")
    return supabase
}

async function getMembres() {
    const supabase = await createClient()

    const { data: membres, error } = await supabase
        .from("membres")
        .select("*")
        .order("nom_prenom")

    if (error) {
        console.error("Error fetching membres:", error)
        return []
    }

    return membres
}

async function getEtatCotisations() {
    const supabase = await createClient()

    const { data: cotisations, error } = await supabase
        .from("v_etat_cotisations")
        .select("*")

    if (error) {
        console.error("Error fetching cotisations:", error)
        return {}
    }

    // Créer un map id -> cotisation
    const cotisationsMap: Record<string, typeof cotisations[0]> = {}
    cotisations?.forEach(c => {
        cotisationsMap[c.id] = c
    })

    return cotisationsMap
}

export default async function MembresPage() {
    await requireBureauOrTresorier()

    const membres = await getMembres()
    const cotisations = await getEtatCotisations()

    return <MembresClient membres={membres} cotisations={cotisations} />
}

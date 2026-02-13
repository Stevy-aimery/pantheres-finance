import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MessagesClient } from "./messages-client"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const role = user.user_metadata?.role || "joueur"

    // Récupérer les infos du membre connecté
    const { data: currentMembre } = await supabase
        .from("membres")
        .select("id, nom_prenom, fonction_bureau, role_bureau")
        .eq("email", user.email)
        .single()

    // Récupérer les messages
    // Pour le trésorier : tous les messages
    // Pour les autres : leurs propres messages uniquement
    let messagesQuery = supabase
        .from("messages")
        .select(`
            *,
            auteur:membre_id(id, nom_prenom, fonction_bureau),
            reponses:messages!parent_id(
                id,
                contenu,
                created_at,
                is_from_tresorier,
                auteur:membre_id(id, nom_prenom)
            )
        `)
        .is("parent_id", null)
        .order("created_at", { ascending: false })

    if (role !== "tresorier") {
        messagesQuery = messagesQuery.eq("membre_id", currentMembre?.id)
    }

    const { data: messages } = await messagesQuery

    return (
        <MessagesClient
            messages={messages || []}
            currentMembre={currentMembre}
            role={role}
        />
    )
}

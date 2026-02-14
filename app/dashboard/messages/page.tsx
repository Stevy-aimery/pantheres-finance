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

    // ─── Récupérer les messages (architecture flat pour chat) ───
    // Tous les messages sont dans la même table, liés par membre_id
    // Pour le trésorier : tous les messages
    // Pour les autres : seulement LEURS messages
    let messagesQuery = supabase
        .from("messages")
        .select(`
            id,
            contenu,
            sujet,
            type_message,
            statut,
            created_at,
            is_from_tresorier,
            membre_id,
            parent_id,
            auteur:membre_id(id, nom_prenom, fonction_bureau)
        `)
        .order("created_at", { ascending: true })

    if (role !== "tresorier") {
        // Un joueur ne voit que ses messages
        messagesQuery = messagesQuery.eq("membre_id", currentMembre?.id)
    }

    const { data: messages } = await messagesQuery

    // ─── Pour le trésorier : récupérer la liste des conversations (membres uniques) ───
    let conversations: { id: string; nom_prenom: string; fonction_bureau: string | null }[] = []

    if (role === "tresorier") {
        // Récupérer tous les membres qui ont des messages
        const memberIds = [...new Set((messages || []).map(m => m.membre_id))]

        if (memberIds.length > 0) {
            const { data: membres } = await supabase
                .from("membres")
                .select("id, nom_prenom, fonction_bureau")
                .in("id", memberIds)

            conversations = membres || []
        }
    }

    return (
        <MessagesClient
            messages={(messages as any) || []}
            conversations={conversations}
            currentMembre={currentMembre}
            role={role}
        />
    )
}

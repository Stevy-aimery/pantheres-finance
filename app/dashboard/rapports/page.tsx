import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RapportsClient } from "./rapports-client"

export const dynamic = "force-dynamic"

export default async function RapportsPage() {
    const supabase = await createClient()

    // 🔒 Vérification du rôle — Trésorier ou Bureau uniquement
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")
    const role = user.user_metadata?.role || "joueur"
    if (role === "joueur") redirect("/dashboard")

    // Récupérer les transactions
    const { data: transactions } = await supabase
        .from("transactions")
        .select("id, date, type, categorie, libelle, entree, sortie, mode_paiement")
        .order("date", { ascending: false })

    // Récupérer les membres
    const { data: membres } = await supabase
        .from("membres")
        .select("id, nom_prenom, email, telephone, statut, role_joueur, role_bureau, fonction_bureau, cotisation_mensuelle, date_entree")
        .order("nom_prenom")

    // Récupérer l'état des cotisations
    const { data: cotisations } = await supabase
        .from("v_etat_cotisations")
        .select("id, nom_prenom, cotisation_mensuelle, total_paye, reste_a_payer, pourcentage_paye, etat_paiement")
        .order("nom_prenom")

    // Récupérer les KPIs
    const { data: kpis } = await supabase
        .from("v_kpis")
        .select("*")
        .single()

    const stats = {
        solde: kpis?.solde_actuel || 0,
        totalRecettes: kpis?.total_recettes || 0,
        totalDepenses: kpis?.total_depenses || 0,
        tauxRecouvrement: kpis?.taux_recouvrement || 0,
    }

    return (
        <RapportsClient
            transactions={transactions || []}
            membres={membres || []}
            cotisations={cotisations || []}
            stats={stats}
        />
    )
}

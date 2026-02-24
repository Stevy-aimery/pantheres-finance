import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TransactionsClient } from "./transactions-client"

export default async function TransactionsPage() {
    const supabase = await createClient()

    // 🔒 Vérification du rôle — Trésorier ou Bureau uniquement
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")
    const role = user.user_metadata?.role || "joueur"
    if (role === "joueur") redirect("/dashboard")

    // Récupérer les transactions avec tri par date décroissante
    const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Erreur lors du chargement des transactions:", error)
    }

    const transactionsList = transactions || []

    // Calculer les totaux
    const totalRecettes = transactionsList.reduce((acc, t) => acc + (t.entree || 0), 0)
    const totalDepenses = transactionsList.reduce((acc, t) => acc + (t.sortie || 0), 0)
    const soldeActuel = totalRecettes - totalDepenses

    return (
        <TransactionsClient
            transactions={transactionsList}
            soldeActuel={soldeActuel}
            totalRecettes={totalRecettes}
            totalDepenses={totalDepenses}
        />
    )
}

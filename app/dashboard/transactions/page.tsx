import { createClient } from "@/lib/supabase/server"
import { TransactionsClient } from "./transactions-client"

export default async function TransactionsPage() {
    const supabase = await createClient()

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

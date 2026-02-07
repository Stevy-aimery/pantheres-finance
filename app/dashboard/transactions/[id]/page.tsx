import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TransactionForm } from "../transaction-form"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ModifierTransactionPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Récupérer la transaction
    const { data: transaction, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !transaction) {
        notFound()
    }

    // Récupérer la liste des membres
    const { data: membres } = await supabase
        .from("membres")
        .select("id, nom_prenom")
        .eq("statut", "Actif")
        .order("nom_prenom")

    // Récupérer la liste des sponsors actifs
    const { data: sponsorsData } = await supabase
        .from("sponsors")
        .select("id, nom")
        .eq("actif", true)
        .order("nom")

    const sponsors = sponsorsData?.map(s => ({
        id: s.id,
        nom: s.nom
    })) || []

    return (
        <TransactionForm
            transaction={transaction}
            membres={membres || []}
            sponsors={sponsors}
        />
    )
}

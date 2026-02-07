import { createClient } from "@/lib/supabase/server"
import { TransactionForm } from "../transaction-form"

export default async function NouvelleTransactionPage() {
    const supabase = await createClient()

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

    // Transformer les sponsors pour le format attendu
    const sponsors = sponsorsData?.map(s => ({
        id: s.id,
        nom: s.nom
    })) || []

    return (
        <TransactionForm
            membres={membres || []}
            sponsors={sponsors}
        />
    )
}

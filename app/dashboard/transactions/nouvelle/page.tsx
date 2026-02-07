import { createClient } from "@/lib/supabase/server"
import { TransactionForm } from "../transaction-form"

export default async function NouvelleTransactionPage() {
    const supabase = await createClient()

    // Récupérer la liste des membres pour le champ "membre concerné"
    const { data: membres } = await supabase
        .from("membres")
        .select("id, nom_prenom")
        .eq("statut", "Actif")
        .order("nom_prenom")

    return <TransactionForm membres={membres || []} />
}

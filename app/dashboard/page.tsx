import { createClient } from "@/lib/supabase/server"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { CotisationsStatus } from "@/components/dashboard/cotisations-status"
import { BudgetOverview } from "@/components/dashboard/budget-overview"

export const dynamic = "force-dynamic"

async function getKPIs() {
    const supabase = await createClient()

    // Récupérer les KPIs depuis la vue
    const { data: kpis } = await supabase
        .from("v_kpis_financiers")
        .select("*")
        .single()

    // Récupérer le nombre de membres actifs
    const { count: membresActifs } = await supabase
        .from("membres")
        .select("*", { count: "exact", head: true })
        .eq("statut", "Actif")

    // Récupérer le nombre de membres en retard
    const { data: cotisationsStatus } = await supabase
        .from("v_etat_cotisations")
        .select("etat_paiement")

    const membresEnRetard = cotisationsStatus?.filter(m => m.etat_paiement === "Retard").length || 0

    return {
        soldeActuel: kpis?.solde_actuel || 0,
        totalRecettes: kpis?.total_recettes || 0,
        totalDepenses: kpis?.total_depenses || 0,
        fondsReserve: kpis?.fonds_reserve || 0,
        tauxRecouvrement: kpis?.taux_recouvrement || 0,
        membresActifs: membresActifs || 0,
        membresEnRetard,
    }
}

async function getRecentTransactions() {
    const supabase = await createClient()

    const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(5)

    return transactions || []
}

async function getCotisationsStatus() {
    const supabase = await createClient()

    const { data: cotisations } = await supabase
        .from("v_etat_cotisations")
        .select("*")
        .order("nom_prenom")

    return cotisations || []
}

async function getBudgetOverview() {
    const supabase = await createClient()

    const { data: budget } = await supabase
        .from("budget")
        .select("*")
        .eq("type", "Dépense")

    // Pour chaque catégorie, calculer le réalisé
    const budgetWithRealise = await Promise.all(
        (budget || []).map(async (item) => {
            const { data: transactions } = await supabase
                .from("transactions")
                .select("sortie")
                .eq("categorie", item.categorie)
                .eq("type", "Dépense")

            const realise = transactions?.reduce((sum, t) => sum + (t.sortie || 0), 0) || 0

            return {
                ...item,
                realise,
                ecart: item.budget_alloue - realise,
                pourcentage: item.budget_alloue > 0 ? (realise / item.budget_alloue) * 100 : 0,
            }
        })
    )

    return budgetWithRealise
}

export default async function DashboardPage() {
    const kpis = await getKPIs()
    const transactions = await getRecentTransactions()
    const cotisations = await getCotisationsStatus()
    const budget = await getBudgetOverview()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Vue d&apos;ensemble de la situation financière
                </p>
            </div>

            {/* KPI Cards */}
            <KPICards data={kpis} />

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Transactions */}
                <RecentTransactions transactions={transactions} />

                {/* Cotisations Status */}
                <CotisationsStatus cotisations={cotisations} />
            </div>

            {/* Budget Overview */}
            <BudgetOverview budget={budget} />
        </div>
    )
}

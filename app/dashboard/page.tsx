import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { CotisationsStatus } from "@/components/dashboard/cotisations-status"
import { BudgetOverview } from "@/components/dashboard/budget-overview"
import { AlertesPanel } from "@/components/dashboard/alertes-panel"
import { JoueurDashboard } from "@/components/dashboard/joueur-dashboard"
import { genererAlertes } from "@/lib/alertes"
import { SEASON_CONFIG } from "@/lib/config"

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

// Données joueur
async function getJoueurData(email: string) {
    const supabase = await createClient()

    // Récupérer les infos du membre
    const { data: membre } = await supabase
        .from("membres")
        .select("*")
        .eq("email", email)
        .single()

    if (!membre) return null

    // Récupérer le statut de cotisation
    const { data: cotisation } = await supabase
        .from("v_etat_cotisations")
        .select("*")
        .eq("id", membre.id)
        .single()

    // Calculer le total dû basé sur les mois écoulés
    const now = new Date()
    const seasonStart = new Date(SEASON_CONFIG.startDate)
    let monthsElapsed = (now.getFullYear() - seasonStart.getFullYear()) * 12 + (now.getMonth() - seasonStart.getMonth())
    monthsElapsed = Math.min(Math.max(monthsElapsed + 1, 1), SEASON_CONFIG.durationMonths)
    const totalDu = monthsElapsed * membre.cotisation_mensuelle

    // Récupérer l'historique des paiements
    const { data: paiements } = await supabase
        .from("paiements")
        .select("*")
        .eq("membre_id", membre.id)
        .order("date_paiement", { ascending: false })

    return {
        membre: {
            id: membre.id,
            nom_prenom: membre.nom_prenom,
            email: membre.email,
            telephone: membre.telephone,
            statut: membre.statut,
            date_entree: membre.date_entree,
            cotisation_mensuelle: membre.cotisation_mensuelle,
        },
        cotisation: {
            total_paye: cotisation?.total_paye || 0,
            total_du: totalDu,
            reste_a_payer: Math.max(totalDu - (cotisation?.total_paye || 0), 0),
            pourcentage_paye: totalDu > 0 ? ((cotisation?.total_paye || 0) / totalDu) * 100 : 0,
            etat_paiement: cotisation?.etat_paiement || "Non défini",
        },
        paiements: paiements || [],
    }
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const role = user?.user_metadata?.role || "joueur"

    // Si joueur, afficher dashboard personnel
    if (role === "joueur" && user?.email) {
        const joueurData = await getJoueurData(user.email)

        if (joueurData) {
            return <JoueurDashboard {...joueurData} />
        }
    }

    // Dashboard global pour Trésorier et Bureau
    const kpis = await getKPIs()
    const transactions = await getRecentTransactions()
    const cotisations = await getCotisationsStatus()
    const budget = await getBudgetOverview()
    const alertes = await genererAlertes()

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

            {/* Alertes Panel */}
            <AlertesPanel alertes={alertes} />

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

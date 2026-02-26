"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
    TrendingUp,
    TrendingDown,
    Users,
    CheckCircle2,
    AlertCircle,
    Info,
    PiggyBank,
    BarChart3,
} from "lucide-react"

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("fr-MA", {
        style: "decimal",
        minimumFractionDigits: 0,
    }).format(amount) + " MAD"
}

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface BureauInfoPanelProps {
    // Financier
    soldeActuel?: number
    totalRecettes?: number
    totalDepenses?: number
    // Cotisations
    membresActifs?: number
    membresEnRetard?: number
    tauxRecouvrement?: number
    // Budget
    budgetAlertes?: number    // catégories dépassées
    budgetAttentions?: number // catégories en vigilance
    totalBudget?: number
    totalRealise?: number
    // Contrôle affichage
    sections?: ("finance" | "cotisations" | "budget")[]
}

// ═══════════════════════════════════════════
// Sous-composant : carte info
// ═══════════════════════════════════════════

interface InfoCardProps {
    icon: React.ReactNode
    label: string
    value: string
    sub?: string
    tone: "green" | "amber" | "red" | "blue" | "neutral"
}

const TONE_STYLES: Record<InfoCardProps["tone"], string> = {
    green: "border-emerald-500/30 bg-emerald-500/5",
    amber: "border-amber-500/30 bg-amber-500/5",
    red: "border-red-500/30 bg-red-500/5",
    blue: "border-blue-500/30 bg-blue-500/5",
    neutral: "border-border bg-muted/30",
}
const TONE_TEXT: Record<InfoCardProps["tone"], string> = {
    green: "text-emerald-500",
    amber: "text-amber-500",
    red: "text-red-500",
    blue: "text-blue-500",
    neutral: "text-muted-foreground",
}

function InfoCard({ icon, label, value, sub, tone }: InfoCardProps) {
    return (
        <div className={`flex items-start gap-3 p-4 rounded-lg border ${TONE_STYLES[tone]}`}>
            <div className={`mt-0.5 shrink-0 ${TONE_TEXT[tone]}`}>{icon}</div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                <p className={`text-sm font-semibold mt-0.5 ${TONE_TEXT[tone]}`}>{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════
// Composant principal
// ═══════════════════════════════════════════

export function BureauInfoPanel({
    soldeActuel,
    totalRecettes,
    totalDepenses,
    membresActifs,
    membresEnRetard = 0,
    tauxRecouvrement,
    budgetAlertes = 0,
    budgetAttentions = 0,
    totalBudget,
    totalRealise,
    sections = ["finance", "cotisations", "budget"],
}: BureauInfoPanelProps) {
    const cards: InfoCardProps[] = []

    // ── Section Finance ──────────────────────────────────
    if (sections.includes("finance") && soldeActuel !== undefined) {
        const isExcedent = soldeActuel >= 0
        cards.push({
            icon: isExcedent
                ? <TrendingUp className="w-4 h-4" />
                : <TrendingDown className="w-4 h-4" />,
            label: "Situation financière",
            value: isExcedent
                ? `Excédent de ${formatCurrency(soldeActuel)}`
                : `Déficit de ${formatCurrency(Math.abs(soldeActuel))}`,
            sub: totalRecettes !== undefined && totalDepenses !== undefined
                ? `Recettes ${formatCurrency(totalRecettes)} · Dépenses ${formatCurrency(totalDepenses)}`
                : undefined,
            tone: isExcedent ? "green" : "red",
        })
    }

    // ── Section Cotisations ──────────────────────────────
    if (sections.includes("cotisations") && membresActifs !== undefined) {
        const membresAJour = membresActifs - membresEnRetard
        const taux = tauxRecouvrement ?? (membresActifs > 0 ? Math.round((membresAJour / membresActifs) * 100) : 0)
        const cotTone: InfoCardProps["tone"] = taux >= 80 ? "green" : taux >= 50 ? "amber" : "red"

        cards.push({
            icon: <Users className="w-4 h-4" />,
            label: "Cotisations saison",
            value: `${taux}% recouvrés`,
            sub: `${membresAJour} à jour · ${membresEnRetard} en retard (sur ${membresActifs} actifs)`,
            tone: cotTone,
        })
    }

    if (sections.includes("cotisations") && tauxRecouvrement !== undefined && membresActifs === undefined) {
        // Mode simplifié : taux seul
        const taux = Math.round(tauxRecouvrement)
        const tone: InfoCardProps["tone"] = taux >= 80 ? "green" : taux >= 50 ? "amber" : "red"
        cards.push({
            icon: <Users className="w-4 h-4" />,
            label: "Taux de recouvrement",
            value: `${taux}% des cotisations encaissées`,
            sub: membresEnRetard > 0 ? `${membresEnRetard} membre(s) en retard` : "Tous les membres sont à jour",
            tone,
        })
    }

    // ── Section Budget ───────────────────────────────────
    if (sections.includes("budget")) {
        if (budgetAlertes > 0) {
            cards.push({
                icon: <AlertCircle className="w-4 h-4" />,
                label: "État du budget",
                value: `${budgetAlertes} catégorie(s) dépassée(s)`,
                sub: budgetAttentions > 0
                    ? `+ ${budgetAttentions} catégorie(s) en vigilance (>80%)`
                    : "Révision recommandée lors de la prochaine réunion",
                tone: "red",
            })
        } else if (budgetAttentions > 0) {
            cards.push({
                icon: <BarChart3 className="w-4 h-4" />,
                label: "État du budget",
                value: `${budgetAttentions} catégorie(s) à surveiller`,
                sub: "Consommation > 80% du budget alloué",
                tone: "amber",
            })
        } else if (totalBudget !== undefined && totalRealise !== undefined) {
            const pct = totalBudget > 0 ? Math.round((totalRealise / totalBudget) * 100) : 0
            cards.push({
                icon: <CheckCircle2 className="w-4 h-4" />,
                label: "État du budget",
                value: `Budget maîtrisé — ${pct}% consommé`,
                sub: `Réalisé ${formatCurrency(totalRealise)} sur ${formatCurrency(totalBudget)} alloués`,
                tone: "green",
            })
        }

        if (totalBudget !== undefined && totalRealise !== undefined) {
            const solde = totalBudget - totalRealise
            cards.push({
                icon: <PiggyBank className="w-4 h-4" />,
                label: "Réserve budgétaire",
                value: solde >= 0
                    ? `${formatCurrency(solde)} disponibles`
                    : `Dépassement de ${formatCurrency(Math.abs(solde))}`,
                tone: solde >= 0 ? "blue" : "red",
            })
        }
    }

    if (cards.length === 0) return null

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <Info className="w-3.5 h-3.5" />
                Aperçu · Mode consultation
            </div>
            <div className={`grid gap-3 ${cards.length === 1 ? "grid-cols-1" : cards.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                {cards.map((card, i) => (
                    <InfoCard key={i} {...card} />
                ))}
            </div>
        </div>
    )
}

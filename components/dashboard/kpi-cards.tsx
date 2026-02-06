"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    PiggyBank,
    Users,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardsProps {
    data: {
        soldeActuel: number
        totalRecettes: number
        totalDepenses: number
        fondsReserve: number
        tauxRecouvrement: number
        membresActifs: number
        membresEnRetard: number
    }
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("fr-MA", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + " MAD"
}

export function KPICards({ data }: KPICardsProps) {
    const kpis = [
        {
            title: "Solde Actuel",
            value: formatCurrency(data.soldeActuel),
            icon: Wallet,
            trend: data.soldeActuel >= 0 ? "up" : "down",
            color: data.soldeActuel >= 0 ? "text-emerald-500" : "text-red-500",
            bgColor: data.soldeActuel >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
        },
        {
            title: "Total Recettes",
            value: formatCurrency(data.totalRecettes),
            icon: TrendingUp,
            trend: "up",
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
        },
        {
            title: "Total Dépenses",
            value: formatCurrency(data.totalDepenses),
            icon: TrendingDown,
            trend: "down",
            color: "text-red-500",
            bgColor: "bg-red-500/10",
        },
        {
            title: "Fonds de Réserve",
            value: formatCurrency(data.fondsReserve),
            subtitle: "10% des recettes",
            icon: PiggyBank,
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
        },
        {
            title: "Taux de Recouvrement",
            value: `${data.tauxRecouvrement.toFixed(1)}%`,
            icon: Users,
            subtitle: `${data.membresActifs} membres actifs`,
            color: data.tauxRecouvrement >= 90 ? "text-emerald-500" :
                data.tauxRecouvrement >= 70 ? "text-amber-500" : "text-red-500",
            bgColor: data.tauxRecouvrement >= 90 ? "bg-emerald-500/10" :
                data.tauxRecouvrement >= 70 ? "bg-amber-500/10" : "bg-red-500/10",
        },
    ]

    return (
        <div className="space-y-4">
            {/* Alert for late payments */}
            {data.membresEnRetard > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-500">
                            {data.membresEnRetard} membre{data.membresEnRetard > 1 ? "s" : ""} en retard de cotisation
                        </p>
                    </div>
                    <Badge variant="destructive" className="flex-shrink-0">
                        Action requise
                    </Badge>
                </div>
            )}

            {/* KPI Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {kpis.map((kpi) => (
                    <Card key={kpi.title} className="relative overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                                    <p className={cn("text-2xl font-bold tracking-tight", kpi.color)}>
                                        {kpi.value}
                                    </p>
                                    {kpi.subtitle && (
                                        <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
                                    )}
                                </div>
                                <div className={cn("p-2 rounded-lg", kpi.bgColor)}>
                                    <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                                </div>
                            </div>

                            {/* Trend indicator */}
                            {kpi.trend && (
                                <div className="absolute bottom-2 right-2">
                                    {kpi.trend === "up" ? (
                                        <ArrowUpRight className="w-4 h-4 text-emerald-500/50" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4 text-red-500/50" />
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

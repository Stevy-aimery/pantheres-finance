"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, PiggyBank, AlertTriangle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface BudgetItem {
    id: string
    categorie: string
    budget_alloue: number
    realise: number
    ecart: number
    pourcentage: number
}

interface BudgetOverviewProps {
    budget: BudgetItem[]
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("fr-MA", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function BudgetOverview({ budget }: BudgetOverviewProps) {
    const totalBudget = budget.reduce((sum, item) => sum + item.budget_alloue, 0)
    const totalRealise = budget.reduce((sum, item) => sum + item.realise, 0)
    const globalPourcentage = totalBudget > 0 ? (totalRealise / totalBudget) * 100 : 0

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <PiggyBank className="w-5 h-5 text-muted-foreground" />
                        Budget Prévisionnel
                    </CardTitle>
                    <Badge
                        variant="secondary"
                        className={cn(
                            "gap-1",
                            globalPourcentage > 100
                                ? "bg-red-500/10 text-red-500"
                                : globalPourcentage > 80
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-emerald-500/10 text-emerald-500"
                        )}
                    >
                        {globalPourcentage.toFixed(0)}% utilisé
                    </Badge>
                </div>
                <Link href="/dashboard/budget">
                    <Button variant="ghost" size="sm" className="gap-1">
                        Détails <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {budget.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <PiggyBank className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Aucun budget défini
                        </p>
                        <Link href="/dashboard/budget">
                            <Button size="sm">Configurer le budget</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Summary Bar */}
                        <div className="p-4 rounded-lg bg-muted/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Total Dépenses</span>
                                <span className="text-sm">
                                    <span className="font-semibold">{formatCurrency(totalRealise)}</span>
                                    <span className="text-muted-foreground"> / {formatCurrency(totalBudget)} MAD</span>
                                </span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all",
                                        globalPourcentage > 100
                                            ? "bg-red-500"
                                            : globalPourcentage > 80
                                                ? "bg-amber-500"
                                                : "bg-emerald-500"
                                    )}
                                    style={{ width: `${Math.min(globalPourcentage, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Budget Items */}
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {budget.slice(0, 6).map((item) => {
                                const isOver = item.pourcentage > 100
                                const isWarning = item.pourcentage > 80

                                return (
                                    <div
                                        key={item.id}
                                        className="p-3 rounded-lg border border-border bg-card"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium truncate">{item.categorie}</span>
                                            {isOver ? (
                                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">
                                                    {formatCurrency(item.realise)} / {formatCurrency(item.budget_alloue)}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "font-medium",
                                                        isOver ? "text-red-500" : isWarning ? "text-amber-500" : "text-muted-foreground"
                                                    )}
                                                >
                                                    {item.pourcentage.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                                                    )}
                                                    style={{ width: `${Math.min(item.pourcentage, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

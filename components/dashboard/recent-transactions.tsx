"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Receipt, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Transaction {
    id: string
    date: string
    type: string
    categorie: string
    libelle: string
    entree: number
    sortie: number
}

interface RecentTransactionsProps {
    transactions: Transaction[]
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("fr-MA", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
    }).format(date)
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-muted-foreground" />
                    Dernières Transactions
                </CardTitle>
                <Link href="/dashboard/transactions">
                    <Button variant="ghost" size="sm" className="gap-1">
                        Voir tout <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Receipt className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Aucune transaction enregistrée
                        </p>
                        <Link href="/dashboard/transactions/new">
                            <Button size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Ajouter une transaction
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((transaction) => {
                            const isRecette = transaction.type === "Recette"
                            const amount = isRecette ? transaction.entree : transaction.sortie

                            return (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium",
                                                isRecette ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                            )}
                                        >
                                            {formatDate(transaction.date)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium truncate max-w-[180px]">
                                                {transaction.libelle || transaction.categorie}
                                            </p>
                                            <Badge variant="secondary" className="text-xs mt-1">
                                                {transaction.categorie}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p
                                            className={cn(
                                                "font-semibold",
                                                isRecette ? "text-emerald-500" : "text-red-500"
                                            )}
                                        >
                                            {isRecette ? "+" : "-"}{formatCurrency(amount)} MAD
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

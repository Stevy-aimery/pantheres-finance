"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowRight, Users, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CotisationMembre {
    id: string
    nom_prenom: string
    cotisation_mensuelle: number
    total_paye: number
    reste_a_payer: number
    etat_paiement: string
    pourcentage_paye: number
}

interface CotisationsStatusProps {
    cotisations: CotisationMembre[]
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("fr-MA", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function CotisationsStatus({ cotisations }: CotisationsStatusProps) {
    // Trier : retards en premier
    const sorted = [...cotisations].sort((a, b) => {
        if (a.etat_paiement === "Retard" && b.etat_paiement !== "Retard") return -1
        if (a.etat_paiement !== "Retard" && b.etat_paiement === "Retard") return 1
        return a.nom_prenom.localeCompare(b.nom_prenom)
    })

    // Limiter à 5
    const display = sorted.slice(0, 5)

    const totalAJour = cotisations.filter(c => c.etat_paiement === "À Jour").length
    const totalRetard = cotisations.filter(c => c.etat_paiement === "Retard").length

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        État Cotisations
                    </CardTitle>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            {totalAJour} à jour
                        </Badge>
                        {totalRetard > 0 && (
                            <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {totalRetard} retard
                            </Badge>
                        )}
                    </div>
                </div>
                <Link href="/dashboard/membres">
                    <Button variant="ghost" size="sm" className="gap-1">
                        Voir tout <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {cotisations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Users className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Aucun membre actif
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {display.map((membre) => {
                            const initials = membre.nom_prenom
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()

                            const isRetard = membre.etat_paiement === "Retard"

                            return (
                                <div
                                    key={membre.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback
                                                className={cn(
                                                    "text-xs",
                                                    isRetard
                                                        ? "bg-red-500/10 text-red-500"
                                                        : "bg-emerald-500/10 text-emerald-500"
                                                )}
                                            >
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{membre.nom_prenom}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all",
                                                            isRetard ? "bg-red-500" : "bg-emerald-500"
                                                        )}
                                                        style={{ width: `${Math.min(membre.pourcentage_paye, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {membre.pourcentage_paye.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {isRetard ? (
                                            <p className="text-sm font-medium text-red-500">
                                                -{formatCurrency(membre.reste_a_payer)} MAD
                                            </p>
                                        ) : (
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-0">
                                                À jour
                                            </Badge>
                                        )}
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

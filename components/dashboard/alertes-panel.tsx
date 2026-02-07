"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, AlertCircle, TrendingDown, Users, Wallet } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export interface Alerte {
    id: string
    type: "critique" | "warning" | "info"
    categorie: "budget" | "solde" | "recouvrement" | "autre"
    titre: string
    description: string
    lien?: string
    libelleAction?: string
}

interface AlertesPanelProps {
    alertes: Alerte[]
}

export function AlertesPanel({ alertes }: AlertesPanelProps) {
    const alertesCritiques = alertes.filter(a => a.type === "critique")
    const alertesWarning = alertes.filter(a => a.type === "warning")

    if (alertes.length === 0) {
        return (
            <Card className="border-emerald-500/50 bg-emerald-500/5">
                <CardContent className="flex items-center gap-3 py-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <svg
                            className="w-5 h-5 text-emerald-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <div>
                        <p className="font-semibold text-emerald-600">Aucune alerte</p>
                        <p className="text-sm text-muted-foreground">
                            Tous les indicateurs sont au vert ✨
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const getIcon = (categorie: string) => {
        switch (categorie) {
            case "budget":
                return <TrendingDown className="h-4 w-4" />
            case "solde":
                return <Wallet className="h-4 w-4" />
            case "recouvrement":
                return <Users className="h-4 w-4" />
            default:
                return <AlertTriangle className="h-4 w-4" />
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "critique":
                return "text-red-500 bg-red-500/10 border-red-500/50"
            case "warning":
                return "text-amber-500 bg-amber-500/10 border-amber-500/50"
            default:
                return "text-blue-500 bg-blue-500/10 border-blue-500/50"
        }
    }

    return (
        <Card className={
            alertesCritiques.length > 0
                ? "border-red-500/50 bg-red-500/5"
                : "border-amber-500/50 bg-amber-500/5"
        }>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        {alertesCritiques.length > 0 ? (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                        )}
                        <span className={alertesCritiques.length > 0 ? "text-red-500" : "text-amber-500"}>
                            Alertes ({alertes.length})
                        </span>
                    </CardTitle>
                    <div className="flex gap-2">
                        {alertesCritiques.length > 0 && (
                            <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {alertesCritiques.length} critique{alertesCritiques.length > 1 ? "s" : ""}
                            </Badge>
                        )}
                        {alertesWarning.length > 0 && (
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/50 gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {alertesWarning.length} attention
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {alertes.map((alerte) => (
                    <div
                        key={alerte.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 ${getTypeColor(alerte.type)}`}
                    >
                        <div className="mt-0.5">
                            {getIcon(alerte.categorie)}
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="font-semibold text-sm leading-tight">
                                {alerte.titre}
                            </p>
                            <p className="text-sm opacity-90 leading-tight">
                                {alerte.description}
                            </p>
                            {alerte.lien && alerte.libelleAction && (
                                <Link href={alerte.lien}>
                                    <Button
                                        variant="link"
                                        className="h-auto p-0 text-xs font-semibold underline"
                                    >
                                        {alerte.libelleAction} →
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

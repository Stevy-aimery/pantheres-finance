"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    User,
    Mail,
    Phone,
    Calendar,
    CreditCard,
    CheckCircle,
    AlertCircle,
    Clock,
    TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface JoueurDashboardProps {
    membre: {
        id: string
        nom_prenom: string
        email: string
        telephone: string
        statut: string
        date_entree: string
        cotisation_mensuelle: number
    }
    cotisation: {
        total_paye: number
        total_du: number
        reste_a_payer: number
        pourcentage_paye: number
        etat_paiement: string
    }
    paiements: {
        id: string
        mois: string
        montant: number
        date_paiement: string
        mode_paiement: string
    }[]
}

export function JoueurDashboard({ membre, cotisation, paiements }: JoueurDashboardProps) {
    const getStatutBadge = (statut: string) => {
        switch (statut) {
            case "Actif":
                return <Badge className="bg-emerald-500/20 text-emerald-500">Actif</Badge>
            case "Inactif":
                return <Badge className="bg-red-500/20 text-red-500">Inactif</Badge>
            default:
                return <Badge variant="secondary">{statut}</Badge>
        }
    }

    const getEtatIcon = (etat: string) => {
        switch (etat) {
            case "À jour":
                return <CheckCircle className="w-5 h-5 text-emerald-500" />
            case "Retard":
                return <AlertCircle className="w-5 h-5 text-red-500" />
            case "Partiel":
                return <Clock className="w-5 h-5 text-amber-500" />
            default:
                return <CreditCard className="w-5 h-5 text-muted-foreground" />
        }
    }

    const getEtatColor = (etat: string) => {
        switch (etat) {
            case "À jour":
                return "text-emerald-500"
            case "Retard":
                return "text-red-500"
            case "Partiel":
                return "text-amber-500"
            default:
                return "text-muted-foreground"
        }
    }

    return (
        <div className="space-y-6">
            {/* Header personnalisé */}
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {membre.nom_prenom.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Bienvenue, {membre.nom_prenom.split(" ")[0]} 👋
                    </h1>
                    <p className="text-muted-foreground">
                        Voici votre espace personnel
                    </p>
                </div>
            </div>

            {/* Carte statut cotisation */}
            <Card className={cn(
                "border-2",
                cotisation.etat_paiement === "À jour" && "border-emerald-500/30 bg-emerald-500/5",
                cotisation.etat_paiement === "Retard" && "border-red-500/30 bg-red-500/5",
                cotisation.etat_paiement === "Partiel" && "border-amber-500/30 bg-amber-500/5",
            )}>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            {getEtatIcon(cotisation.etat_paiement)}
                            Statut de cotisation
                        </CardTitle>
                        <Badge className={cn(
                            "text-sm px-3 py-1",
                            cotisation.etat_paiement === "À jour" && "bg-emerald-500 text-white",
                            cotisation.etat_paiement === "Retard" && "bg-red-500 text-white",
                            cotisation.etat_paiement === "Partiel" && "bg-amber-500 text-white",
                        )}>
                            {cotisation.etat_paiement}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-lg bg-background">
                            <p className="text-2xl font-bold text-emerald-500">
                                {cotisation.total_paye.toFixed(0)} MAD
                            </p>
                            <p className="text-xs text-muted-foreground">Total payé</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-background">
                            <p className="text-2xl font-bold text-muted-foreground">
                                {cotisation.total_du.toFixed(0)} MAD
                            </p>
                            <p className="text-xs text-muted-foreground">Total dû</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-background">
                            <p className={cn("text-2xl font-bold", getEtatColor(cotisation.etat_paiement))}>
                                {cotisation.reste_a_payer.toFixed(0)} MAD
                            </p>
                            <p className="text-xs text-muted-foreground">Reste à payer</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-background">
                            <p className="text-2xl font-bold text-amber-500">
                                {membre.cotisation_mensuelle.toFixed(0)} MAD
                            </p>
                            <p className="text-xs text-muted-foreground">/ mois</p>
                        </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Progression des paiements</span>
                            <span className="font-medium">{cotisation.pourcentage_paye.toFixed(0)}%</span>
                        </div>
                        <Progress
                            value={cotisation.pourcentage_paye}
                            className={cn(
                                "h-3",
                                cotisation.etat_paiement === "À jour" && "[&>div]:bg-emerald-500",
                                cotisation.etat_paiement === "Retard" && "[&>div]:bg-red-500",
                                cotisation.etat_paiement === "Partiel" && "[&>div]:bg-amber-500",
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Informations personnelles */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-amber-500" />
                            Mes informations
                        </CardTitle>
                        <CardDescription>Vos coordonnées enregistrées</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Nom complet</p>
                                <p className="font-medium">{membre.nom_prenom}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{membre.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Téléphone</p>
                                <p className="font-medium">{membre.telephone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Membre depuis</p>
                                <p className="font-medium">
                                    {new Date(membre.date_entree).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Statut</p>
                                {getStatutBadge(membre.statut)}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Historique des paiements */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-500" />
                            Mes paiements
                        </CardTitle>
                        <CardDescription>Historique de vos cotisations versées</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paiements.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Aucun paiement enregistré</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {paiements.map((paiement) => (
                                    <div
                                        key={paiement.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{paiement.mois}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(paiement.date_paiement).toLocaleDateString("fr-FR")}
                                                    {" • "}
                                                    {paiement.mode_paiement}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-emerald-500">
                                            +{paiement.montant.toFixed(0)} MAD
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

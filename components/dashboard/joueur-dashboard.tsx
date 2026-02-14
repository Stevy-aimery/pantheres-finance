"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
    Wallet,
    BadgeCheck,
    Banknote,
    Receipt,
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
    const firstName = membre.nom_prenom.split(" ")[0]
    const initials = membre.nom_prenom.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

    const isAJour = cotisation.etat_paiement === "À jour"
    const isRetard = cotisation.etat_paiement === "Retard"
    const isPartiel = cotisation.etat_paiement === "Partiel"

    const statusColor = isAJour ? "emerald" : isRetard ? "red" : "amber"

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("fr-MA", { style: "decimal", minimumFractionDigits: 0 }).format(amount) + " MAD"

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })

    return (
        <div className="space-y-8">
            {/* ==================== HEADER ==================== */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-6 md:p-8 text-white">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20" />
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/15" />
                    <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/10" />
                </div>

                <div className="relative flex items-center gap-5">
                    <div className="w-18 h-18 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold border border-white/30 shadow-lg">
                        {initials}
                    </div>
                    <div>
                        <p className="text-white/80 text-sm font-medium">Bienvenue 👋</p>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            {firstName}
                        </h1>
                        <p className="text-white/70 text-sm mt-1">
                            Votre espace personnel · Saison 2025-2026
                        </p>
                    </div>
                </div>
            </div>

            {/* ==================== KPI CARDS ==================== */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Total payé */}
                <Card className="group hover:shadow-md transition-all duration-200">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Total cotisations</p>
                                <p className="text-3xl font-bold text-emerald-500">
                                    {formatCurrency(cotisation.total_paye)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    sur {formatCurrency(cotisation.total_du)} dû
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/15 transition-colors">
                                <Wallet className="w-6 h-6 text-emerald-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Statut cotisation */}
                <Card className={cn(
                    "group hover:shadow-md transition-all duration-200 border-l-4",
                    isAJour && "border-l-emerald-500",
                    isRetard && "border-l-red-500",
                    isPartiel && "border-l-amber-500",
                )}>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Statut cotisation</p>
                                <Badge className={cn(
                                    "text-sm px-3 py-1 font-semibold",
                                    isAJour && "bg-emerald-500 hover:bg-emerald-600 text-white",
                                    isRetard && "bg-red-500 hover:bg-red-600 text-white",
                                    isPartiel && "bg-amber-500 hover:bg-amber-600 text-white",
                                )}>
                                    {isAJour && <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                                    {isRetard && <AlertCircle className="w-3.5 h-3.5 mr-1.5" />}
                                    {isPartiel && <Clock className="w-3.5 h-3.5 mr-1.5" />}
                                    {cotisation.etat_paiement}
                                </Badge>
                                {cotisation.reste_a_payer > 0 && (
                                    <p className={cn("text-xs font-medium", `text-${statusColor}-500`)}>
                                        Reste : {formatCurrency(cotisation.reste_a_payer)}
                                    </p>
                                )}
                            </div>
                            <div className={cn(
                                "p-3 rounded-xl transition-colors",
                                `bg-${statusColor}-500/10 group-hover:bg-${statusColor}-500/15`
                            )}>
                                <BadgeCheck className={cn("w-6 h-6", `text-${statusColor}-500`)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cotisation mensuelle */}
                <Card className="group hover:shadow-md transition-all duration-200 sm:col-span-2 lg:col-span-1">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground font-medium">Cotisation mensuelle</p>
                                <p className="text-3xl font-bold text-amber-500">
                                    {formatCurrency(membre.cotisation_mensuelle)}
                                </p>
                                <p className="text-xs text-muted-foreground">/mois</p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/15 transition-colors">
                                <Banknote className="w-6 h-6 text-amber-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ==================== PROGRESS BAR ==================== */}
            <Card>
                <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Progression des paiements</p>
                        <span className={cn(
                            "text-sm font-bold",
                            isAJour ? "text-emerald-500" : isRetard ? "text-red-500" : "text-amber-500"
                        )}>
                            {cotisation.pourcentage_paye.toFixed(0)}%
                        </span>
                    </div>
                    <Progress
                        value={cotisation.pourcentage_paye}
                        className={cn(
                            "h-3 rounded-full",
                            isAJour && "[&>div]:bg-emerald-500",
                            isRetard && "[&>div]:bg-red-500",
                            isPartiel && "[&>div]:bg-amber-500",
                        )}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(cotisation.total_paye)} payé</span>
                        <span>{formatCurrency(cotisation.total_du)} total</span>
                    </div>
                </CardContent>
            </Card>

            {/* ==================== HISTORIQUE + PROFIL ==================== */}
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Historique des transactions (3/5) */}
                <Card className="lg:col-span-3">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-amber-500" />
                            <CardTitle className="text-lg">Historique des paiements</CardTitle>
                        </div>
                        <CardDescription>Détail de vos cotisations versées</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paiements.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">Aucun paiement enregistré</p>
                                <p className="text-sm">Vos paiements apparaîtront ici</p>
                            </div>
                        ) : (
                            <ScrollArea className="max-h-[400px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold">Date</TableHead>
                                            <TableHead className="text-xs font-semibold">Motif</TableHead>
                                            <TableHead className="text-xs font-semibold">Mode</TableHead>
                                            <TableHead className="text-xs font-semibold text-right">Montant</TableHead>
                                            <TableHead className="text-xs font-semibold text-center">Statut</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paiements.map((paiement) => (
                                            <TableRow key={paiement.id} className="group">
                                                <TableCell className="text-sm">
                                                    {formatDate(paiement.date_paiement)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-medium">{paiement.mois}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="text-xs font-normal">
                                                        {paiement.mode_paiement}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-sm font-semibold text-emerald-500">
                                                        +{formatCurrency(paiement.montant)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-xs">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Payé
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                {/* Section Profil (2/5) */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-amber-500" />
                            <CardTitle className="text-lg">Mon profil</CardTitle>
                        </div>
                        <CardDescription>Vos informations personnelles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            { icon: User, label: "Nom complet", value: membre.nom_prenom },
                            { icon: Mail, label: "Email", value: membre.email },
                            { icon: Phone, label: "Téléphone", value: membre.telephone },
                            {
                                icon: Calendar,
                                label: "Membre depuis",
                                value: new Date(membre.date_entree).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                }),
                            },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                <div className="p-2 rounded-lg bg-background">
                                    <Icon className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className="text-sm font-medium truncate">{value}</p>
                                </div>
                            </div>
                        ))}

                        {/* Statut */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="p-2 rounded-lg bg-background">
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Statut</p>
                                <Badge className={cn(
                                    "mt-0.5",
                                    membre.statut === "Actif" && "bg-emerald-500/10 text-emerald-500 border-0",
                                    membre.statut === "Blessé" && "bg-amber-500/10 text-amber-500 border-0",
                                    membre.statut === "Arrêt/Départ" && "bg-red-500/10 text-red-500 border-0",
                                )}>
                                    {membre.statut}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

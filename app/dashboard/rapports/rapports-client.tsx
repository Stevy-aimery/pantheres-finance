"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    FileSpreadsheet,
    FileText,
    Users,
    Receipt,
    PiggyBank,
    Download,
    Loader2,
    TrendingUp,
    ChevronDown,
} from "lucide-react"
import { toast } from "sonner"
import { convertToCSV, downloadCSV, formatDateExport, formatMontantExport } from "@/lib/export"
import { exportToExcel, EXCEL_COLUMNS } from "@/lib/export-excel"

interface Transaction {
    id: string
    date: string
    type: "Recette" | "Dépense"
    categorie: string
    libelle: string
    entree: number
    sortie: number
    mode_paiement: string
}

interface Membre {
    id: string
    nom_prenom: string
    email: string
    telephone: string
    statut: string
    role_joueur: boolean
    role_bureau: boolean
    fonction_bureau: string | null
    cotisation_mensuelle: number
    date_entree: string
}

interface Cotisation {
    id: string
    nom_prenom: string
    cotisation_mensuelle: number
    total_paye: number
    reste_a_payer: number
    pourcentage_paye: number
    etat_paiement: string
}

interface RapportsClientProps {
    transactions: Transaction[]
    membres: Membre[]
    cotisations: Cotisation[]
    stats: {
        solde: number
        totalRecettes: number
        totalDepenses: number
        tauxRecouvrement: number
    }
}

export function RapportsClient({ transactions, membres, cotisations, stats }: RapportsClientProps) {
    const [exportingType, setExportingType] = useState<string | null>(null)

    // ===== EXPORT CSV =====
    const handleExportCSV = async (type: string) => {
        setExportingType(`${type}-csv`)
        const dateStr = new Date().toISOString().split("T")[0]

        try {
            switch (type) {
                case "transactions": {
                    const data = transactions.map(t => ({
                        date_transaction: t.date,
                        type: t.type,
                        categorie: t.categorie,
                        description: t.libelle,
                        montant: t.type === "Recette" ? t.entree : -t.sortie,
                        mode_paiement: t.mode_paiement,
                    }))
                    const columns = [
                        { key: "date_transaction" as const, label: "Date", format: formatDateExport },
                        { key: "type" as const, label: "Type" },
                        { key: "categorie" as const, label: "Catégorie" },
                        { key: "description" as const, label: "Description" },
                        { key: "montant" as const, label: "Montant (MAD)", format: formatMontantExport },
                        { key: "mode_paiement" as const, label: "Mode de paiement" },
                    ]
                    downloadCSV(convertToCSV(data, columns), `transactions_${dateStr}`)
                    toast.success("Export CSV réussi!", { description: `${data.length} transactions exportées` })
                    break
                }

                case "membres": {
                    const columns = [
                        { key: "nom_prenom" as const, label: "Nom Prénom" },
                        { key: "email" as const, label: "Email" },
                        { key: "telephone" as const, label: "Téléphone" },
                        { key: "statut" as const, label: "Statut" },
                        { key: "role_joueur" as const, label: "Joueur", format: (v: boolean) => v ? "Oui" : "Non" },
                        { key: "role_bureau" as const, label: "Bureau", format: (v: boolean) => v ? "Oui" : "Non" },
                        { key: "fonction_bureau" as const, label: "Fonction Bureau" },
                        { key: "cotisation_mensuelle" as const, label: "Cotisation (MAD)", format: formatMontantExport },
                        { key: "date_entree" as const, label: "Date d'entrée", format: formatDateExport },
                    ]
                    downloadCSV(convertToCSV(membres, columns), `membres_${dateStr}`)
                    toast.success("Export CSV réussi!", { description: `${membres.length} membres exportés` })
                    break
                }

                case "cotisations": {
                    const columns = [
                        { key: "nom_prenom" as const, label: "Membre" },
                        { key: "cotisation_mensuelle" as const, label: "Mensuelle (MAD)", format: formatMontantExport },
                        { key: "total_paye" as const, label: "Payé (MAD)", format: formatMontantExport },
                        { key: "reste_a_payer" as const, label: "Reste (MAD)", format: formatMontantExport },
                        { key: "pourcentage_paye" as const, label: "% Payé", format: (v: number) => `${v.toFixed(0)}%` },
                        { key: "etat_paiement" as const, label: "État" },
                    ]
                    downloadCSV(convertToCSV(cotisations, columns), `cotisations_${dateStr}`)
                    toast.success("Export CSV réussi!", { description: `${cotisations.length} lignes exportées` })
                    break
                }
            }
        } catch (error) {
            toast.error("Erreur lors de l'export CSV")
        } finally {
            setExportingType(null)
        }
    }

    // ===== EXPORT EXCEL STYLISÉ =====
    const handleExportExcel = async (type: string) => {
        setExportingType(`${type}-excel`)

        try {
            switch (type) {
                case "transactions": {
                    const data = transactions.map(t => ({
                        date: t.date,
                        type: t.type === "Recette" ? "✅ Recette" : "📤 Dépense",
                        categorie: t.categorie,
                        description: t.libelle,
                        montant: t.type === "Recette" ? t.entree : -t.sortie,
                        mode_paiement: t.mode_paiement,
                    }))
                    await exportToExcel(data, EXCEL_COLUMNS.transactions, {
                        title: "Journal des Transactions",
                        subtitle: `Panthères de Fès • Saison 2025-2026`,
                        filename: "transactions_pantheres",
                        sheetName: "Transactions",
                    })
                    toast.success("Export Excel réussi! 📊", {
                        description: `${data.length} transactions avec mise en forme`
                    })
                    break
                }

                case "membres": {
                    const data = membres.map(m => ({
                        nom_prenom: m.nom_prenom,
                        email: m.email,
                        telephone: m.telephone,
                        statut: m.statut,
                        role: [
                            m.role_joueur ? "Joueur" : "",
                            m.role_bureau ? "Bureau" : ""
                        ].filter(Boolean).join(" + ") || "N/A",
                        fonction_bureau: m.fonction_bureau || "-",
                        cotisation_mensuelle: m.cotisation_mensuelle,
                        date_entree: m.date_entree,
                    }))
                    await exportToExcel(data, EXCEL_COLUMNS.membres, {
                        title: "Liste des Membres",
                        subtitle: `Panthères de Fès • ${membres.length} membres`,
                        filename: "membres_pantheres",
                        sheetName: "Membres",
                    })
                    toast.success("Export Excel réussi! 📊", {
                        description: `${data.length} membres avec mise en forme`
                    })
                    break
                }

                case "cotisations": {
                    await exportToExcel(cotisations, EXCEL_COLUMNS.cotisations, {
                        title: "État des Cotisations",
                        subtitle: `Panthères de Fès • Taux de recouvrement: ${stats.tauxRecouvrement.toFixed(0)}%`,
                        filename: "cotisations_pantheres",
                        sheetName: "Cotisations",
                    })
                    toast.success("Export Excel réussi! 📊", {
                        description: `${cotisations.length} lignes avec mise en forme`
                    })
                    break
                }
            }
        } catch (error) {
            console.error("Erreur export Excel:", error)
            toast.error("Erreur lors de l'export Excel")
        } finally {
            setExportingType(null)
        }
    }

    const exportCards = [
        {
            id: "transactions",
            title: "Journal des Transactions",
            description: "Recettes et dépenses détaillées",
            icon: Receipt,
            count: transactions.length,
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
        },
        {
            id: "membres",
            title: "Liste des Membres",
            description: "Informations et contacts",
            icon: Users,
            count: membres.length,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        {
            id: "cotisations",
            title: "État des Cotisations",
            description: "Paiements et retards",
            icon: PiggyBank,
            count: cotisations.length,
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Rapports & Exports</h1>
                <p className="text-muted-foreground">
                    Téléchargez vos données au format CSV ou Excel (avec mise en forme)
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.solde.toFixed(0)} MAD</p>
                                <p className="text-xs text-muted-foreground">Solde actuel</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Users className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{membres.length}</p>
                                <p className="text-xs text-muted-foreground">Membres</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Receipt className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{transactions.length}</p>
                                <p className="text-xs text-muted-foreground">Transactions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <PiggyBank className="w-4 h-4 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.tauxRecouvrement.toFixed(0)}%</p>
                                <p className="text-xs text-muted-foreground">Taux recouvrement</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Export Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {exportCards.map((card) => (
                    <Card key={card.id} className="hover:border-amber-500/50 transition-colors">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                                    <card.icon className={`w-6 h-6 ${card.color}`} />
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                    {card.count} lignes
                                </Badge>
                            </div>
                            <CardTitle className="mt-4">{card.title}</CardTitle>
                            <CardDescription>{card.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {/* Bouton Excel (principal) */}
                            <Button
                                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleExportExcel(card.id)}
                                disabled={exportingType !== null}
                            >
                                {exportingType === `${card.id}-excel` ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Export en cours...
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="w-4 h-4" />
                                        Télécharger Excel
                                    </>
                                )}
                            </Button>

                            {/* Bouton CSV (secondaire) */}
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={() => handleExportCSV(card.id)}
                                disabled={exportingType !== null}
                            >
                                {exportingType === `${card.id}-csv` ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Export en cours...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-4 h-4" />
                                        Télécharger CSV
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Info Card */}
            <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Fichiers Excel stylisés</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Les exports Excel incluent automatiquement :
                            </p>
                            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                                <li>En-tête avec le logo Panthères de Fès</li>
                                <li>Couleurs alternées pour une meilleure lisibilité</li>
                                <li>Statuts colorés (vert = OK, rouge = retard)</li>
                                <li>Ligne de totaux automatique</li>
                                <li>Formatage des montants et dates</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    FileSpreadsheet,
    FileText,
    Users,
    Receipt,
    PiggyBank,
    Download,
    Loader2,
    Calendar,
    TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import { convertToCSV, downloadCSV, formatDateExport, formatMontantExport } from "@/lib/export"

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

    const handleExport = async (type: string) => {
        setExportingType(type)
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
                    toast.success("Export Transactions!", { description: `${data.length} lignes exportées` })
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
                    toast.success("Export Membres!", { description: `${membres.length} membres exportés` })
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
                    toast.success("Export Cotisations!", { description: `${cotisations.length} lignes exportées` })
                    break
                }
            }
        } catch (error) {
            toast.error("Erreur lors de l'export")
        } finally {
            setExportingType(null)
        }
    }

    const exportCards = [
        {
            id: "transactions",
            title: "Journal des Transactions",
            description: "Toutes les recettes et dépenses",
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
                    Téléchargez vos données au format CSV (compatible Excel)
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
                        <CardContent>
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={() => handleExport(card.id)}
                                disabled={exportingType !== null}
                            >
                                {exportingType === card.id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Export en cours...
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="w-4 h-4" />
                                        Télécharger CSV
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Info Card */}
            <Card className="border-dashed">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Génération de rapports PDF</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                La génération de rapports PDF personnalisés sera disponible dans une prochaine mise à jour.
                                En attendant, vous pouvez ouvrir les fichiers CSV dans Excel pour les mettre en forme et imprimer.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

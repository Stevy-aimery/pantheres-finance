"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Plus,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    Trash2,
    Pencil,
    Target,
    Wallet,
    PiggyBank,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { deleteBudget } from "./actions"
import { toast } from "sonner"

// Types
interface BudgetItem {
    id: string
    categorie: string
    type: "Recette" | "Dépense"
    budget_alloue: number
    periode_debut: string
    periode_fin: string
    realise: number
    ecart: number
    pourcentage: number
    statut: "OK" | "Attention" | "Dépassé"
}

interface BudgetClientProps {
    budgets: BudgetItem[]
    periodeDebut: string
    periodeFin: string
}

// Formatter pour les montants
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-MA", {
        style: "currency",
        currency: "MAD",
        minimumFractionDigits: 0,
    }).format(amount)
}

export function BudgetClient({ budgets, periodeDebut, periodeFin }: BudgetClientProps) {
    const router = useRouter()
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [budgetToDelete, setBudgetToDelete] = useState<BudgetItem | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Séparer recettes et dépenses
    const budgetsRecettes = budgets.filter(b => b.type === "Recette")
    const budgetsDepenses = budgets.filter(b => b.type === "Dépense")

    // Calculs totaux
    const totalBudgetRecettes = budgetsRecettes.reduce((acc, b) => acc + b.budget_alloue, 0)
    const totalRealiseRecettes = budgetsRecettes.reduce((acc, b) => acc + b.realise, 0)
    const totalBudgetDepenses = budgetsDepenses.reduce((acc, b) => acc + b.budget_alloue, 0)
    const totalRealiseDepenses = budgetsDepenses.reduce((acc, b) => acc + b.realise, 0)
    const soldePrevisionnel = totalBudgetRecettes - totalBudgetDepenses
    const soldeRealise = totalRealiseRecettes - totalRealiseDepenses

    // Alertes
    const alertes = budgets.filter(b => b.statut === "Dépassé")
    const attentions = budgets.filter(b => b.statut === "Attention")

    const handleDelete = async () => {
        if (!budgetToDelete) return
        setIsDeleting(true)

        const result = await deleteBudget(budgetToDelete.id)

        if (result.error) {
            toast.error("Erreur lors de la suppression", { description: result.error })
        } else {
            toast.success("Budget supprimé")
            router.refresh()
        }

        setIsDeleting(false)
        setDeleteDialogOpen(false)
        setBudgetToDelete(null)
    }

    const getStatutBadge = (statut: string, type: string) => {
        if (statut === "OK") {
            return (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    OK
                </Badge>
            )
        }
        if (statut === "Attention") {
            return (
                <Badge className="bg-amber-500/10 text-amber-500 border-0">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Attention
                </Badge>
            )
        }
        return (
            <Badge className="bg-red-500/10 text-red-500 border-0">
                <AlertCircle className="w-3 h-3 mr-1" />
                Dépassé
            </Badge>
        )
    }

    const BudgetTable = ({ items, type }: { items: BudgetItem[], type: "Recette" | "Dépense" }) => (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {type === "Recette" ? (
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                        ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <CardTitle>{type}s</CardTitle>
                    </div>
                    <Link href={`/dashboard/budget/nouveau?type=${type}`}>
                        <Button size="sm" variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Ajouter
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Aucun budget défini pour les {type.toLowerCase()}s
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Catégorie</TableHead>
                                <TableHead className="text-right">Budget</TableHead>
                                <TableHead className="text-right">Réalisé</TableHead>
                                <TableHead className="text-right">Écart</TableHead>
                                <TableHead className="w-[180px]">Progression</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((budget) => (
                                <TableRow key={budget.id}>
                                    <TableCell className="font-medium">{budget.categorie}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(budget.budget_alloue)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(budget.realise)}</TableCell>
                                    <TableCell className={cn(
                                        "text-right font-medium",
                                        type === "Dépense"
                                            ? budget.ecart > 0 ? "text-red-500" : "text-emerald-500"
                                            : budget.ecart >= 0 ? "text-emerald-500" : "text-red-500"
                                    )}>
                                        {budget.ecart >= 0 ? "+" : ""}{formatCurrency(budget.ecart)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress
                                                value={Math.min(budget.pourcentage, 100)}
                                                className={cn(
                                                    "h-2",
                                                    budget.statut === "OK" && "[&>div]:bg-emerald-500",
                                                    budget.statut === "Attention" && "[&>div]:bg-amber-500",
                                                    budget.statut === "Dépassé" && "[&>div]:bg-red-500"
                                                )}
                                            />
                                            <span className="text-xs text-muted-foreground w-12">
                                                {budget.pourcentage.toFixed(0)}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatutBadge(budget.statut, type)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Link href={`/dashboard/budget/${budget.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                                onClick={() => {
                                                    setBudgetToDelete(budget)
                                                    setDeleteDialogOpen(true)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {/* Ligne de total */}
                            <TableRow className="bg-muted/50 font-semibold">
                                <TableCell>Total {type}s</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(type === "Recette" ? totalBudgetRecettes : totalBudgetDepenses)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(type === "Recette" ? totalRealiseRecettes : totalRealiseDepenses)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(
                                        type === "Recette"
                                            ? totalRealiseRecettes - totalBudgetRecettes
                                            : totalRealiseDepenses - totalBudgetDepenses
                                    )}
                                </TableCell>
                                <TableCell colSpan={3}></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Budget Prévisionnel</h1>
                    <p className="text-muted-foreground">
                        Période : {new Date(periodeDebut).toLocaleDateString("fr-FR")} - {new Date(periodeFin).toLocaleDateString("fr-FR")}
                    </p>
                </div>
                <Link href="/dashboard/budget/nouveau">
                    <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                        <Plus className="h-4 w-4" />
                        Nouveau budget
                    </Button>
                </Link>
            </div>

            {/* KPIs Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Budget Recettes
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalBudgetRecettes)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Réalisé : {formatCurrency(totalRealiseRecettes)} ({totalBudgetRecettes > 0 ? ((totalRealiseRecettes / totalBudgetRecettes) * 100).toFixed(0) : 0}%)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Budget Dépenses
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalBudgetDepenses)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Réalisé : {formatCurrency(totalRealiseDepenses)} ({totalBudgetDepenses > 0 ? ((totalRealiseDepenses / totalBudgetDepenses) * 100).toFixed(0) : 0}%)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Solde Prévisionnel
                        </CardTitle>
                        <Target className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-2xl font-bold",
                            soldePrevisionnel >= 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                            {formatCurrency(soldePrevisionnel)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Budget Recettes - Budget Dépenses
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Solde Réalisé
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-2xl font-bold",
                            soldeRealise >= 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                            {formatCurrency(soldeRealise)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Recettes réelles - Dépenses réelles
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Alertes */}
            {(alertes.length > 0 || attentions.length > 0) && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-amber-500">
                            <AlertTriangle className="h-5 w-5" />
                            Alertes Budget ({alertes.length + attentions.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {alertes.map(b => (
                                <div key={b.id} className="flex items-center gap-2 text-red-500">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm">
                                        <strong>{b.categorie}</strong> : dépassement de {formatCurrency(Math.abs(b.ecart))} ({b.pourcentage.toFixed(0)}% du budget)
                                    </span>
                                </div>
                            ))}
                            {attentions.map(b => (
                                <div key={b.id} className="flex items-center gap-2 text-amber-500">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="text-sm">
                                        <strong>{b.categorie}</strong> : {b.pourcentage.toFixed(0)}% du budget consommé
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tables */}
            <BudgetTable items={budgetsRecettes} type="Recette" />
            <BudgetTable items={budgetsDepenses} type="Dépense" />

            {/* Dialog de suppression */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmer la suppression</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer le budget pour la catégorie &quot;{budgetToDelete?.categorie}&quot; ?
                            Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Suppression..." : "Supprimer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

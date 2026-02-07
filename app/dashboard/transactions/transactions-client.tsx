"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Loader2,
    Calendar,
    Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { deleteTransaction } from "./actions"
import { toast } from "sonner"

interface Transaction {
    id: string
    date: string
    type: "Recette" | "Dépense"
    categorie: string
    sous_categorie: string | null
    tiers: string | null
    libelle: string
    entree: number
    sortie: number
    mode_paiement: string
    solde_progressif: number | null
    created_at: string
}

interface TransactionsClientProps {
    transactions: Transaction[]
    soldeActuel: number
    totalRecettes: number
    totalDepenses: number
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("fr-MA", {
        style: "decimal",
        minimumFractionDigits: 0,
    }).format(amount) + " MAD"
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
}

// Catégories prédéfinies
const CATEGORIES_RECETTES = [
    "Cotisations",
    "Sponsoring",
    "Subventions",
    "Événements",
    "Dons",
    "Autre",
]

const CATEGORIES_DEPENSES = [
    "Location Terrain",
    "Équipements",
    "Transport",
    "Arbitrage",
    "Événements",
    "Communication",
    "Frais Bancaires",
    "Autre",
]

export function TransactionsClient({
    transactions,
    soldeActuel,
    totalRecettes,
    totalDepenses,
}: TransactionsClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState("")
    const [filterType, setFilterType] = useState<string>("all")
    const [filterCategorie, setFilterCategorie] = useState<string>("all")
    const [filterMois, setFilterMois] = useState<string>("all")

    // States pour le modal de suppression
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Toast de succès
    useEffect(() => {
        const success = searchParams.get("success")
        if (success === "created") {
            toast.success("Transaction enregistrée", {
                description: "La transaction a été ajoutée au journal",
            })
            router.replace("/dashboard/transactions", { scroll: false })
        } else if (success === "updated") {
            toast.success("Transaction modifiée", {
                description: "La transaction a été mise à jour",
            })
            router.replace("/dashboard/transactions", { scroll: false })
        }
    }, [searchParams, router])

    // Filtrer les transactions
    const filteredTransactions = transactions.filter((transaction) => {
        const matchSearch =
            transaction.libelle.toLowerCase().includes(search.toLowerCase()) ||
            transaction.categorie.toLowerCase().includes(search.toLowerCase()) ||
            (transaction.tiers?.toLowerCase().includes(search.toLowerCase()) ?? false)

        const matchType = filterType === "all" || transaction.type === filterType

        const matchCategorie =
            filterCategorie === "all" || transaction.categorie === filterCategorie

        const matchMois =
            filterMois === "all" ||
            new Date(transaction.date).getMonth() + 1 === parseInt(filterMois)

        return matchSearch && matchType && matchCategorie && matchMois
    })

    // Catégories uniques pour le filtre
    const uniqueCategories = [...new Set(transactions.map((t) => t.categorie))]

    // Gestion suppression
    const handleDelete = async () => {
        if (!transactionToDelete) return

        setDeleting(true)
        const result = await deleteTransaction(transactionToDelete.id)
        setDeleting(false)

        if (result.error) {
            toast.error("Erreur lors de la suppression", {
                description: result.error,
            })
        } else {
            toast.success("Transaction supprimée")
            setDeleteDialogOpen(false)
            setTransactionToDelete(null)
            router.refresh()
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
                    <p className="text-muted-foreground">
                        Journal des recettes et dépenses
                    </p>
                </div>
                <Link href="/dashboard/transactions/nouvelle">
                    <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                        <Plus className="w-4 h-4" />
                        Nouvelle transaction
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Recettes</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            +{formatCurrency(totalRecettes)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {transactions.filter((t) => t.type === "Recette").length} transactions
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Dépenses</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            -{formatCurrency(totalDepenses)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {transactions.filter((t) => t.type === "Dépense").length} transactions
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Solde Actuel</CardTitle>
                        <Wallet className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-2xl font-bold",
                            soldeActuel >= 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                            {soldeActuel >= 0 ? "+" : ""}{formatCurrency(soldeActuel)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Après {transactions.length} transactions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher par libellé, catégorie, tiers..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous types</SelectItem>
                                <SelectItem value="Recette">Recettes</SelectItem>
                                <SelectItem value="Dépense">Dépenses</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterCategorie} onValueChange={setFilterCategorie}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes catégories</SelectItem>
                                {uniqueCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterMois} onValueChange={setFilterMois}>
                            <SelectTrigger className="w-full sm:w-[140px]">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Mois" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous mois</SelectItem>
                                <SelectItem value="1">Janvier</SelectItem>
                                <SelectItem value="2">Février</SelectItem>
                                <SelectItem value="3">Mars</SelectItem>
                                <SelectItem value="4">Avril</SelectItem>
                                <SelectItem value="5">Mai</SelectItem>
                                <SelectItem value="6">Juin</SelectItem>
                                <SelectItem value="7">Juillet</SelectItem>
                                <SelectItem value="8">Août</SelectItem>
                                <SelectItem value="9">Septembre</SelectItem>
                                <SelectItem value="10">Octobre</SelectItem>
                                <SelectItem value="11">Novembre</SelectItem>
                                <SelectItem value="12">Décembre</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Wallet className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">
                                {transactions.length === 0
                                    ? "Aucune transaction enregistrée"
                                    : "Aucune transaction ne correspond aux filtres"}
                            </p>
                            {transactions.length === 0 && (
                                <Link href="/dashboard/transactions/nouvelle">
                                    <Button className="mt-4 gap-2" variant="outline">
                                        <Plus className="w-4 h-4" />
                                        Ajouter une transaction
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Catégorie</TableHead>
                                    <TableHead className="hidden md:table-cell">Libellé</TableHead>
                                    <TableHead className="hidden lg:table-cell">Mode</TableHead>
                                    <TableHead className="text-right">Montant</TableHead>
                                    <TableHead className="text-right hidden sm:table-cell">Solde</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((transaction) => {
                                    const isRecette = transaction.type === "Recette"
                                    const montant = isRecette ? transaction.entree : transaction.sortie

                                    return (
                                        <TableRow key={transaction.id}>
                                            <TableCell className="font-medium">
                                                {formatDate(transaction.date)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={cn(
                                                        "border-0",
                                                        isRecette
                                                            ? "bg-emerald-500/10 text-emerald-500"
                                                            : "bg-red-500/10 text-red-500"
                                                    )}
                                                >
                                                    {isRecette ? (
                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                    ) : (
                                                        <TrendingDown className="w-3 h-3 mr-1" />
                                                    )}
                                                    {transaction.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{transaction.categorie}</div>
                                                    {transaction.sous_categorie && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {transaction.sous_categorie}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell max-w-[200px]">
                                                <div className="truncate" title={transaction.libelle}>
                                                    {transaction.libelle}
                                                </div>
                                                {transaction.tiers && (
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {transaction.tiers}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <Badge variant="outline" className="font-normal">
                                                    {transaction.mode_paiement}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span
                                                    className={cn(
                                                        "font-bold",
                                                        isRecette ? "text-emerald-500" : "text-red-500"
                                                    )}
                                                >
                                                    {isRecette ? "+" : "-"}{formatCurrency(montant)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right hidden sm:table-cell">
                                                {transaction.solde_progressif !== null ? (
                                                    <span className={cn(
                                                        "font-medium",
                                                        transaction.solde_progressif >= 0
                                                            ? "text-muted-foreground"
                                                            : "text-red-500"
                                                    )}>
                                                        {formatCurrency(transaction.solde_progressif)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/transactions/${transaction.id}`}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Modifier
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => {
                                                                setTransactionToDelete(transaction)
                                                                setDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Supprimer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer cette transaction ?</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer la transaction &quot;
                            <strong>{transactionToDelete?.libelle}</strong>&quot; ?
                            Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Annuler
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Suppression...
                                </>
                            ) : (
                                "Supprimer"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

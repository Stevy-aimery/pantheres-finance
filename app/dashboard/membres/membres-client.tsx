"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
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
    Users,
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Phone,
    Mail,
    UserCheck,
    Shield,
    AlertCircle,
    CheckCircle,
    Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { MembreDetailModal } from "@/components/dashboard/membre-detail-modal"
import { toast } from "sonner"
import { TresorierOnly } from "@/lib/permissions"

interface Membre {
    id: string
    nom_prenom: string
    telephone: string
    email: string
    statut: string
    role_joueur: boolean
    role_bureau: boolean
    fonction_bureau: string | null
    cotisation_mensuelle: number
    date_entree: string
}

interface CotisationStatus {
    total_paye: number
    reste_a_payer: number
    etat_paiement: string
    pourcentage_paye: number
}

interface MembresClientProps {
    membres: Membre[]
    cotisations: Record<string, CotisationStatus>
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("fr-MA", {
        style: "decimal",
        minimumFractionDigits: 0,
    }).format(amount) + " MAD"
}

export function MembresClient({ membres, cotisations }: MembresClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [search, setSearch] = useState("")
    const [filterStatut, setFilterStatut] = useState<string>("all")
    const [filterRole, setFilterRole] = useState<string>("all")

    // States pour le modal de détails
    const [selectedMembre, setSelectedMembre] = useState<Membre | null>(null)
    const [detailModalOpen, setDetailModalOpen] = useState(false)

    // States pour le modal de suppression
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [membreToDelete, setMembreToDelete] = useState<Membre | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Toast de succès
    useEffect(() => {
        const success = searchParams.get("success")
        if (success === "created") {
            toast.success("Membre créé avec succès", {
                description: "Le membre a été ajouté à la liste",
            })
            router.replace("/dashboard/membres", { scroll: false })
        } else if (success === "updated") {
            toast.success("Modification effectuée avec succès", {
                description: "Les informations du membre ont été mises à jour",
            })
            router.replace("/dashboard/membres", { scroll: false })
        }
    }, [searchParams, router])

    // Filtrer les membres
    const filteredMembres = membres.filter((membre) => {
        const matchSearch =
            membre.nom_prenom.toLowerCase().includes(search.toLowerCase()) ||
            membre.email.toLowerCase().includes(search.toLowerCase()) ||
            membre.telephone.includes(search)

        const matchStatut = filterStatut === "all" || membre.statut === filterStatut

        const matchRole =
            filterRole === "all" ||
            (filterRole === "joueur" && membre.role_joueur && !membre.role_bureau) ||
            (filterRole === "bureau" && membre.role_bureau) ||
            (filterRole === "double" && membre.role_joueur && membre.role_bureau)

        return matchSearch && matchStatut && matchRole
    })

    // Stats
    const stats = {
        total: membres.length,
        actifs: membres.filter(m => m.statut === "Actif").length,
        bureau: membres.filter(m => m.role_bureau).length,
        joueurs: membres.filter(m => m.role_joueur && !m.role_bureau).length,
    }

    const handleDelete = async () => {
        if (!membreToDelete) return

        setDeleting(true)
        const { error } = await supabase
            .from("membres")
            .delete()
            .eq("id", membreToDelete.id)

        setDeleting(false)
        setDeleteDialogOpen(false)

        if (!error) {
            toast.success("Membre supprimé", {
                description: "Le membre a été retiré de la liste",
            })
            router.refresh()
        } else {
            toast.error("Erreur lors de la suppression")
        }
    }

    const handleRowClick = (membre: Membre) => {
        setSelectedMembre(membre)
        setDetailModalOpen(true)
    }

    const getInitials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    }

    const getRoleBadges = (membre: Membre) => {
        const badges = []
        if (membre.role_bureau) {
            badges.push(
                <Badge key="bureau" variant="secondary" className="bg-amber-500/10 text-amber-500 border-0">
                    <Shield className="w-3 h-3 mr-1" />
                    {membre.fonction_bureau || "Bureau"}
                </Badge>
            )
        }
        if (membre.role_joueur) {
            badges.push(
                <Badge key="joueur" variant="secondary" className="bg-blue-500/10 text-blue-500 border-0">
                    Joueur
                </Badge>
            )
        }
        return badges
    }

    const getStatutBadge = (statut: string) => {
        switch (statut) {
            case "Actif":
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-0">Actif</Badge>
            case "Blessé":
                return <Badge className="bg-amber-500/10 text-amber-500 border-0">Blessé</Badge>
            case "Arrêt/Départ":
                return <Badge className="bg-red-500/10 text-red-500 border-0">Arrêt</Badge>
            default:
                return <Badge variant="secondary">{statut}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Membres</h1>
                    <p className="text-muted-foreground">Gérez les joueurs et membres du bureau</p>
                </div>
                <TresorierOnly>
                    <Link href="/dashboard/membres/nouveau">
                        <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                            <Plus className="w-4 h-4" />
                            Nouveau membre
                        </Button>
                    </Link>
                </TresorierOnly>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                            <Users className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-xs text-muted-foreground">Total membres</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <UserCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.actifs}</p>
                            <p className="text-xs text-muted-foreground">Actifs</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                            <Shield className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.bureau}</p>
                            <p className="text-xs text-muted-foreground">Bureau</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.joueurs}</p>
                            <p className="text-xs text-muted-foreground">Joueurs seuls</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher par nom, email ou téléphone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={filterStatut} onValueChange={setFilterStatut}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous statuts</SelectItem>
                                <SelectItem value="Actif">Actif</SelectItem>
                                <SelectItem value="Blessé">Blessé</SelectItem>
                                <SelectItem value="Arrêt/Départ">Arrêt/Départ</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterRole} onValueChange={setFilterRole}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous rôles</SelectItem>
                                <SelectItem value="joueur">Joueur seul</SelectItem>
                                <SelectItem value="bureau">Bureau</SelectItem>
                                <SelectItem value="double">Double rôle</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredMembres.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">Aucun membre trouvé</p>
                            {search && (
                                <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="mt-2">
                                    Effacer la recherche
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Membre</TableHead>
                                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                                    <TableHead>Rôle</TableHead>
                                    <TableHead className="hidden lg:table-cell">Cotisation</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMembres.map((membre) => {
                                    const cotisation = cotisations[membre.id]
                                    const isRetard = cotisation?.etat_paiement === "Retard"

                                    return (
                                        <TableRow
                                            key={membre.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleRowClick(membre)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarFallback className={cn(
                                                            "text-xs",
                                                            isRetard ? "bg-red-500/10 text-red-500" : "bg-muted"
                                                        )}>
                                                            {getInitials(membre.nom_prenom)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{membre.nom_prenom}</p>
                                                        <p className="text-xs text-muted-foreground md:hidden">
                                                            {membre.telephone}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Phone className="w-3 h-3 text-muted-foreground" />
                                                        {membre.telephone}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Mail className="w-3 h-3" />
                                                        {membre.email}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {getRoleBadges(membre)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">
                                                        {formatCurrency(membre.cotisation_mensuelle)}/mois
                                                    </p>
                                                    {cotisation && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full rounded-full",
                                                                        isRetard ? "bg-red-500" : "bg-emerald-500"
                                                                    )}
                                                                    style={{ width: `${Math.min(cotisation.pourcentage_paye, 100)}%` }}
                                                                />
                                                            </div>
                                                            {isRetard ? (
                                                                <AlertCircle className="w-3 h-3 text-red-500" />
                                                            ) : (
                                                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatutBadge(membre.statut)}</TableCell>
                                            <TresorierOnly>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/membres/${membre.id}`}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Modifier
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setMembreToDelete(membre)
                                                                    setDeleteDialogOpen(true)
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TresorierOnly>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Detail Modal */}
            <MembreDetailModal
                membre={selectedMembre}
                cotisation={selectedMembre ? cotisations[selectedMembre.id] : null}
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                onRefresh={() => router.refresh()}
            />

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer ce membre ?</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer <strong>{membreToDelete?.nom_prenom}</strong> ?
                            Cette action est irréversible et supprimera également l&apos;historique des paiements.
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

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Users,
    Shield,
    Phone,
    Mail,
    Calendar,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    Pencil,
    ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { PaiementsTimeline } from "./paiements-timeline"

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

interface Paiement {
    id: string
    mois: number
    annee: number
    montant: number
    date_paiement: string
    mode_paiement: string
}

interface MembreDetailModalProps {
    membre: Membre | null
    cotisation: CotisationStatus | null
    open: boolean
    onClose: () => void
    onRefresh?: () => void
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
        month: "long",
        year: "numeric",
    })
}

export function MembreDetailModal({
    membre,
    cotisation,
    open,
    onClose,
    onRefresh
}: MembreDetailModalProps) {
    const [paiements, setPaiements] = useState<Paiement[]>([])
    const [loadingPaiements, setLoadingPaiements] = useState(false)
    const supabase = createClient()

    // Charger les paiements quand le modal s'ouvre
    useEffect(() => {
        if (open && membre) {
            loadPaiements()
        }
    }, [open, membre?.id])

    const loadPaiements = async () => {
        if (!membre) return

        setLoadingPaiements(true)
        const { data, error } = await supabase
            .from("paiements")
            .select("*")
            .eq("membre_id", membre.id)
            .eq("annee", new Date().getFullYear())
            .order("mois", { ascending: true })

        if (!error && data) {
            setPaiements(data)
        }
        setLoadingPaiements(false)
    }

    const handlePaiementAdded = () => {
        loadPaiements()
        onRefresh?.()
    }

    if (!membre) return null

    const getInitials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    }

    const isRetard = cotisation?.etat_paiement === "Retard"
    const dureeSaison = Number(process.env.NEXT_PUBLIC_DUREE_SAISON_MOIS || 5)
    const cotisationTotale = membre.cotisation_mensuelle * dureeSaison

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className={cn(
                                "text-lg",
                                isRetard ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                                {getInitials(membre.nom_prenom)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <DialogTitle className="text-2xl">{membre.nom_prenom}</DialogTitle>
                            <DialogDescription className="flex items-center gap-2 mt-1">
                                {membre.role_bureau && (
                                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-0">
                                        <Shield className="w-3 h-3 mr-1" />
                                        {membre.fonction_bureau || "Bureau"}
                                    </Badge>
                                )}
                                {membre.role_joueur && (
                                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-0">
                                        <Users className="w-3 h-3 mr-1" />
                                        Joueur
                                    </Badge>
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                    {/* Statut */}
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <span className="text-sm font-medium">Statut</span>
                        <Badge className={cn(
                            "border-0",
                            membre.statut === "Actif" && "bg-emerald-500/10 text-emerald-500",
                            membre.statut === "Blessé" && "bg-amber-500/10 text-amber-500",
                            membre.statut === "Arrêt/Départ" && "bg-red-500/10 text-red-500"
                        )}>
                            {membre.statut}
                        </Badge>
                    </div>

                    {/* Coordonnées */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Coordonnées
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{membre.telephone}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{membre.email}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <div className="flex-1">
                                    <span className="text-sm">Membre depuis le {formatDate(membre.date_entree)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Paiements - NOUVEAU */}
                    <div className="p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-transparent">
                        <PaiementsTimeline
                            membreId={membre.id}
                            membreNom={membre.nom_prenom}
                            cotisationMensuelle={membre.cotisation_mensuelle}
                            paiements={paiements}
                            onPaiementAdded={handlePaiementAdded}
                        />
                    </div>

                    {/* Cotisations */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Résumé Cotisations
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="p-4 rounded-lg border">
                                <div className="text-xs text-muted-foreground mb-1">Mensuelle</div>
                                <div className="text-xl font-bold">{formatCurrency(membre.cotisation_mensuelle)}</div>
                            </div>
                            <div className="p-4 rounded-lg border">
                                <div className="text-xs text-muted-foreground mb-1">Total saison ({dureeSaison} mois)</div>
                                <div className="text-xl font-bold">{formatCurrency(cotisationTotale)}</div>
                            </div>
                        </div>

                        {cotisation && (
                            <div className="p-4 rounded-lg border space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Progression</span>
                                    </div>
                                    <Badge className={cn(
                                        "border-0",
                                        isRetard ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                                    )}>
                                        {isRetard ? (
                                            <>
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                En retard
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                À jour
                                            </>
                                        )}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Payé</span>
                                        <span className="font-medium">{formatCurrency(cotisation.total_paye)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all",
                                                isRetard ? "bg-red-500" : "bg-emerald-500"
                                            )}
                                            style={{ width: `${Math.min(cotisation.pourcentage_paye, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Reste à payer</span>
                                        <span className="font-medium">{formatCurrency(cotisation.reste_a_payer)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6 pt-6 border-t">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                    <Link href={`/dashboard/membres/${membre.id}`} className="flex-1">
                        <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                            <Pencil className="w-4 h-4" />
                            Modifier
                        </Button>
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    )
}

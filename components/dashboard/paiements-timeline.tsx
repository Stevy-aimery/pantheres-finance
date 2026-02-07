"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    CheckCircle2,
    Circle,
    Plus,
    Loader2,
    Banknote,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Paiement {
    id: string
    mois: number
    annee: number
    montant: number
    date_paiement: string
    mode_paiement: string
}

interface PaiementsTimelineProps {
    membreId: string
    membreNom: string
    cotisationMensuelle: number
    paiements: Paiement[]
    onPaiementAdded?: () => void
}

// Mois de la saison (Mars à Juillet)
const MOIS_SAISON = [
    { numero: 3, nom: "Mars" },
    { numero: 4, nom: "Avril" },
    { numero: 5, nom: "Mai" },
    { numero: 6, nom: "Juin" },
    { numero: 7, nom: "Juillet" },
]

const MODES_PAIEMENT = [
    { value: "Espèces", label: "Espèces" },
    { value: "Virement", label: "Virement bancaire" },
    { value: "Wafacash/CashPlus", label: "Wafacash / CashPlus" },
    { value: "Chèque", label: "Chèque" },
]

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
    })
}

export function PaiementsTimeline({
    membreId,
    membreNom,
    cotisationMensuelle,
    paiements,
    onPaiementAdded,
}: PaiementsTimelineProps) {
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [selectedMois, setSelectedMois] = useState<number | null>(null)
    const [montant, setMontant] = useState(cotisationMensuelle.toString())
    const [modePaiement, setModePaiement] = useState("Espèces")
    const [loading, setLoading] = useState(false)

    const supabase = createClient()
    const anneeEnCours = new Date().getFullYear()

    // Vérifier si un mois est payé
    const estMoisPaye = (mois: number) => {
        return paiements.some(p => p.mois === mois && p.annee === anneeEnCours)
    }

    // Obtenir le paiement d'un mois
    const getPaiementMois = (mois: number) => {
        return paiements.find(p => p.mois === mois && p.annee === anneeEnCours)
    }

    // Ouvrir le dialog pour ajouter un paiement
    const ouvrirAjoutPaiement = (mois: number) => {
        setSelectedMois(mois)
        setMontant(cotisationMensuelle.toString())
        setModePaiement("Espèces")
        setAddDialogOpen(true)
    }

    // Enregistrer le paiement
    const handleSubmit = async () => {
        if (!selectedMois) return

        setLoading(true)

        const { error } = await supabase.from("paiements").insert({
            membre_id: membreId,
            mois: selectedMois,
            annee: anneeEnCours,
            montant: parseFloat(montant),
            mode_paiement: modePaiement,
            date_paiement: new Date().toISOString().split("T")[0],
        })

        setLoading(false)

        if (error) {
            if (error.code === "23505") {
                toast.error("Ce mois est déjà payé")
            } else {
                toast.error("Erreur lors de l'enregistrement")
            }
            return
        }

        toast.success("Paiement enregistré", {
            description: `${MOIS_SAISON.find(m => m.numero === selectedMois)?.nom} ${anneeEnCours} - ${montant} MAD`,
        })

        setAddDialogOpen(false)
        onPaiementAdded?.()
    }

    // Mois non payés
    const moisNonPayes = MOIS_SAISON.filter(m => !estMoisPaye(m.numero))

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Paiements Saison {anneeEnCours}
                </h3>
                {moisNonPayes.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => ouvrirAjoutPaiement(moisNonPayes[0].numero)}
                    >
                        <Plus className="w-3 h-3" />
                        Ajouter
                    </Button>
                )}
            </div>

            {/* Timeline visuelle */}
            <div className="flex items-center gap-1">
                {MOIS_SAISON.map((mois, index) => {
                    const paiement = getPaiementMois(mois.numero)
                    const isPaye = !!paiement

                    return (
                        <div key={mois.numero} className="flex-1 flex flex-col items-center">
                            {/* Cercle avec statut */}
                            <button
                                onClick={() => !isPaye && ouvrirAjoutPaiement(mois.numero)}
                                disabled={isPaye}
                                className={cn(
                                    "relative w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                    isPaye
                                        ? "bg-emerald-500/10 text-emerald-500 cursor-default"
                                        : "bg-muted hover:bg-amber-500/10 hover:text-amber-500 cursor-pointer border-2 border-dashed border-muted-foreground/30 hover:border-amber-500"
                                )}
                                title={isPaye ? `Payé le ${formatDate(paiement.date_paiement)}` : `Cliquez pour ajouter le paiement de ${mois.nom}`}
                            >
                                {isPaye ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                    <Circle className="w-5 h-5" />
                                )}
                            </button>

                            {/* Ligne de connexion */}
                            {index < MOIS_SAISON.length - 1 && (
                                <div
                                    className={cn(
                                        "absolute w-full h-0.5 top-5 left-1/2 -z-10",
                                        isPaye && estMoisPaye(MOIS_SAISON[index + 1]?.numero)
                                            ? "bg-emerald-500"
                                            : "bg-muted"
                                    )}
                                    style={{ width: "calc(100% - 2.5rem)" }}
                                />
                            )}

                            {/* Nom du mois */}
                            <span className={cn(
                                "text-xs mt-1 font-medium",
                                isPaye ? "text-emerald-500" : "text-muted-foreground"
                            )}>
                                {mois.nom.slice(0, 3)}
                            </span>

                            {/* Montant si payé */}
                            {paiement && (
                                <span className="text-[10px] text-muted-foreground">
                                    {paiement.montant} MAD
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Légende */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Payé</span>
                </div>
                <div className="flex items-center gap-1">
                    <Circle className="w-3 h-3" />
                    <span>En attente</span>
                </div>
            </div>

            {/* Dialog ajout paiement */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-amber-500" />
                            Enregistrer un paiement
                        </DialogTitle>
                        <DialogDescription>
                            Paiement de {membreNom} pour{" "}
                            <Badge variant="secondary">
                                {MOIS_SAISON.find(m => m.numero === selectedMois)?.nom} {anneeEnCours}
                            </Badge>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="montant">Montant (MAD)</Label>
                            <Input
                                id="montant"
                                type="number"
                                value={montant}
                                onChange={(e) => setMontant(e.target.value)}
                                placeholder="100"
                            />
                            <p className="text-xs text-muted-foreground">
                                Cotisation mensuelle : {cotisationMensuelle} MAD
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mode">Mode de paiement</Label>
                            <Select value={modePaiement} onValueChange={setModePaiement}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MODES_PAIEMENT.map((mode) => (
                                        <SelectItem key={mode.value} value={mode.value}>
                                            {mode.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !montant}
                            className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Enregistrer
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

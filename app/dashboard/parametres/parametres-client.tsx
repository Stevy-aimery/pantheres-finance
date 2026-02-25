"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Save, RotateCw, Settings, DollarSign, Bell, Mail, CalendarDays, ShieldCheck } from "lucide-react"
import { updateParametre } from "./actions"
import type { Parametre } from "@/lib/types"
import { toast } from "sonner"

// ───── Groupement des paramètres par catégorie ─────
const PARAM_GROUPS: Record<string, { label: string; icon: React.ReactNode; keys: string[] }> = {
    saison: {
        label: "Période de la saison",
        icon: <CalendarDays className="w-4 h-4" />,
        keys: ["saison_nom", "saison_debut", "saison_fin", "saison_duree_mois"],
    },
    cotisations: {
        label: "Cotisations",
        icon: <DollarSign className="w-4 h-4" />,
        keys: ["montant_joueur", "montant_bureau", "jour_cotisation"],
    },
    alertes: {
        label: "Alertes & Réserves",
        icon: <Bell className="w-4 h-4" />,
        keys: ["seuil_alerte_solde", "pourcentage_reserve", "jour_relance"],
    },
    emails: {
        label: "Notifications Email",
        icon: <Mail className="w-4 h-4" />,
        keys: ["email_tresorier", "email_bureau"],
    },
}

// Labels lisibles pour chaque clé
const PARAM_LABELS: Record<string, string> = {
    saison_nom: "Saison",
    saison_debut: "Date de début (YYYY-MM-DD)",
    saison_fin: "Date de fin (YYYY-MM-DD)",
    saison_duree_mois: "Durée de la saison (mois)",
    montant_joueur: "Cotisation joueur (MAD/mois)",
    montant_bureau: "Cotisation bureau (MAD/mois)",
    jour_cotisation: "Jour de cotisation (du mois)",
    jour_relance: "Jour de relance automatique",
    seuil_alerte_solde: "Seuil alerte solde faible (%)",
    pourcentage_reserve: "Réserve financière (%)",
    email_tresorier: "Email du Trésorier",
    email_bureau: "Emails du bureau (séparés par ,)",
}

// ───── Composant principal ─────
interface ParametresClientProps {
    parametres: Parametre[]
}

export function ParametresClient({ parametres: initialParametres }: ParametresClientProps) {
    const [parametres, setParametres] = useState<Parametre[]>(initialParametres)
    const [editedValues, setEditedValues] = useState<Record<string, string>>({})
    const [isPending, startTransition] = useTransition()

    const hasChanges = Object.keys(editedValues).length > 0

    const getParamValue = (cle: string) => {
        if (editedValues[cle] !== undefined) return editedValues[cle]
        const param = parametres.find(p => p.cle === cle)
        return param?.valeur || ""
    }

    const handleChange = (cle: string, value: string) => {
        const original = parametres.find(p => p.cle === cle)
        if (original?.valeur === value) {
            // Revert to original — remove from edited
            const { [cle]: _, ...rest } = editedValues
            setEditedValues(rest)
        } else {
            setEditedValues(prev => ({ ...prev, [cle]: value }))
        }
    }

    const handleSaveAll = () => {
        startTransition(async () => {
            let hasError = false

            for (const [cle, valeur] of Object.entries(editedValues)) {
                const param = parametres.find(p => p.cle === cle)
                if (!param) continue

                const result = await updateParametre(param.id, valeur)
                if (result.error) {
                    toast.error(`Erreur sur "${PARAM_LABELS[cle] || cle}" : ${result.error}`)
                    hasError = true
                }
            }

            if (!hasError) {
                // Mettre à jour l'état local
                setParametres(prev =>
                    prev.map(p =>
                        editedValues[p.cle] !== undefined
                            ? { ...p, valeur: editedValues[p.cle], updated_at: new Date().toISOString() }
                            : p
                    )
                )
                setEditedValues({})
                toast.success("Paramètres enregistrés avec succès")
            }
        })
    }

    const handleReset = () => {
        setEditedValues({})
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
                    <p className="text-muted-foreground">Configuration de l&apos;application</p>
                </div>
                <div className="flex gap-2">
                    {hasChanges && (
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            disabled={isPending}
                            className="gap-2"
                        >
                            <RotateCw className="w-4 h-4" />
                            Annuler
                        </Button>
                    )}
                    <Button
                        onClick={handleSaveAll}
                        disabled={!hasChanges || isPending}
                        className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                        {isPending ? (
                            <RotateCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Enregistrer
                    </Button>
                </div>
            </div>

            {hasChanges && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                    <ShieldCheck className="w-4 h-4 inline mr-2" />
                    {Object.keys(editedValues).length} modification(s) en attente
                </div>
            )}

            {/* Cards par groupe */}
            {Object.entries(PARAM_GROUPS).map(([groupKey, group]) => (
                <Card key={groupKey}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {group.icon}
                            {group.label}
                        </CardTitle>
                        <CardDescription>
                            {groupKey === "saison" && "Dates et durée de la saison en cours"}
                            {groupKey === "cotisations" && "Montants et dates des cotisations mensuelles"}
                            {groupKey === "alertes" && "Seuils d'alertes et politique de réserve"}
                            {groupKey === "emails" && "Adresses email pour les notifications automatiques"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {group.keys.map((cle, index) => {
                            const param = parametres.find(p => p.cle === cle)
                            if (!param) return null
                            const isEdited = editedValues[cle] !== undefined

                            return (
                                <div key={cle}>
                                    {index > 0 && <Separator className="mb-4" />}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                                        <div className="space-y-1">
                                            <Label htmlFor={cle} className="font-medium">
                                                {PARAM_LABELS[cle] || cle}
                                            </Label>
                                            {param.description && (
                                                <p className="text-xs text-muted-foreground">{param.description}</p>
                                            )}
                                        </div>
                                        <div className="sm:col-span-2 flex items-center gap-3">
                                            <Input
                                                id={cle}
                                                type={param.type === "number" ? "number" : "text"}
                                                value={getParamValue(cle)}
                                                onChange={(e) => handleChange(cle, e.target.value)}
                                                className={isEdited ? "border-amber-500 ring-1 ring-amber-500/30" : ""}
                                            />
                                            {isEdited && (
                                                <Badge variant="outline" className="text-amber-600 border-amber-300 shrink-0">
                                                    Modifié
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            ))}

            {/* Paramètres non groupés (si ajoutés en BDD mais pas dans les groups) */}
            {(() => {
                const groupedKeys = Object.values(PARAM_GROUPS).flatMap(g => g.keys)
                const ungrouped = parametres.filter(p => !groupedKeys.includes(p.cle))
                if (ungrouped.length === 0) return null

                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Settings className="w-4 h-4" />
                                Autres paramètres
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {ungrouped.map((param, index) => {
                                const isEdited = editedValues[param.cle] !== undefined
                                return (
                                    <div key={param.cle}>
                                        {index > 0 && <Separator className="mb-4" />}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                                            <div className="space-y-1">
                                                <Label htmlFor={param.cle} className="font-medium">
                                                    {PARAM_LABELS[param.cle] || param.cle}
                                                </Label>
                                                {param.description && (
                                                    <p className="text-xs text-muted-foreground">{param.description}</p>
                                                )}
                                            </div>
                                            <div className="sm:col-span-2 flex items-center gap-3">
                                                <Input
                                                    id={param.cle}
                                                    type={param.type === "number" ? "number" : "text"}
                                                    value={getParamValue(param.cle)}
                                                    onChange={(e) => handleChange(param.cle, e.target.value)}
                                                    className={isEdited ? "border-amber-500 ring-1 ring-amber-500/30" : ""}
                                                />
                                                {isEdited && (
                                                    <Badge variant="outline" className="text-amber-600 border-amber-300 shrink-0">
                                                        Modifié
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                )
            })()}

            {/* Info dernière mise à jour */}
            <p className="text-xs text-muted-foreground text-right">
                Dernière modification : {
                    parametres
                        .filter(p => p.updated_at)
                        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
                        ?.updated_at
                        ? new Date(
                            parametres
                                .filter(p => p.updated_at)
                                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
                                .updated_at
                        ).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"
                }
            </p>
        </div>
    )
}

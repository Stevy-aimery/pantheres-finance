"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, UserPlus, Shield, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { createMembre, updateMembre, type MembreFormData } from "./actions"

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

interface MembreFormProps {
    membre?: Membre
    mode: "create" | "edit"
}

const fonctionsBureau = [
    "Président",
    "Vice-Président",
    "Secrétaire Général",
    "Trésorier",
    "Trésorier Adjoint",
    "Capitaine",
    "Vice-Capitaine",
    "Responsable Communication",
    "Responsable Logistique",
]

export function MembreForm({ membre, mode }: MembreFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState<MembreFormData>({
        nom_prenom: membre?.nom_prenom || "",
        telephone: membre?.telephone || "",
        email: membre?.email || "",
        statut: membre?.statut || "Actif",
        role_joueur: membre?.role_joueur ?? true,
        role_bureau: membre?.role_bureau ?? false,
        fonction_bureau: membre?.fonction_bureau || null,
        date_entree: membre?.date_entree || new Date().toISOString().split("T")[0],
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const result = mode === "create"
                ? await createMembre(formData)
                : await updateMembre(membre!.id, formData)

            if (result?.error) {
                setError(result.error)
                setLoading(false)
            }
            // La redirection est gérée par les actions
        } catch {
            setError("Une erreur est survenue")
            setLoading(false)
        }
    }

    // Calculer cotisation prévisionnelle
    const getCotisationPreview = () => {
        if (formData.role_bureau) return 150
        if (formData.role_joueur) return 100
        return 0
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/membres">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {mode === "create" ? "Nouveau membre" : `Modifier ${membre?.nom_prenom}`}
                    </h1>
                    <p className="text-muted-foreground">
                        {mode === "create"
                            ? "Ajoutez un nouveau joueur ou membre du bureau"
                            : "Modifiez les informations du membre"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Error */}
                    {error && (
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Informations personnelles */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Informations personnelles</CardTitle>
                            <CardDescription>Identité et coordonnées du membre</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nom_prenom">Nom complet *</Label>
                                <Input
                                    id="nom_prenom"
                                    placeholder="Ex: Mohamed El Amrani"
                                    value={formData.nom_prenom}
                                    onChange={(e) => setFormData({ ...formData, nom_prenom: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="telephone">Téléphone *</Label>
                                    <Input
                                        id="telephone"
                                        type="tel"
                                        placeholder="06XXXXXXXX"
                                        value={formData.telephone}
                                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="membre@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="date_entree">Date d&apos;entrée *</Label>
                                    <Input
                                        id="date_entree"
                                        type="date"
                                        value={formData.date_entree}
                                        onChange={(e) => setFormData({ ...formData, date_entree: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="statut">Statut *</Label>
                                    <Select
                                        value={formData.statut}
                                        onValueChange={(v) => setFormData({ ...formData, statut: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Actif">Actif</SelectItem>
                                            <SelectItem value="Blessé">Blessé</SelectItem>
                                            <SelectItem value="Arrêt/Départ">Arrêt/Départ</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rôles */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Rôles</CardTitle>
                            <CardDescription>Définissez le ou les rôles du membre</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Joueur */}
                                <label
                                    className={cn(
                                        "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                                        formData.role_joueur
                                            ? "border-blue-500 bg-blue-500/5"
                                            : "border-border hover:bg-muted/50"
                                    )}
                                >
                                    <Checkbox
                                        checked={formData.role_joueur}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, role_joueur: checked as boolean })
                                        }
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-blue-500" />
                                            <span className="font-medium">Joueur</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Cotisation : 100 MAD/mois
                                        </p>
                                    </div>
                                </label>

                                {/* Bureau */}
                                <label
                                    className={cn(
                                        "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                                        formData.role_bureau
                                            ? "border-amber-500 bg-amber-500/5"
                                            : "border-border hover:bg-muted/50"
                                    )}
                                >
                                    <Checkbox
                                        checked={formData.role_bureau}
                                        onCheckedChange={(checked) =>
                                            setFormData({
                                                ...formData,
                                                role_bureau: checked as boolean,
                                                fonction_bureau: checked ? formData.fonction_bureau : null
                                            })
                                        }
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-amber-500" />
                                            <span className="font-medium">Bureau</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Cotisation : 150 MAD/mois (prioritaire)
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Fonction bureau */}
                            {formData.role_bureau && (
                                <div className="space-y-2">
                                    <Label htmlFor="fonction_bureau">Fonction au bureau</Label>
                                    <Select
                                        value={formData.fonction_bureau || ""}
                                        onValueChange={(v) => setFormData({ ...formData, fonction_bureau: v || null })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner une fonction" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {fonctionsBureau.map((f) => (
                                                <SelectItem key={f} value={f}>{f}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {!formData.role_joueur && !formData.role_bureau && (
                                <p className="text-sm text-amber-500">
                                    ⚠️ Sélectionnez au moins un rôle pour ce membre
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Summary */}
                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Récapitulatif</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Cotisation mensuelle</span>
                                    <span className="font-semibold">{getCotisationPreview()} MAD</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Cotisation annuelle</span>
                                    <span className="font-semibold">{getCotisationPreview() * 12} MAD</span>
                                </div>
                            </div>

                            {formData.role_bureau && formData.role_joueur && (
                                <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500 text-xs">
                                    💡 Double rôle : La cotisation Bureau (150 MAD) est appliquée
                                </div>
                            )}

                            <div className="pt-4 border-t space-y-2">
                                <Button
                                    type="submit"
                                    className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                                    disabled={loading || (!formData.role_joueur && !formData.role_bureau)}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {mode === "create" ? "Création..." : "Mise à jour..."}
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            {mode === "create" ? "Créer le membre" : "Enregistrer"}
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => router.back()}
                                >
                                    Annuler
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    )
}

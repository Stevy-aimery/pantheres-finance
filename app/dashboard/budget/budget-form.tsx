"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Save, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { createBudget, updateBudget, BudgetFormData } from "./actions"
import { toast } from "sonner"

interface Budget {
    id: string
    categorie: string
    type: "Recette" | "Dépense"
    budget_alloue: number
    periode_debut: string
    periode_fin: string
}

interface BudgetFormProps {
    budget?: Budget | null
    typePreselectionne?: "Recette" | "Dépense"
}

// Catégories par défaut (mêmes que transactions)
const CATEGORIES_RECETTES = [
    "Cotisations",
    "Adhésion (Inscription)",
    "Sponsoring",
    "Subventions",
    "Événements",
    "Sanction",
    "Dons",
    "Autre",
]

const CATEGORIES_DEPENSES = [
    "Location Terrain",
    "Équipements",
    "Transport",
    "Voyage",
    "Arbitrage",
    "Événements",
    "Communication",
    "Frais Bancaires",
    "Autre",
]

export function BudgetForm({ budget, typePreselectionne }: BudgetFormProps) {
    const router = useRouter()
    const isEditing = !!budget
    const currentYear = new Date().getFullYear()

    const [type, setType] = useState<"Recette" | "Dépense">(budget?.type || typePreselectionne || "Dépense")
    const [categorie, setCategorie] = useState(budget?.categorie || "")
    const [budgetAlloue, setBudgetAlloue] = useState(budget?.budget_alloue?.toString() || "")
    const [periodeDebut, setPeriodeDebut] = useState(budget?.periode_debut || `${currentYear}-03-01`)
    const [periodeFin, setPeriodeFin] = useState(budget?.periode_fin || `${currentYear}-07-31`)
    const [loading, setLoading] = useState(false)

    const categories = type === "Recette" ? CATEGORIES_RECETTES : CATEGORIES_DEPENSES

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!categorie || !budgetAlloue || !periodeDebut || !periodeFin) {
            toast.error("Veuillez remplir tous les champs obligatoires")
            return
        }

        setLoading(true)

        const formData: BudgetFormData = {
            categorie,
            type,
            budget_alloue: parseFloat(budgetAlloue),
            periode_debut: periodeDebut,
            periode_fin: periodeFin,
        }

        try {
            let result
            if (isEditing) {
                result = await updateBudget(budget.id, formData)
            } else {
                result = await createBudget(formData)
            }

            if (result?.error) {
                toast.error(isEditing ? "Erreur lors de la modification" : "Erreur lors de la création", {
                    description: result.error,
                })
            } else {
                toast.success(isEditing ? "Budget mis à jour" : "Budget créé", {
                    description: `${type} - ${categorie} : ${budgetAlloue} MAD`,
                })
                router.push("/dashboard/budget")
                router.refresh()
            }
        } catch (error) {
            toast.error("Une erreur est survenue")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/budget">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEditing ? "Modifier le budget" : "Définir un budget"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isEditing
                            ? "Ajustez les prévisions pour cette catégorie"
                            : "Ajoutez une ligne au budget prévisionnel"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Type */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Type de budget</CardTitle>
                            <CardDescription>
                                Prévoyez-vous une rentrée ou une sortie d&apos;argent ?
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup
                                value={type}
                                onValueChange={(value) => {
                                    setType(value as "Recette" | "Dépense")
                                    setCategorie("")
                                }}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div>
                                    <RadioGroupItem value="Recette" id="recette" className="peer sr-only" />
                                    <Label
                                        htmlFor="recette"
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-lg border-2 p-6 cursor-pointer transition-all",
                                            type === "Recette"
                                                ? "border-emerald-500 bg-emerald-500/10"
                                                : "border-muted hover:border-emerald-500/50 hover:bg-muted/50"
                                        )}
                                    >
                                        <TrendingUp className={cn(
                                            "h-8 w-8 mb-2",
                                            type === "Recette" ? "text-emerald-500" : "text-muted-foreground"
                                        )} />
                                        <span className={cn("text-lg font-semibold", type === "Recette" && "text-emerald-500")}>
                                            Recette (Entrée)
                                        </span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="Dépense" id="depense" className="peer sr-only" />
                                    <Label
                                        htmlFor="depense"
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-lg border-2 p-6 cursor-pointer transition-all",
                                            type === "Dépense"
                                                ? "border-red-500 bg-red-500/10"
                                                : "border-muted hover:border-red-500/50 hover:bg-muted/50"
                                        )}
                                    >
                                        <TrendingDown className={cn(
                                            "h-8 w-8 mb-2",
                                            type === "Dépense" ? "text-red-500" : "text-muted-foreground"
                                        )} />
                                        <span className={cn("text-lg font-semibold", type === "Dépense" && "text-red-500")}>
                                            Dépense (Sortie)
                                        </span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>

                    {/* Détails */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Détails</CardTitle>
                            <CardDescription>Catégorie et montant alloué</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="categorie">Catégorie *</Label>
                                <Select value={categorie} onValueChange={setCategorie}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="montant">Budget Alloué (MAD) *</Label>
                                <div className="relative">
                                    <Input
                                        id="montant"
                                        type="number"
                                        min="0"
                                        step="100"
                                        placeholder="ex: 5000"
                                        value={budgetAlloue}
                                        onChange={(e) => setBudgetAlloue(e.target.value)}
                                        className="pl-8 font-mono text-lg"
                                        required
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                                        DH
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Période */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Période</CardTitle>
                            <CardDescription>Durée de validité de ce budget</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="debut">Date début</Label>
                                    <Input
                                        id="debut"
                                        type="date"
                                        value={periodeDebut}
                                        onChange={(e) => setPeriodeDebut(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fin">Date fin</Label>
                                    <Input
                                        id="fin"
                                        type="date"
                                        value={periodeFin}
                                        onChange={(e) => setPeriodeFin(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                La période par défaut correspond à la saison en cours (Mars - Juillet).
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex gap-4 mt-6">
                    <Link href="/dashboard/budget" className="flex-1 sm:flex-none">
                        <Button type="button" variant="outline" className="w-full sm:w-auto">
                            Annuler
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "flex-1 sm:flex-none gap-2",
                            type === "Recette"
                                ? "bg-emerald-500 hover:bg-emerald-600"
                                : "bg-red-500 hover:bg-red-600",
                            "text-white"
                        )}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {isEditing ? "Mettre à jour" : "Enregistrer Budget"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}

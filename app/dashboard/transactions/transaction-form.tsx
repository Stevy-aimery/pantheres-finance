"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { createTransaction, updateTransaction, TransactionFormData } from "./actions"
import { toast } from "sonner"

interface Membre {
    id: string
    nom_prenom: string
}

interface Transaction {
    id: string
    date: string
    type: "Recette" | "Dépense"
    categorie: string
    sous_categorie: string | null
    tiers: string | null
    membre_id: string | null
    libelle: string
    entree: number
    sortie: number
    mode_paiement: string
}

interface TransactionFormProps {
    transaction?: Transaction | null
    membres: Membre[]
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

const MODES_PAIEMENT = [
    { value: "Espèces", label: "Espèces" },
    { value: "Virement", label: "Virement bancaire" },
    { value: "Wafacash/CashPlus", label: "Wafacash / CashPlus" },
    { value: "Chèque", label: "Chèque" },
]

export function TransactionForm({ transaction, membres }: TransactionFormProps) {
    const router = useRouter()
    const isEditing = !!transaction

    // Calculer le montant initial
    const getMontantInitial = () => {
        if (!transaction) return ""
        return transaction.type === "Recette"
            ? transaction.entree.toString()
            : transaction.sortie.toString()
    }

    const [type, setType] = useState<"Recette" | "Dépense">(transaction?.type || "Recette")
    const [date, setDate] = useState(transaction?.date || new Date().toISOString().split("T")[0])
    const [categorie, setCategorie] = useState(transaction?.categorie || "")
    const [sousCategorie, setSousCategorie] = useState(transaction?.sous_categorie || "")
    const [tiers, setTiers] = useState(transaction?.tiers || "")
    const [membreId, setMembreId] = useState(transaction?.membre_id || "")
    const [libelle, setLibelle] = useState(transaction?.libelle || "")
    const [montant, setMontant] = useState(getMontantInitial())
    const [modePaiement, setModePaiement] = useState(transaction?.mode_paiement || "Espèces")
    const [loading, setLoading] = useState(false)

    const categories = type === "Recette" ? CATEGORIES_RECETTES : CATEGORIES_DEPENSES

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!date || !categorie || !libelle || !montant || !modePaiement) {
            toast.error("Veuillez remplir tous les champs obligatoires")
            return
        }

        setLoading(true)

        const formData: TransactionFormData = {
            date,
            type,
            categorie,
            sous_categorie: sousCategorie || undefined,
            tiers: tiers || undefined,
            membre_id: membreId || undefined,
            libelle,
            montant: parseFloat(montant),
            mode_paiement: modePaiement,
        }

        try {
            if (isEditing) {
                const result = await updateTransaction(transaction.id, formData)
                if (result?.error) {
                    toast.error(result.error)
                    setLoading(false)
                }
            } else {
                const result = await createTransaction(formData)
                if (result?.error) {
                    toast.error(result.error)
                    setLoading(false)
                }
            }
        } catch (error) {
            // Redirect exceptions are normal, ignore them
            if (!(error instanceof Error && error.message.includes("NEXT_REDIRECT"))) {
                toast.error("Une erreur est survenue")
                setLoading(false)
            }
        }
    }

    // Réinitialiser la catégorie quand le type change
    const handleTypeChange = (newType: "Recette" | "Dépense") => {
        setType(newType)
        setCategorie("")
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/transactions">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEditing ? "Modifier la transaction" : "Nouvelle transaction"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isEditing
                            ? "Modifiez les informations de la transaction"
                            : "Enregistrez une nouvelle recette ou dépense"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Type de transaction */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Type de transaction</CardTitle>
                            <CardDescription>
                                Sélectionnez si c&apos;est une entrée ou une sortie d&apos;argent
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup
                                value={type}
                                onValueChange={(value) => handleTypeChange(value as "Recette" | "Dépense")}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div>
                                    <RadioGroupItem
                                        value="Recette"
                                        id="recette"
                                        className="peer sr-only"
                                    />
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
                                        <span className={cn(
                                            "text-lg font-semibold",
                                            type === "Recette" ? "text-emerald-500" : ""
                                        )}>
                                            Recette
                                        </span>
                                        <span className="text-xs text-muted-foreground">Entrée d&apos;argent</span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem
                                        value="Dépense"
                                        id="depense"
                                        className="peer sr-only"
                                    />
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
                                        <span className={cn(
                                            "text-lg font-semibold",
                                            type === "Dépense" ? "text-red-500" : ""
                                        )}>
                                            Dépense
                                        </span>
                                        <span className="text-xs text-muted-foreground">Sortie d&apos;argent</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>

                    {/* Informations principales */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations</CardTitle>
                            <CardDescription>Détails de la transaction</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date *</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="montant">Montant (MAD) *</Label>
                                    <Input
                                        id="montant"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={montant}
                                        onChange={(e) => setMontant(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
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
                                    <Label htmlFor="sous-categorie">Sous-catégorie</Label>
                                    <Input
                                        id="sous-categorie"
                                        placeholder="Optionnel"
                                        value={sousCategorie}
                                        onChange={(e) => setSousCategorie(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="libelle">Libellé / Description *</Label>
                                <Textarea
                                    id="libelle"
                                    placeholder="Décrivez la transaction..."
                                    value={libelle}
                                    onChange={(e) => setLibelle(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Paiement et tiers */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Paiement</CardTitle>
                            <CardDescription>Mode de paiement et parties concernées</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="mode">Mode de paiement *</Label>
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

                            <div className="space-y-2">
                                <Label htmlFor="tiers">Tiers (nom, entreprise...)</Label>
                                <Input
                                    id="tiers"
                                    placeholder="Ex: Fournisseur XYZ, Sponsor ABC..."
                                    value={tiers}
                                    onChange={(e) => setTiers(e.target.value)}
                                />
                            </div>

                            {type === "Recette" && categorie === "Cotisations" && (
                                <div className="space-y-2">
                                    <Label htmlFor="membre">Membre concerné</Label>
                                    <Select value={membreId} onValueChange={setMembreId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un membre..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Aucun</SelectItem>
                                            {membres.map((membre) => (
                                                <SelectItem key={membre.id} value={membre.id}>
                                                    {membre.nom_prenom}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-6">
                    <Link href="/dashboard/transactions" className="flex-1 sm:flex-none">
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
                                {isEditing ? "Mettre à jour" : "Enregistrer"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}

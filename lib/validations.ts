import { z } from "zod"

// ═══════════════════════════════════════════════
//  SCHÉMAS DE VALIDATION ZOD
//  Source unique pour la validation des données
// ═══════════════════════════════════════════════

// ───── Transactions ─────
export const transactionSchema = z.object({
    date: z.string().min(1, "La date est requise").regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
    type: z.enum(["Recette", "Dépense"], { message: "Le type doit être 'Recette' ou 'Dépense'" }),
    categorie: z.string().min(1, "La catégorie est requise").max(100, "Catégorie trop longue"),
    sous_categorie: z.string().max(100, "Sous-catégorie trop longue").optional().nullable(),
    tiers: z.string().max(255, "Nom du tiers trop long").optional().nullable(),
    membre_id: z.string().uuid("ID membre invalide").optional().nullable(),
    libelle: z.string().min(1, "Le libellé est requis").max(500, "Libellé trop long"),
    montant: z.number().positive("Le montant doit être positif").max(999999.99, "Montant trop élevé"),
    mode_paiement: z.string().min(1, "Le mode de paiement est requis").max(50, "Mode de paiement trop long"),
})

export type TransactionFormData = z.infer<typeof transactionSchema>

// ───── Membres ─────
export const membreSchema = z.object({
    nom_prenom: z.string().min(2, "Le nom est requis (2 caractères minimum)").max(255, "Nom trop long"),
    telephone: z.string().min(10, "Le téléphone doit contenir au moins 10 caractères").max(20, "Téléphone trop long"),
    email: z.string().email("Email invalide").max(255, "Email trop long"),
    statut: z.enum(["Actif", "Blessé", "Arrêt/Départ", "Désactivé"], { message: "Statut invalide" }),
    role_joueur: z.boolean(),
    role_bureau: z.boolean(),
    fonction_bureau: z.string().max(100, "Fonction trop longue").optional().nullable(),
    date_entree: z.string().min(1, "La date d'entrée est requise").regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
})

export type MembreFormData = z.infer<typeof membreSchema>

// ───── Budget ─────
export const budgetSchema = z.object({
    categorie: z.string().min(1, "La catégorie est requise").max(100, "Catégorie trop longue"),
    type: z.enum(["Recette", "Dépense"], { message: "Le type doit être 'Recette' ou 'Dépense'" }),
    budget_alloue: z.number().positive("Le budget doit être positif").max(9999999.99, "Budget trop élevé"),
    periode_debut: z.string().min(1, "La période de début est requise").regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
    periode_fin: z.string().min(1, "La période de fin est requise").regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
}).refine(data => data.periode_fin >= data.periode_debut, {
    message: "La période de fin doit être après la période de début",
    path: ["periode_fin"],
})

export type BudgetFormData = z.infer<typeof budgetSchema>

// ───── IDs (pour delete/update) ─────
export const uuidSchema = z.string().uuid("ID invalide")

// ───── Helper : formater les erreurs Zod ─────
export function formatZodErrors(error: z.ZodError): string {
    return error.issues.map((e: z.ZodIssue) => e.message).join(". ")
}

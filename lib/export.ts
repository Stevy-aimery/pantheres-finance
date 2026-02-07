/**
 * Utilitaires d'export de données en CSV et Excel
 */

interface ExportColumn<T> {
    key: keyof T | string
    label: string
    format?: (value: any, row: T) => string
}

/**
 * Convertit un tableau d'objets en chaîne CSV
 */
export function convertToCSV<T extends Record<string, any>>(
    data: T[],
    columns: ExportColumn<T>[]
): string {
    // Générer l'en-tête
    const header = columns.map(col => `"${col.label}"`).join(";")

    // Générer les lignes de données
    const rows = data.map(row => {
        return columns.map(col => {
            let value: any

            // Gérer les clés imbriquées (ex: "membre.nom")
            if (typeof col.key === "string" && col.key.includes(".")) {
                const keys = col.key.split(".")
                value = keys.reduce((obj, key) => obj?.[key], row)
            } else {
                value = row[col.key as keyof T]
            }

            // Appliquer le formateur si présent
            if (col.format) {
                value = col.format(value, row)
            }

            // Échapper les guillemets et encadrer
            if (value === null || value === undefined) {
                return '""'
            }
            return `"${String(value).replace(/"/g, '""')}"`
        }).join(";")
    })

    return [header, ...rows].join("\n")
}

/**
 * Télécharge une chaîne CSV en tant que fichier
 */
export function downloadCSV(csvContent: string, filename: string): void {
    // Ajouter le BOM UTF-8 pour Excel
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
}

/**
 * Formate une date pour l'export
 */
export function formatDateExport(date: string | Date): string {
    if (!date) return ""
    const d = new Date(date)
    return d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    })
}

/**
 * Formate un montant pour l'export
 */
export function formatMontantExport(montant: number): string {
    return montant.toFixed(2).replace(".", ",")
}

// Colonnes prédéfinies pour les transactions
export const TRANSACTIONS_EXPORT_COLUMNS = [
    { key: "date_transaction", label: "Date", format: formatDateExport },
    { key: "type", label: "Type" },
    { key: "categorie", label: "Catégorie" },
    { key: "description", label: "Description" },
    { key: "montant", label: "Montant (MAD)", format: formatMontantExport },
    { key: "mode_paiement", label: "Mode de paiement" },
]

// Colonnes prédéfinies pour les membres
export const MEMBRES_EXPORT_COLUMNS = [
    { key: "nom_prenom", label: "Nom Prénom" },
    { key: "email", label: "Email" },
    { key: "telephone", label: "Téléphone" },
    { key: "statut", label: "Statut" },
    { key: "role_joueur", label: "Joueur", format: (v: boolean) => v ? "Oui" : "Non" },
    { key: "role_bureau", label: "Bureau", format: (v: boolean) => v ? "Oui" : "Non" },
    { key: "fonction_bureau", label: "Fonction Bureau" },
    { key: "cotisation_mensuelle", label: "Cotisation (MAD)", format: formatMontantExport },
    { key: "date_entree", label: "Date d'entrée", format: formatDateExport },
]

// Colonnes prédéfinies pour les cotisations
export const COTISATIONS_EXPORT_COLUMNS = [
    { key: "nom_prenom", label: "Membre" },
    { key: "cotisation_mensuelle", label: "Cotisation Mensuelle (MAD)", format: formatMontantExport },
    { key: "total_paye", label: "Total Payé (MAD)", format: formatMontantExport },
    { key: "reste_a_payer", label: "Reste à Payer (MAD)", format: formatMontantExport },
    { key: "pourcentage_paye", label: "% Payé", format: (v: number) => `${v.toFixed(0)}%` },
    { key: "etat_paiement", label: "État" },
]

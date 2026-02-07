/**
 * Configuration centrale de la durée de saison
 * 
 * Ce fichier centralise tous les paramètres liés à la durée de la saison
 * pour faciliter les modifications futures.
 */

/**
 * Durée de la saison en mois
 * 
 * IMPORTANT: Cette valeur doit être synchronisée avec:
 * 1. La variable d'environnement: NEXT_PUBLIC_DUREE_SAISON_MOIS dans .env.local
 * 2. Le paramètre Supabase: parametres.duree_saison_mois
 * 
 * @default 5 (Mars à Juillet 2026)
 */
export const DUREE_SAISON_MOIS = Number(process.env.NEXT_PUBLIC_DUREE_SAISON_MOIS || 5)

/**
 * Date de début de saison
 * Format: YYYY-MM-DD
 */
export const DATE_DEBUT_SAISON = "2026-03-05"

/**
 * Date de fin de saison
 * Format: YYYY-MM-DD
 */
export const DATE_FIN_SAISON = "2026-07-31"

/**
 * Jour du mois où les cotisations sont dues
 * @default 5 (le 5 de chaque mois)
 */
export const JOUR_COTISATION = 5

/**
 * Calcule le total de cotisation pour la saison
 * @param cotisationMensuelle - Montant mensuel de la cotisation
 * @returns Total à payer pour la saison
 */
export function calculerCotisationSaison(cotisationMensuelle: number): number {
    return cotisationMensuelle * DUREE_SAISON_MOIS
}

/**
 * Calcule le pourcentage de paiement
 * @param totalPaye - Montant total payé
 * @param cotisationMensuelle - Montant mensuel de la cotisation
 * @returns Pourcentage (0-100)
 */
export function calculerPourcentagePaiement(
    totalPaye: number,
    cotisationMensuelle: number
): number {
    const totalAttendu = calculerCotisationSaison(cotisationMensuelle)
    if (totalAttendu === 0) return 100
    return Math.min(Math.round((totalPaye / totalAttendu) * 100), 100)
}

/**
 * Calcule le reste à payer
 * @param totalPaye - Montant total payé
 * @param cotisationMensuelle - Montant mensuel de la cotisation
 * @returns Reste à payer (0 si négatif)
 */
export function calculerResteAPayer(
    totalPaye: number,
    cotisationMensuelle: number
): number {
    const totalAttendu = calculerCotisationSaison(cotisationMensuelle)
    return Math.max(totalAttendu - totalPaye, 0)
}

/**
 * Détermine l'état de paiement d'un membre
 * @param totalPaye - Montant total payé
 * @param cotisationMensuelle - Montant mensuel de la cotisation
 * @returns "À Jour" ou "Retard"
 */
export function determinerEtatPaiement(
    totalPaye: number,
    cotisationMensuelle: number
): "À Jour" | "Retard" {
    const resteAPayer = calculerResteAPayer(totalPaye, cotisationMensuelle)
    return resteAPayer <= 0 ? "À Jour" : "Retard"
}

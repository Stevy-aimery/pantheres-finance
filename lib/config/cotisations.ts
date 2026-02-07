/**
 * Configuration centrale des montants de cotisations
 * 
 * Ce fichier centralise tous les paramètres liés aux montants de cotisations
 * pour faciliter les modifications futures.
 * 
 * IMPORTANT: Ces valeurs doivent être synchronisées avec Supabase (table parametres)
 */

/**
 * Montant de cotisation mensuelle pour un joueur (MAD)
 * 
 * IMPORTANT: Cette valeur doit être synchronisée avec:
 * 1. La variable d'environnement: NEXT_PUBLIC_MONTANT_JOUEUR dans .env.local
 * 2. Le paramètre Supabase: parametres.montant_joueur
 * 
 * @default 100 (100 MAD/mois)
 */
export const MONTANT_COTISATION_JOUEUR = Number(process.env.NEXT_PUBLIC_MONTANT_JOUEUR || 100)

/**
 * Montant de cotisation mensuelle pour un membre du bureau (MAD)
 * 
 * IMPORTANT: Cette valeur doit être synchronisée avec:
 * 1. La variable d'environnement: NEXT_PUBLIC_MONTANT_BUREAU dans .env.local
 * 2. Le paramètre Supabase: parametres.montant_bureau
 * 
 * @default 150 (150 MAD/mois)
 */
export const MONTANT_COTISATION_BUREAU = Number(process.env.NEXT_PUBLIC_MONTANT_BUREAU || 150)

/**
 * Obtient le montant de cotisation en fonction des rôles
 * 
 * Règle: Si membre du bureau, le montant bureau a la priorité
 * 
 * @param roleJoueur - Si le membre est joueur
 * @param roleBureau - Si le membre est au bureau
 * @returns Montant mensuel de cotisation
 */
export function obtenirMontantCotisation(
    roleJoueur: boolean,
    roleBureau: boolean
): number {
    // Priorité au rôle bureau
    if (roleBureau) {
        return MONTANT_COTISATION_BUREAU
    }

    if (roleJoueur) {
        return MONTANT_COTISATION_JOUEUR
    }

    return 0
}

/**
 * Formate un montant en MAD (Dirham marocain)
 * @param montant - Montant à formater
 * @returns Montant formaté avec "MAD"
 */
export function formaterMontantMAD(montant: number): string {
    return new Intl.NumberFormat("fr-MA", {
        style: "decimal",
        minimumFractionDigits: 0,
    }).format(montant) + " MAD"
}

/**
 * Type représentant les rôles possibles
 */
export type Role = "joueur" | "bureau" | "beide" | "aucun"

/**
 * Détermine le rôle d'un membre
 * @param roleJoueur - Si le membre est joueur
 * @param roleBureau - Si le membre est au bureau
 * @returns Type de rôle
 */
export function determinerRole(roleJoueur: boolean, roleBureau: boolean): Role {
    if (roleJoueur && roleBureau) return "beide"
    if (roleBureau) return "bureau"
    if (roleJoueur) return "joueur"
    return "aucun"
}

/**
 * Obtient le label du rôle en français
 * @param role - Type de rôle
 * @returns Label en français
 */
export function obtenirLabelRole(role: Role): string {
    const labels: Record<Role, string> = {
        joueur: "Joueur",
        bureau: "Bureau",
        beide: "Joueur & Bureau",
        aucun: "Aucun rôle"
    }
    return labels[role]
}

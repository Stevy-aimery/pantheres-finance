// ═══════════════════════════════════════════════
//  TYPES CENTRALISÉS
//  Source unique pour les types partagés
// ═══════════════════════════════════════════════

export type UserRole = "tresorier" | "bureau" | "joueur"

export interface Parametre {
    id: string
    cle: string
    valeur: string
    type: "number" | "string" | "json" | "boolean"
    description: string | null
    updated_by: string | null
    updated_at: string
}

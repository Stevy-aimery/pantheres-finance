"use client"

import { createContext, useContext, ReactNode } from "react"

// ===== DÉFINITION DES RÔLES =====
export type UserRole = "tresorier" | "bureau" | "joueur"

// Fonctions bureau qui peuvent exporter
export const EXPORT_ALLOWED_FUNCTIONS = ["Président", "Manager", "Secrétaire Général"]

// ===== PERMISSIONS =====
export const PERMISSIONS = {
    // Navigation / Pages
    VIEW_DASHBOARD: "view_dashboard",
    VIEW_DASHBOARD_GLOBAL: "view_dashboard_global", // Dashboard complet
    VIEW_DASHBOARD_PERSONAL: "view_dashboard_personal", // Dashboard personnel joueur
    VIEW_MEMBRES: "view_membres",
    VIEW_TRANSACTIONS: "view_transactions",
    VIEW_BUDGET: "view_budget",
    VIEW_RAPPORTS: "view_rapports",
    VIEW_PARAMETRES: "view_parametres",
    VIEW_MESSAGES: "view_messages",

    // Actions CRUD (Trésorier uniquement)
    CREATE_TRANSACTION: "create_transaction",
    EDIT_TRANSACTION: "edit_transaction",
    DELETE_TRANSACTION: "delete_transaction",
    CREATE_MEMBRE: "create_membre",
    EDIT_MEMBRE: "edit_membre",
    DELETE_MEMBRE: "delete_membre",
    EDIT_BUDGET: "edit_budget",
    ADD_PAIEMENT: "add_paiement",

    // Exports
    EXPORT_DATA: "export_data",

    // Messages
    SEND_MESSAGE: "send_message",
    REPLY_MESSAGE: "reply_message", // Trésorier uniquement
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// ===== MATRICE DES PERMISSIONS PAR RÔLE =====
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    tresorier: [
        // Pages - Toutes
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_DASHBOARD_GLOBAL,
        PERMISSIONS.VIEW_MEMBRES,
        PERMISSIONS.VIEW_TRANSACTIONS,
        PERMISSIONS.VIEW_BUDGET,
        PERMISSIONS.VIEW_RAPPORTS,
        PERMISSIONS.VIEW_PARAMETRES,
        PERMISSIONS.VIEW_MESSAGES,

        // Actions CRUD - Toutes
        PERMISSIONS.CREATE_TRANSACTION,
        PERMISSIONS.EDIT_TRANSACTION,
        PERMISSIONS.DELETE_TRANSACTION,
        PERMISSIONS.CREATE_MEMBRE,
        PERMISSIONS.EDIT_MEMBRE,
        PERMISSIONS.DELETE_MEMBRE,
        PERMISSIONS.EDIT_BUDGET,
        PERMISSIONS.ADD_PAIEMENT,

        // Exports
        PERMISSIONS.EXPORT_DATA,

        // Messages
        PERMISSIONS.SEND_MESSAGE,
        PERMISSIONS.REPLY_MESSAGE,
    ],
    bureau: [
        // Pages - Lecture seule (sauf Paramètres)
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_DASHBOARD_GLOBAL,
        PERMISSIONS.VIEW_MEMBRES,
        PERMISSIONS.VIEW_TRANSACTIONS,
        PERMISSIONS.VIEW_BUDGET,
        PERMISSIONS.VIEW_RAPPORTS,
        PERMISSIONS.VIEW_MESSAGES,

        // Aucune action CRUD

        // Export conditionnel (géré par canExport)

        // Messages - Envoyer seulement
        PERMISSIONS.SEND_MESSAGE,
    ],
    joueur: [
        // Pages - Dashboard personnel uniquement
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_DASHBOARD_PERSONAL,
        PERMISSIONS.VIEW_MESSAGES,

        // Aucune action CRUD
        // Aucun export

        // Messages - Envoyer seulement
        PERMISSIONS.SEND_MESSAGE,
    ],
}

// ===== NAVIGATION PAR RÔLE =====
export const NAVIGATION_BY_ROLE: Record<UserRole, string[]> = {
    tresorier: [
        "/dashboard",
        "/dashboard/membres",
        "/dashboard/transactions",
        "/dashboard/budget",
        "/dashboard/rapports",
        "/dashboard/messages",
        "/dashboard/parametres",
    ],
    bureau: [
        "/dashboard",
        "/dashboard/membres",
        "/dashboard/transactions",
        "/dashboard/budget",
        "/dashboard/rapports",
        "/dashboard/messages",
    ],
    joueur: [
        "/dashboard",
        "/dashboard/messages",
    ],
}

// ===== CONTEXT & PROVIDER =====
interface RoleContextType {
    role: UserRole
    fonctionBureau: string | null
    memberId: string | null
    hasPermission: (permission: Permission) => boolean
    canExport: () => boolean
    canAccessPage: (path: string) => boolean
    isTresorier: boolean
    isBureau: boolean
    isJoueur: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

interface RoleProviderProps {
    children: ReactNode
    role: string
    fonctionBureau?: string | null
    memberId?: string | null
}

export function RoleProvider({
    children,
    role,
    fonctionBureau = null,
    memberId = null,
}: RoleProviderProps) {
    const userRole = (role as UserRole) || "joueur"

    // Vérifier une permission
    const hasPermission = (permission: Permission): boolean => {
        return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false
    }

    // Vérifier si peut exporter (Trésorier ou Bureau avec fonction spéciale)
    const canExport = (): boolean => {
        if (userRole === "tresorier") return true
        if (userRole === "bureau" && fonctionBureau) {
            return EXPORT_ALLOWED_FUNCTIONS.includes(fonctionBureau)
        }
        return false
    }

    // Vérifier accès à une page
    const canAccessPage = (path: string): boolean => {
        const allowedPaths = NAVIGATION_BY_ROLE[userRole] || []
        // Vérifier correspondance exacte ou préfixe
        return allowedPaths.some(allowed =>
            path === allowed || path.startsWith(allowed + "/")
        )
    }

    const value: RoleContextType = {
        role: userRole,
        fonctionBureau,
        memberId,
        hasPermission,
        canExport,
        canAccessPage,
        isTresorier: userRole === "tresorier",
        isBureau: userRole === "bureau",
        isJoueur: userRole === "joueur",
    }

    return (
        <RoleContext.Provider value={value}>
            {children}
        </RoleContext.Provider>
    )
}

// ===== HOOK =====
export function useRole() {
    const context = useContext(RoleContext)
    if (context === undefined) {
        throw new Error("useRole must be used within a RoleProvider")
    }
    return context
}

// ===== COMPOSANTS CONDITIONNELS =====

// Afficher seulement si permission accordée
export function RequirePermission({
    permission,
    children,
    fallback = null,
}: {
    permission: Permission
    children: ReactNode
    fallback?: ReactNode
}) {
    const { hasPermission } = useRole()

    if (!hasPermission(permission)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

// Afficher seulement pour le trésorier
export function TresorierOnly({
    children,
    fallback = null,
}: {
    children: ReactNode
    fallback?: ReactNode
}) {
    const { isTresorier } = useRole()

    if (!isTresorier) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

// Afficher seulement pour Bureau et Joueur (pas Trésorier)
export function NonTresorierOnly({
    children,
}: {
    children: ReactNode
}) {
    const { isTresorier } = useRole()

    if (isTresorier) {
        return null
    }

    return <>{children}</>
}

// Composant pour l'export conditionnel
export function ExportButton({
    children,
    fallback = null,
}: {
    children: ReactNode
    fallback?: ReactNode
}) {
    const { canExport } = useRole()

    if (!canExport()) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

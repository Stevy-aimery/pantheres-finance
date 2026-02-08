"use client"

import { createContext, useContext, ReactNode } from "react"

// Définition des rôles
export type UserRole = "tresorier" | "bureau" | "joueur"

// Permissions disponibles
export const PERMISSIONS = {
    // Transactions
    CREATE_TRANSACTION: "create_transaction",
    EDIT_TRANSACTION: "edit_transaction",
    DELETE_TRANSACTION: "delete_transaction",
    VIEW_TRANSACTIONS: "view_transactions",

    // Membres
    CREATE_MEMBRE: "create_membre",
    EDIT_MEMBRE: "edit_membre",
    DELETE_MEMBRE: "delete_membre",
    VIEW_MEMBRES: "view_membres",

    // Budget
    VIEW_BUDGET: "view_budget",
    EDIT_BUDGET: "edit_budget",

    // Rapports
    VIEW_RAPPORTS: "view_rapports",
    EXPORT_DATA: "export_data",

    // Paramètres
    MANAGE_SETTINGS: "manage_settings",

    // Paiements
    ADD_PAIEMENT: "add_paiement",
    VIEW_ALL_PAIEMENTS: "view_all_paiements",
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Matrice des permissions par rôle
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    tresorier: [
        // Accès complet
        PERMISSIONS.CREATE_TRANSACTION,
        PERMISSIONS.EDIT_TRANSACTION,
        PERMISSIONS.DELETE_TRANSACTION,
        PERMISSIONS.VIEW_TRANSACTIONS,
        PERMISSIONS.CREATE_MEMBRE,
        PERMISSIONS.EDIT_MEMBRE,
        PERMISSIONS.DELETE_MEMBRE,
        PERMISSIONS.VIEW_MEMBRES,
        PERMISSIONS.VIEW_BUDGET,
        PERMISSIONS.EDIT_BUDGET,
        PERMISSIONS.VIEW_RAPPORTS,
        PERMISSIONS.EXPORT_DATA,
        PERMISSIONS.MANAGE_SETTINGS,
        PERMISSIONS.ADD_PAIEMENT,
        PERMISSIONS.VIEW_ALL_PAIEMENTS,
    ],
    bureau: [
        // Accès lecture + paiements
        PERMISSIONS.VIEW_TRANSACTIONS,
        PERMISSIONS.VIEW_MEMBRES,
        PERMISSIONS.VIEW_BUDGET,
        PERMISSIONS.VIEW_RAPPORTS,
        PERMISSIONS.EXPORT_DATA,
        PERMISSIONS.ADD_PAIEMENT,
        PERMISSIONS.VIEW_ALL_PAIEMENTS,
    ],
    joueur: [
        // Accès limité - voir uniquement ses propres données
        PERMISSIONS.VIEW_MEMBRES, // Liste membres seulement
    ],
}

// Context
interface RoleContextType {
    role: UserRole
    hasPermission: (permission: Permission) => boolean
    isTresorier: boolean
    isBureau: boolean
    isJoueur: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

// Provider
export function RoleProvider({
    children,
    role,
}: {
    children: ReactNode
    role: string
}) {
    const userRole = (role as UserRole) || "joueur"

    const hasPermission = (permission: Permission): boolean => {
        return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false
    }

    const value: RoleContextType = {
        role: userRole,
        hasPermission,
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

// Hook
export function useRole() {
    const context = useContext(RoleContext)
    if (context === undefined) {
        throw new Error("useRole must be used within a RoleProvider")
    }
    return context
}

// Composant conditionnel basé sur les permissions
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
        return fallback
    }

    return <>{children}</>
}

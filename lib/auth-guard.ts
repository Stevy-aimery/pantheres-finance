"use server"

import { createClient } from "@/lib/supabase/server"

// ===== TYPES =====
export type UserRole = "tresorier" | "bureau" | "joueur"

export interface AuthContext {
    user: {
        id: string
        email: string
    }
    role: UserRole
    memberId: string | null
}

// ===== FONCTIONS UTILITAIRES =====

/**
 * Récupère le contexte d'authentification de l'utilisateur courant.
 * Vérifie que l'utilisateur est connecté et retourne son rôle.
 */
async function getAuthContext(): Promise<AuthContext> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error("Non authentifié")
    }

    const role = (user.user_metadata?.role as UserRole) || "joueur"

    // Récupérer le membre associé
    const { data: membre } = await supabase
        .from("membres")
        .select("id")
        .eq("email", user.email)
        .single()

    return {
        user: {
            id: user.id,
            email: user.email!,
        },
        role,
        memberId: membre?.id || null,
    }
}

/**
 * Vérifie que l'utilisateur a un rôle parmi les rôles autorisés.
 * Lève une erreur si non autorisé.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthContext> {
    const ctx = await getAuthContext()

    if (!allowedRoles.includes(ctx.role)) {
        throw new Error(`Accès refusé. Rôle requis : ${allowedRoles.join(" ou ")}. Rôle actuel : ${ctx.role}`)
    }

    return ctx
}

/**
 * Raccourci : vérifie que l'utilisateur est Trésorier.
 */
export async function requireTresorier(): Promise<AuthContext> {
    return requireRole(["tresorier"])
}

/**
 * Raccourci : vérifie que l'utilisateur est Trésorier ou Bureau.
 */
export async function requireTresorierOrBureau(): Promise<AuthContext> {
    return requireRole(["tresorier", "bureau"])
}

/**
 * Raccourci : vérifie que l'utilisateur est authentifié (tous rôles).
 */
export async function requireAuth(): Promise<AuthContext> {
    return requireRole(["tresorier", "bureau", "joueur"])
}

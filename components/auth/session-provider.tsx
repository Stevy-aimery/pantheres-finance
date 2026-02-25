"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

/**
 * SessionProvider — Composant client invisible
 * 
 * Écoute les événements d'auth Supabase (TOKEN_REFRESHED, SIGNED_OUT)
 * et rafraîchit la page pour synchroniser l'état serveur avec le client.
 * 
 * Évite les déconnexions silencieuses et les sessions expirées.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()

    useEffect(() => {
        const supabase = createClient()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
                // Le token a été rafraîchi, synchroniser les données serveur
                router.refresh()
            }

            if (event === "SIGNED_OUT") {
                // Rediriger vers login si déconnecté
                router.push("/login")
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

    return <>{children}</>
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Loader2 } from "lucide-react"

export default function SelectProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [roles, setRoles] = useState<string[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const rolesStr = localStorage.getItem("user_roles")
        const parsed = rolesStr ? JSON.parse(rolesStr) : []
        setRoles(parsed)

        // Si un seul rôle, sélectionner automatiquement
        if (parsed.length <= 1) {
            const role = parsed[0] || "joueur"
            document.cookie = `active-role=${role}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
            router.push("/dashboard")
        }
    }, [router])

    const handleSelect = async (role: string) => {
        setLoading(role)
        document.cookie = `active-role=${role}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
        router.push("/dashboard")
        router.refresh()
    }

    const profileCards = [
        {
            role: "joueur",
            title: "Joueur",
            description: "Accéder à votre espace personnel : cotisations, paiements et profil.",
            icon: "🏀",
            gradient: "from-emerald-500 to-emerald-600",
            shadow: "shadow-emerald-500/20",
        },
        {
            role: "bureau",
            title: "Membre du Bureau",
            description: "Consulter les transactions, membres, budget et rapports du club.",
            icon: "📋",
            gradient: "from-blue-500 to-blue-600",
            shadow: "shadow-blue-500/20",
        },
        {
            role: "tresorier",
            title: "Administrateur",
            description: "Accès complet : gestion des transactions, membres, paramètres.",
            icon: "⚙️",
            gradient: "from-amber-500 to-amber-600",
            shadow: "shadow-amber-500/20",
        },
    ]

    // Filtrer les cartes en fonction des rôles disponibles
    const availableProfiles = profileCards.filter(card => roles.includes(card.role))

    if (!mounted || availableProfiles.length <= 1) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-background to-background" />

            <div className="relative z-10 w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Choisissez votre profil</h1>
                    <p className="text-muted-foreground">
                        Vous avez plusieurs rôles. Sélectionnez l&apos;espace dans lequel vous souhaitez accéder.
                    </p>
                </div>

                {/* Profile Cards */}
                <div className={`grid gap-4 ${availableProfiles.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                    {availableProfiles.map((profile) => (
                        <Card
                            key={profile.role}
                            className={`cursor-pointer border-border/50 hover:border-amber-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${loading === profile.role ? "ring-2 ring-amber-500" : ""}`}
                            onClick={() => !loading && handleSelect(profile.role)}
                        >
                            <CardHeader className="text-center pb-3">
                                <div className={`mx-auto w-14 h-14 bg-gradient-to-br ${profile.gradient} rounded-xl flex items-center justify-center shadow-lg ${profile.shadow} text-2xl`}>
                                    {profile.icon}
                                </div>
                                <CardTitle className="text-lg mt-3">{profile.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <CardDescription className="text-sm">
                                    {profile.description}
                                </CardDescription>
                                {loading === profile.role && (
                                    <div className="mt-4 flex items-center justify-center gap-2 text-amber-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">Chargement...</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Loader2, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react"

export default function ChangePasswordPage() {
    const router = useRouter()
    const supabase = createClient()

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    // Règles de validation du mot de passe
    const rules = [
        { label: "Au moins 8 caractères", valid: password.length >= 8 },
        { label: "Au moins une majuscule", valid: /[A-Z]/.test(password) },
        { label: "Au moins un chiffre", valid: /[0-9]/.test(password) },
        { label: "Les mots de passe correspondent", valid: password.length > 0 && password === confirmPassword },
    ]

    const allValid = rules.every(r => r.valid)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!allValid) return

        setLoading(true)
        setError(null)

        // Mettre à jour le mot de passe
        const { error: updateError } = await supabase.auth.updateUser({
            password,
            data: {
                force_password_change: false,
            },
        })

        if (updateError) {
            setError(updateError.message)
            setLoading(false)
            return
        }

        // Rediriger vers le dashboard
        router.push("/dashboard")
        router.refresh()
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-background to-background" />

            <Card className="w-full max-w-md relative z-10 border-border/50 shadow-2xl">
                <CardHeader className="space-y-4 text-center pb-6">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">Changement de mot de passe</CardTitle>
                        <CardDescription className="mt-2">
                            Pour votre sécurité, veuillez définir un nouveau mot de passe.
                            <br />
                            <span className="text-amber-500 font-medium">Le mot de passe par défaut ne peut plus être utilisé.</span>
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nouveau mot de passe */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Nouveau mot de passe</Label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Nouveau mot de passe"
                                    className="pl-9 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirmation */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirmer le mot de passe"
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>

                        {/* Règles de validation */}
                        <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                            {rules.map((rule, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2
                                        className={`h-4 w-4 transition-colors ${rule.valid ? "text-emerald-500" : "text-muted-foreground/40"}`}
                                    />
                                    <span className={rule.valid ? "text-foreground" : "text-muted-foreground"}>
                                        {rule.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                            disabled={loading || !allValid}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Mise à jour...
                                </>
                            ) : (
                                "Définir mon nouveau mot de passe"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

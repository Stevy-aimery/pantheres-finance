"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

export function SuccessToast() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const success = searchParams.get("success")

    useEffect(() => {
        if (success === "created") {
            toast.success("Membre créé avec succès", {
                description: "Le membre a été ajouté à la liste",
            })
            // Nettoyer l'URL
            router.replace("/dashboard/membres", { scroll: false })
        } else if (success === "updated") {
            toast.success("Modification effectuée avec succès", {
                description: "Les informations du membre ont été mises à jour",
            })
            router.replace("/dashboard/membres", { scroll: false })
        } else if (success === "deleted") {
            toast.success("Membre supprimé", {
                description: "Le membre a été retiré de la liste",
            })
            router.replace("/dashboard/membres", { scroll: false })
        }
    }, [success, router])

    return null
}

import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { MembreForm } from "../membre-form"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ id: string }>
}

async function getMembre(id: string) {
    const supabase = await createClient()

    const { data: membre, error } = await supabase
        .from("membres")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !membre) {
        return null
    }

    return membre
}

export default async function EditMembrePage({ params }: PageProps) {
    const { id } = await params
    const membre = await getMembre(id)

    if (!membre) {
        notFound()
    }

    return <MembreForm membre={membre} mode="edit" />
}

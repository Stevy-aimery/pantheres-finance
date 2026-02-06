"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export type MembreFormData = {
    nom_prenom: string
    telephone: string
    email: string
    statut: string
    role_joueur: boolean
    role_bureau: boolean
    fonction_bureau: string | null
    date_entree: string
}

export async function createMembre(data: MembreFormData) {
    const supabase = await createClient()

    const { data: membre, error } = await supabase
        .from("membres")
        .insert([data])
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath("/dashboard/membres")
    redirect("/dashboard/membres")
}

export async function updateMembre(id: string, data: MembreFormData) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("membres")
        .update(data)
        .eq("id", id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath("/dashboard/membres")
    redirect("/dashboard/membres")
}

export async function deleteMembre(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("membres")
        .delete()
        .eq("id", id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath("/dashboard/membres")
    return { success: true }
}

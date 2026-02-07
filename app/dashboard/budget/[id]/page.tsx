import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BudgetForm } from "../budget-form"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ModifierBudgetPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: budget, error } = await supabase
        .from("budget")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !budget) {
        notFound()
    }

    return <BudgetForm budget={budget} />
}

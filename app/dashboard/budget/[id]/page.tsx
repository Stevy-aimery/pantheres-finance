import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { BudgetForm } from "../budget-form"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ModifierBudgetPage({ params }: PageProps) {
    // 🔒 Protection Bureau (lecture seule)
    const cookieStore = await cookies()
    const activeRole = cookieStore.get("active-role")?.value
    if (activeRole === "bureau") redirect("/dashboard/budget")

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

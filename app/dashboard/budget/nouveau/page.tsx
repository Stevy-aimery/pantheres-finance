import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { BudgetForm } from "../budget-form"

interface PageProps {
    searchParams: Promise<{ type?: string }>
}

export default async function NouveauBudgetPage({ searchParams }: PageProps) {
    // 🔒 Protection Bureau (lecture seule)
    const cookieStore = await cookies()
    const activeRole = cookieStore.get("active-role")?.value
    if (activeRole === "bureau") redirect("/dashboard/budget")

    const { type } = await searchParams

    return (
        <BudgetForm
            typePreselectionne={(type === "Recette" || type === "Dépense") ? type : undefined}
        />
    )
}

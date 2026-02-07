import { BudgetForm } from "../budget-form"

interface PageProps {
    searchParams: Promise<{ type?: string }>
}

export default async function NouveauBudgetPage({ searchParams }: PageProps) {
    const { type } = await searchParams

    return (
        <BudgetForm
            typePreselectionne={(type === "Recette" || type === "Dépense") ? type : undefined}
        />
    )
}

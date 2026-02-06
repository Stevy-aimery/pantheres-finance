import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Receipt, Plus, Construction } from "lucide-react"
import Link from "next/link"

export default function TransactionsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
                    <p className="text-muted-foreground">Journal des recettes et dépenses</p>
                </div>
                <Link href="/dashboard/transactions/nouvelle">
                    <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                        <Plus className="w-4 h-4" />
                        Nouvelle transaction
                    </Button>
                </Link>
            </div>

            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                        <Construction className="w-8 h-8 text-amber-500" />
                    </div>
                    <CardTitle className="mb-2">Module en développement</CardTitle>
                    <p className="text-muted-foreground max-w-md">
                        Le module Transactions sera disponible prochainement.
                        Il permettra d&apos;enregistrer et suivre toutes les entrées et sorties d&apos;argent.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

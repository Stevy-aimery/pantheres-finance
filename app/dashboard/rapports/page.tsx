import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Construction } from "lucide-react"

export default function RapportsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Rapports</h1>
                    <p className="text-muted-foreground">Génération et export des rapports financiers</p>
                </div>
                <Button className="gap-2" variant="outline">
                    <Download className="w-4 h-4" />
                    Exporter
                </Button>
            </div>

            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                        <Construction className="w-8 h-8 text-amber-500" />
                    </div>
                    <CardTitle className="mb-2">Module en développement</CardTitle>
                    <p className="text-muted-foreground max-w-md">
                        Le module Rapports sera disponible prochainement.
                        Il permettra de générer des comptes-rendus financiers en PDF/Excel.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

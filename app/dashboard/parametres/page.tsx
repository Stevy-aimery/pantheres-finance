import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Save, Construction } from "lucide-react"

export default function ParametresPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
                    <p className="text-muted-foreground">Configuration de l&apos;application</p>
                </div>
                <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                    <Save className="w-4 h-4" />
                    Enregistrer
                </Button>
            </div>

            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                        <Construction className="w-8 h-8 text-amber-500" />
                    </div>
                    <CardTitle className="mb-2">Module en développement</CardTitle>
                    <p className="text-muted-foreground max-w-md">
                        Le module Paramètres sera disponible prochainement.
                        Il permettra de configurer les montants de cotisation, les emails, et les alertes.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

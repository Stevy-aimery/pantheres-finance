import * as React from "react"

interface EmailTemplateProps {
    nomMembre: string
    montant: number
    mois: string
}

export const EmailRelanceCotisation: React.FC<Readonly<EmailTemplateProps>> = ({
    nomMembre,
    montant,
    mois,
}) => (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ backgroundColor: "#f59e0b", padding: "20px", textAlign: "center" }}>
            <h1 style={{ color: "white", margin: 0 }}>Panthères de Fès</h1>
        </div>
        <div style={{ padding: "30px", backgroundColor: "#f9fafb" }}>
            <h2 style={{ color: "#1f2937" }}>Rappel de Cotisation</h2>
            <p>Bonjour {nomMembre},</p>
            <p>
                Nous constatons que votre cotisation du mois de <strong>{mois}</strong> n&apos;a pas encore été reçue.
            </p>
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", margin: "20px 0" }}>
                <p style={{ margin: "5px 0" }}>
                    <strong>Montant dû :</strong> {montant} MAD
                </p>
                <p style={{ margin: "5px 0" }}>
                    <strong>Date limite :</strong> 05 {mois}
                </p>
            </div>
            <p>Merci de régulariser votre situation dans les meilleurs délais.</p>
            <p style={{ marginTop: "30px" }}>
                Cordialement,<br />
                <strong>Le Bureau - Panthères de Fès</strong>
            </p>
        </div>
        <div style={{ backgroundColor: "#1f2937", padding: "15px", textAlign: "center", fontSize: "12px", color: "#9ca3af" }}>
            <p style={{ margin: 0 }}>© 2026 Panthères de Fès - Tous droits réservés</p>
        </div>
    </div>
)

interface ConfirmationPaiementProps {
    nomMembre: string
    montant: number
    mois: string
    totalPaye: number
    resteAPayer: number
}

export const EmailConfirmationPaiement: React.FC<Readonly<ConfirmationPaiementProps>> = ({
    nomMembre,
    montant,
    mois,
    totalPaye,
    resteAPayer,
}) => (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ backgroundColor: "#10b981", padding: "20px", textAlign: "center" }}>
            <h1 style={{ color: "white", margin: 0 }}>✓ Paiement Confirmé</h1>
        </div>
        <div style={{ padding: "30px", backgroundColor: "#f9fafb" }}>
            <h2 style={{ color: "#1f2937" }}>Confirmation de Paiement</h2>
            <p>Bonjour {nomMembre},</p>
            <p>
                Votre paiement de <strong>{montant} MAD</strong> pour le mois de <strong>{mois}</strong> a bien été enregistré.
            </p>
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", margin: "20px 0" }}>
                <h3 style={{ marginTop: 0, color: "#059669" }}>Récapitulatif</h3>
                <p style={{ margin: "5px 0" }}>
                    <strong>Total payé (Saison 2025-2026) :</strong> {totalPaye} MAD
                </p>
                <p style={{ margin: "5px 0" }}>
                    <strong>Reste à payer :</strong> {resteAPayer} MAD
                </p>
            </div>
            <p>Merci de votre contribution !</p>
            <p style={{ marginTop: "30px" }}>
                Cordialement,<br />
                <strong>Le Bureau - Panthères de Fès</strong>
            </p>
        </div>
        <div style={{ backgroundColor: "#1f2937", padding: "15px", textAlign: "center", fontSize: "12px", color: "#9ca3af" }}>
            <p style={{ margin: 0 }}>© 2026 Panthères de Fès - Tous droits réservés</p>
        </div>
    </div>
)

interface RapportMensuelProps {
    mois: string
    soldeActuel: number
    tauxRecouvrement: number
    depensesMois: number
    totalRecettes: number
    totalDepenses: number
}

export const EmailRapportMensuel: React.FC<Readonly<RapportMensuelProps>> = ({
    mois,
    soldeActuel,
    tauxRecouvrement,
    depensesMois,
    totalRecettes,
    totalDepenses,
}) => (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ backgroundColor: "#3b82f6", padding: "20px", textAlign: "center" }}>
            <h1 style={{ color: "white", margin: 0 }}>📊 Rapport Mensuel</h1>
        </div>
        <div style={{ padding: "30px", backgroundColor: "#f9fafb" }}>
            <h2 style={{ color: "#1f2937" }}>Rapport Financier - {mois}</h2>
            <p>Bonjour,</p>
            <p>Veuillez trouver ci-dessous le rapport financier du mois de <strong>{mois}</strong>.</p>

            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", margin: "20px 0" }}>
                <h3 style={{ marginTop: 0, color: "#3b82f6" }}>KPIs Financiers</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "10px 0" }}>Solde actuel</td>
                            <td style={{ padding: "10px 0", textAlign: "right", fontWeight: "bold" }}>
                                {soldeActuel.toFixed(2)} MAD
                            </td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "10px 0" }}>Taux de recouvrement</td>
                            <td style={{ padding: "10px 0", textAlign: "right", fontWeight: "bold" }}>
                                {tauxRecouvrement.toFixed(0)}%
                            </td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "10px 0" }}>Dépenses du mois</td>
                            <td style={{ padding: "10px 0", textAlign: "right", fontWeight: "bold" }}>
                                {depensesMois.toFixed(2)} MAD
                            </td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "10px 0" }}>Total Recettes</td>
                            <td style={{ padding: "10px 0", textAlign: "right", color: "#10b981", fontWeight: "bold" }}>
                                {totalRecettes.toFixed(2)} MAD
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: "10px 0" }}>Total Dépenses</td>
                            <td style={{ padding: "10px 0", textAlign: "right", color: "#ef4444", fontWeight: "bold" }}>
                                {totalDepenses.toFixed(2)} MAD
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p>Consultez le dashboard pour plus de détails.</p>

            <p style={{ marginTop: "30px" }}>
                Cordialement,<br />
                <strong>Stevy Koumba - Trésorier</strong><br />
                Panthères de Fès
            </p>
        </div>
        <div style={{ backgroundColor: "#1f2937", padding: "15px", textAlign: "center", fontSize: "12px", color: "#9ca3af" }}>
            <p style={{ margin: 0 }}>© 2026 Panthères de Fès - Tous droits réservés</p>
        </div>
    </div>
)

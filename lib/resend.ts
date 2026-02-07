import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not defined")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Adresse email par défaut pour les envois
export const EMAIL_FROM = "Panthères de Fès <onboarding@resend.dev>" // À remplacer par votre domaine vérifié
export const EMAIL_TRESORIER = process.env.EMAIL_TRESORIER || "tresorier@pantheres.com"

"use client"

import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

// Couleurs thématiques Panthères
const COLORS = {
    primary: [245, 158, 11] as [number, number, number], // Amber-500
    secondary: [30, 41, 59] as [number, number, number], // Slate-800
    success: [16, 185, 129] as [number, number, number], // Emerald-500
    danger: [239, 68, 68] as [number, number, number], // Red-500
    muted: [100, 116, 139] as [number, number, number], // Slate-500
    white: [255, 255, 255] as [number, number, number],
    light: [248, 250, 252] as [number, number, number], // Slate-50
}

interface PDFExportOptions {
    title: string
    subtitle?: string
    filename: string
    orientation?: "portrait" | "landscape"
}

interface ColumnConfig {
    header: string
    key: string
    width?: number
    align?: "left" | "center" | "right"
}

// Formater les montants
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("fr-MA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount) + " MAD"
}

// Formater les dates
function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

// En-tête du PDF
function addHeader(doc: jsPDF, title: string, subtitle?: string) {
    const pageWidth = doc.internal.pageSize.getWidth()

    // Bannière en haut
    doc.setFillColor(...COLORS.secondary)
    doc.rect(0, 0, pageWidth, 35, "F")

    // Logo/Nom du club
    doc.setTextColor(...COLORS.primary)
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("🐆 PANTHÈRES DE FÈS", 14, 18)

    // Sous-titre du club
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Gestion Financière - Saison 2025-2026", 14, 28)

    // Date d'export
    const today = new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })
    doc.setFontSize(9)
    doc.text(`Généré le ${today}`, pageWidth - 14, 28, { align: "right" })

    // Titre du rapport
    doc.setTextColor(...COLORS.secondary)
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text(title, 14, 50)

    // Sous-titre optionnel
    if (subtitle) {
        doc.setFontSize(11)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(...COLORS.muted)
        doc.text(subtitle, 14, 58)
    }
}

// Pied de page
function addFooter(doc: jsPDF) {
    const pageCount = doc.getNumberOfPages()
    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        // Ligne de séparation
        doc.setDrawColor(...COLORS.muted)
        doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20)

        // Texte du footer
        doc.setFontSize(8)
        doc.setTextColor(...COLORS.muted)
        doc.text(
            "© Panthères de Fès - Document confidentiel",
            14,
            pageHeight - 12
        )
        doc.text(
            `Page ${i} / ${pageCount}`,
            pageWidth - 14,
            pageHeight - 12,
            { align: "right" }
        )
    }
}

// Export PDF générique avec table
export async function exportToPDF(
    data: Record<string, unknown>[],
    columns: ColumnConfig[],
    options: PDFExportOptions
): Promise<void> {
    const doc = new jsPDF({
        orientation: options.orientation || "portrait",
        unit: "mm",
        format: "a4",
    })

    // Ajouter l'en-tête
    addHeader(doc, options.title, options.subtitle)

    // Préparer les données pour autoTable
    const headers = columns.map((col) => col.header)
    const rows = data.map((item) =>
        columns.map((col) => {
            const value = item[col.key]
            if (typeof value === "number" && col.key.includes("montant")) {
                return formatCurrency(value)
            }
            if (typeof value === "string" && col.key.includes("date")) {
                return formatDate(value)
            }
            return String(value ?? "")
        })
    )

    // Générer la table
    autoTable(doc, {
        startY: 65,
        head: [headers],
        body: rows,
        theme: "striped",
        headStyles: {
            fillColor: COLORS.secondary,
            textColor: COLORS.white,
            fontStyle: "bold",
            fontSize: 9,
        },
        bodyStyles: {
            fontSize: 9,
            textColor: COLORS.secondary,
        },
        alternateRowStyles: {
            fillColor: COLORS.light,
        },
        columnStyles: columns.reduce((acc, col, idx) => {
            if (col.align) {
                acc[idx] = { halign: col.align }
            }
            return acc
        }, {} as Record<number, { halign: "left" | "center" | "right" }>),
        margin: { left: 14, right: 14 },
    })

    // Ajouter le pied de page
    addFooter(doc)

    // Télécharger
    const dateStr = new Date().toISOString().split("T")[0]
    doc.save(`${options.filename}_${dateStr}.pdf`)
}

// Export rapport financier avec totaux
export async function exportRapportFinancier(
    transactions: {
        date: string
        type: string
        categorie: string
        libelle: string
        entree: number
        sortie: number
    }[],
    totaux: {
        totalRecettes: number
        totalDepenses: number
        solde: number
    }
): Promise<void> {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    })

    addHeader(doc, "Rapport Financier", "Bilan des transactions")

    // Résumé des totaux
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 65

    // Cartes résumé
    const cardWidth = (pageWidth - 42) / 3

    // Recettes
    doc.setFillColor(16, 185, 129, 0.1)
    doc.roundedRect(14, y, cardWidth, 25, 3, 3, "F")
    doc.setTextColor(...COLORS.success)
    doc.setFontSize(10)
    doc.text("Total Recettes", 14 + cardWidth / 2, y + 10, { align: "center" })
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(formatCurrency(totaux.totalRecettes), 14 + cardWidth / 2, y + 19, { align: "center" })

    // Dépenses
    doc.setFillColor(239, 68, 68, 0.1)
    doc.roundedRect(14 + cardWidth + 7, y, cardWidth, 25, 3, 3, "F")
    doc.setTextColor(...COLORS.danger)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Total Dépenses", 14 + cardWidth + 7 + cardWidth / 2, y + 10, { align: "center" })
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(formatCurrency(totaux.totalDepenses), 14 + cardWidth + 7 + cardWidth / 2, y + 19, { align: "center" })

    // Solde
    const soldeColor = totaux.solde >= 0 ? COLORS.success : COLORS.danger
    doc.setFillColor(...COLORS.primary)
    doc.roundedRect(14 + (cardWidth + 7) * 2, y, cardWidth, 25, 3, 3, "F")
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Solde Actuel", 14 + (cardWidth + 7) * 2 + cardWidth / 2, y + 10, { align: "center" })
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(formatCurrency(totaux.solde), 14 + (cardWidth + 7) * 2 + cardWidth / 2, y + 19, { align: "center" })

    y += 35

    // Tableau des transactions
    const headers = ["Date", "Type", "Catégorie", "Description", "Montant"]
    const rows = transactions.map((t) => [
        formatDate(t.date),
        t.type,
        t.categorie,
        t.libelle,
        t.type === "Recette" ? `+${formatCurrency(t.entree)}` : `-${formatCurrency(t.sortie)}`,
    ])

    autoTable(doc, {
        startY: y,
        head: [headers],
        body: rows,
        theme: "striped",
        headStyles: {
            fillColor: COLORS.secondary,
            textColor: COLORS.white,
            fontStyle: "bold",
            fontSize: 9,
        },
        bodyStyles: {
            fontSize: 8,
            textColor: COLORS.secondary,
        },
        alternateRowStyles: {
            fillColor: COLORS.light,
        },
        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 22 },
            2: { cellWidth: 35 },
            3: { cellWidth: "auto" },
            4: { cellWidth: 30, halign: "right" },
        },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
            // Colorer les montants
            if (data.column.index === 4 && data.section === "body") {
                const text = String(data.cell.raw)
                if (text.startsWith("+")) {
                    data.cell.styles.textColor = COLORS.success
                } else if (text.startsWith("-")) {
                    data.cell.styles.textColor = COLORS.danger
                }
            }
        },
    })

    addFooter(doc)

    const dateStr = new Date().toISOString().split("T")[0]
    doc.save(`rapport_financier_${dateStr}.pdf`)
}

// Export reçu de paiement
export async function exportRecuPaiement(
    membre: {
        nom_prenom: string
        email: string
    },
    paiement: {
        mois: string
        montant: number
        date_paiement: string
        mode_paiement: string
    }
): Promise<void> {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    })

    addHeader(doc, "Reçu de Paiement", `Cotisation ${paiement.mois}`)

    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 70

    // Info membre
    doc.setFillColor(...COLORS.light)
    doc.roundedRect(14, y, pageWidth - 28, 40, 3, 3, "F")

    doc.setTextColor(...COLORS.secondary)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Informations du membre", 20, y + 12)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`Nom : ${membre.nom_prenom}`, 20, y + 22)
    doc.text(`Email : ${membre.email}`, 20, y + 30)

    y += 50

    // Détails paiement
    doc.setFillColor(...COLORS.primary)
    doc.roundedRect(14, y, pageWidth - 28, 60, 3, 3, "F")

    doc.setTextColor(...COLORS.white)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Détails du paiement", 20, y + 12)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`Mois : ${paiement.mois}`, 20, y + 26)
    doc.text(`Date de paiement : ${formatDate(paiement.date_paiement)}`, 20, y + 36)
    doc.text(`Mode de paiement : ${paiement.mode_paiement}`, 20, y + 46)

    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text(`Montant : ${formatCurrency(paiement.montant)}`, pageWidth - 20, y + 36, { align: "right" })

    y += 75

    // Validation
    doc.setTextColor(...COLORS.success)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("✓ PAIEMENT CONFIRMÉ", pageWidth / 2, y, { align: "center" })

    addFooter(doc)

    const dateStr = new Date().toISOString().split("T")[0]
    doc.save(`recu_${membre.nom_prenom.replace(/\s/g, "_")}_${paiement.mois}_${dateStr}.pdf`)
}

// Configuration des colonnes pour différents exports
export const PDF_COLUMNS = {
    transactions: [
        { header: "Date", key: "date", align: "left" as const },
        { header: "Type", key: "type", align: "center" as const },
        { header: "Catégorie", key: "categorie", align: "left" as const },
        { header: "Description", key: "description", align: "left" as const },
        { header: "Montant", key: "montant", align: "right" as const },
    ],
    membres: [
        { header: "Nom", key: "nom_prenom", align: "left" as const },
        { header: "Téléphone", key: "telephone", align: "left" as const },
        { header: "Email", key: "email", align: "left" as const },
        { header: "Statut", key: "statut", align: "center" as const },
        { header: "Cotisation", key: "cotisation_mensuelle", align: "right" as const },
    ],
    cotisations: [
        { header: "Membre", key: "nom_prenom", align: "left" as const },
        { header: "Total Dû", key: "total_du", align: "right" as const },
        { header: "Total Payé", key: "total_paye", align: "right" as const },
        { header: "Reste", key: "reste_a_payer", align: "right" as const },
        { header: "Statut", key: "etat_paiement", align: "center" as const },
    ],
}

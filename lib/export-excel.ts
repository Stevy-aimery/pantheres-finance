/**
 * Utilitaire d'export Excel avec design moderne
 * Utilise exceljs pour créer des fichiers Excel stylisés
 */

import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

// Couleurs du thème Panthères
const COLORS = {
    primary: "F59E0B",      // Amber/Orange (couleur principale)
    primaryDark: "D97706",  // Amber foncé
    secondary: "1F2937",    // Gris foncé
    success: "10B981",      // Vert
    danger: "EF4444",       // Rouge
    warning: "F59E0B",      // Orange
    info: "3B82F6",         // Bleu
    light: "F9FAFB",        // Gris très clair
    white: "FFFFFF",
    headerBg: "1F2937",     // Fond header sombre
    headerText: "FFFFFF",   // Texte header blanc
    alternateRow: "FEF3C7", // Ligne alternée (amber très clair)
    border: "E5E7EB",       // Bordure grise
}

interface ExcelColumn {
    key: string
    header: string
    width?: number
    style?: Partial<ExcelJS.Style>
    type?: "text" | "number" | "currency" | "percentage" | "date" | "status"
}

interface ExportOptions {
    title: string
    subtitle?: string
    filename: string
    sheetName?: string
}

/**
 * Style de base pour les cellules
 */
const getBaseCellStyle = (): Partial<ExcelJS.Style> => ({
    font: { name: "Calibri", size: 11 },
    alignment: { vertical: "middle" },
    border: {
        top: { style: "thin", color: { argb: COLORS.border } },
        bottom: { style: "thin", color: { argb: COLORS.border } },
        left: { style: "thin", color: { argb: COLORS.border } },
        right: { style: "thin", color: { argb: COLORS.border } },
    },
})

/**
 * Crée et télécharge un fichier Excel stylisé
 */
export async function exportToExcel<T extends Record<string, any>>(
    data: T[],
    columns: ExcelColumn[],
    options: ExportOptions
): Promise<void> {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Panthères de Fès - Finance"
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet(options.sheetName || "Données", {
        properties: { defaultRowHeight: 22 },
        views: [{ state: "frozen", ySplit: 4 }], // Figer les 4 premières lignes
    })

    // ===== EN-TÊTE DU DOCUMENT =====

    // Ligne 1 : Logo/Titre principal
    worksheet.mergeCells("A1", `${String.fromCharCode(64 + columns.length)}1`)
    const titleCell = worksheet.getCell("A1")
    titleCell.value = `🐆 ${options.title.toUpperCase()}`
    titleCell.font = { name: "Calibri", size: 18, bold: true, color: { argb: COLORS.white } }
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.primary } }
    titleCell.alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getRow(1).height = 35

    // Ligne 2 : Sous-titre avec date
    worksheet.mergeCells("A2", `${String.fromCharCode(64 + columns.length)}2`)
    const subtitleCell = worksheet.getCell("A2")
    const dateStr = new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    })
    subtitleCell.value = options.subtitle || `Généré le ${dateStr}`
    subtitleCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: COLORS.secondary } }
    subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.light } }
    subtitleCell.alignment = { horizontal: "center", vertical: "middle" }
    worksheet.getRow(2).height = 20

    // Ligne 3 : Espace
    worksheet.getRow(3).height = 10

    // ===== EN-TÊTES DES COLONNES (Ligne 4) =====
    const headerRow = worksheet.getRow(4)
    headerRow.height = 28

    columns.forEach((col, index) => {
        const cell = headerRow.getCell(index + 1)
        cell.value = col.header
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.headerText } }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.headerBg } }
        cell.alignment = { horizontal: "center", vertical: "middle" }
        cell.border = {
            top: { style: "medium", color: { argb: COLORS.primary } },
            bottom: { style: "medium", color: { argb: COLORS.primary } },
            left: { style: "thin", color: { argb: COLORS.headerBg } },
            right: { style: "thin", color: { argb: COLORS.headerBg } },
        }

        // Définir la largeur de colonne
        worksheet.getColumn(index + 1).width = col.width || 18
    })

    // ===== DONNÉES =====
    data.forEach((row, rowIndex) => {
        const excelRow = worksheet.getRow(5 + rowIndex)
        excelRow.height = 24

        // Alternance de couleur pour les lignes
        const isAlternate = rowIndex % 2 === 1

        columns.forEach((col, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1)
            let value = row[col.key]

            // Appliquer le style de base
            Object.assign(cell, getBaseCellStyle())

            // Fond alterné
            if (isAlternate) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.alternateRow } }
            } else {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.white } }
            }

            // Style selon le type de colonne
            switch (col.type) {
                case "currency":
                    cell.value = typeof value === "number" ? value : parseFloat(value) || 0
                    cell.numFmt = '#,##0.00 "MAD"'
                    cell.alignment = { horizontal: "right", vertical: "middle" }
                    if ((cell.value as number) < 0) {
                        cell.font = { ...cell.font, color: { argb: COLORS.danger } }
                    } else if ((cell.value as number) > 0) {
                        cell.font = { ...cell.font, color: { argb: COLORS.success } }
                    }
                    break

                case "percentage":
                    cell.value = typeof value === "number" ? value / 100 : 0
                    cell.numFmt = "0%"
                    cell.alignment = { horizontal: "center", vertical: "middle" }
                    break

                case "date":
                    if (value) {
                        cell.value = new Date(value)
                        cell.numFmt = "DD/MM/YYYY"
                    } else {
                        cell.value = ""
                    }
                    cell.alignment = { horizontal: "center", vertical: "middle" }
                    break

                case "status":
                    cell.value = value || ""
                    cell.alignment = { horizontal: "center", vertical: "middle" }
                    // Couleurs selon le statut
                    if (value === "À jour" || value === "Actif" || value === "OK") {
                        cell.font = { ...cell.font, bold: true, color: { argb: COLORS.success } }
                    } else if (value === "Retard" || value === "Dépassé" || value === "Arrêt/Départ") {
                        cell.font = { ...cell.font, bold: true, color: { argb: COLORS.danger } }
                    } else if (value === "Blessé" || value === "Attention") {
                        cell.font = { ...cell.font, bold: true, color: { argb: COLORS.warning } }
                    }
                    break

                case "number":
                    cell.value = typeof value === "number" ? value : parseFloat(value) || 0
                    cell.numFmt = "#,##0"
                    cell.alignment = { horizontal: "right", vertical: "middle" }
                    break

                default:
                    cell.value = value?.toString() || ""
                    cell.alignment = { horizontal: "left", vertical: "middle" }
            }
        })
    })

    // ===== LIGNE DE TOTAL (si applicable) =====
    // On ajoute une ligne de total pour les colonnes numériques
    const totalRow = worksheet.getRow(5 + data.length)
    totalRow.height = 28

    let hasTotals = false
    columns.forEach((col, colIndex) => {
        const cell = totalRow.getCell(colIndex + 1)

        if (col.type === "currency" || col.type === "number") {
            hasTotals = true
            const sum = data.reduce((acc, row) => acc + (parseFloat(row[col.key]) || 0), 0)
            cell.value = sum
            cell.numFmt = col.type === "currency" ? '#,##0.00 "MAD"' : "#,##0"
            cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.white } }
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.secondary } }
            cell.alignment = { horizontal: "right", vertical: "middle" }
        } else if (colIndex === 0) {
            cell.value = "TOTAL"
            cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: COLORS.white } }
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.secondary } }
            cell.alignment = { horizontal: "left", vertical: "middle" }
        } else {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.secondary } }
        }

        cell.border = {
            top: { style: "medium", color: { argb: COLORS.primary } },
            bottom: { style: "medium", color: { argb: COLORS.primary } },
        }
    })

    // ===== PIED DE PAGE =====
    const footerRowNum = 5 + data.length + (hasTotals ? 2 : 1)
    worksheet.mergeCells(`A${footerRowNum}`, `${String.fromCharCode(64 + columns.length)}${footerRowNum}`)
    const footerCell = worksheet.getCell(`A${footerRowNum}`)
    footerCell.value = `© ${new Date().getFullYear()} Panthères de Fès • ${data.length} lignes exportées`
    footerCell.font = { name: "Calibri", size: 9, italic: true, color: { argb: "9CA3AF" } }
    footerCell.alignment = { horizontal: "center", vertical: "middle" }

    // ===== TÉLÉCHARGEMENT =====
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    })
    saveAs(blob, `${options.filename}_${new Date().toISOString().split("T")[0]}.xlsx`)
}

// ===== CONFIGURATIONS PRÉ-DÉFINIES =====

export const EXCEL_COLUMNS = {
    transactions: [
        { key: "date", header: "Date", width: 14, type: "date" as const },
        { key: "type", header: "Type", width: 12, type: "status" as const },
        { key: "categorie", header: "Catégorie", width: 18 },
        { key: "description", header: "Description", width: 35 },
        { key: "montant", header: "Montant", width: 16, type: "currency" as const },
        { key: "mode_paiement", header: "Mode", width: 14 },
    ],

    membres: [
        { key: "nom_prenom", header: "Nom & Prénom", width: 25 },
        { key: "email", header: "Email", width: 28 },
        { key: "telephone", header: "Téléphone", width: 16 },
        { key: "statut", header: "Statut", width: 12, type: "status" as const },
        { key: "role", header: "Rôle", width: 14 },
        { key: "fonction_bureau", header: "Fonction", width: 16 },
        { key: "cotisation_mensuelle", header: "Cotisation", width: 14, type: "currency" as const },
        { key: "date_entree", header: "Membre depuis", width: 14, type: "date" as const },
    ],

    cotisations: [
        { key: "nom_prenom", header: "Membre", width: 25 },
        { key: "cotisation_mensuelle", header: "Mensuelle", width: 14, type: "currency" as const },
        { key: "total_paye", header: "Total Payé", width: 14, type: "currency" as const },
        { key: "reste_a_payer", header: "Reste à Payer", width: 14, type: "currency" as const },
        { key: "pourcentage_paye", header: "Progression", width: 12, type: "percentage" as const },
        { key: "etat_paiement", header: "État", width: 12, type: "status" as const },
    ],
}

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { MembreForm } from "../membre-form"

export default async function NouveauMembrePage() {
    // 🔒 Protection Bureau (lecture seule)
    const cookieStore = await cookies()
    const activeRole = cookieStore.get("active-role")?.value
    if (activeRole === "bureau") redirect("/dashboard/membres")

    return <MembreForm mode="create" />
}

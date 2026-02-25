import { createClient } from "@supabase/supabase-js"

/**
 * Client Supabase Admin — utilise la Service Role Key
 * ⚠️ NE JAMAIS utiliser côté client ou exposer cette clé
 * Usage : création de comptes Auth, opérations admin
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_URL non définie")
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}

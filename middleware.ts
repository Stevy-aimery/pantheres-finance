import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ===== ROUTES AUTORISÉES PAR RÔLE =====
const ROUTES_BY_ROLE: Record<string, string[]> = {
    tresorier: [
        "/dashboard",
        "/dashboard/membres",
        "/dashboard/transactions",
        "/dashboard/budget",
        "/dashboard/rapports",
        "/dashboard/messages",
        "/dashboard/parametres",
    ],
    bureau: [
        "/dashboard",
        "/dashboard/membres",
        "/dashboard/transactions",
        "/dashboard/budget",
        "/dashboard/rapports",
        "/dashboard/messages",
    ],
    joueur: [
        "/dashboard",
        "/dashboard/messages",
    ],
}

function isRouteAllowed(role: string, pathname: string): boolean {
    const allowedRoutes = ROUTES_BY_ROLE[role] || ROUTES_BY_ROLE.joueur
    return allowedRoutes.some(route =>
        pathname === route || pathname.startsWith(route + "/")
    )
}

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Routes publiques (pas besoin d'authentification)
    const publicRoutes = ['/login', '/auth/callback']
    const isPublicRoute = publicRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    )

    // Si pas connecté et route protégée, rediriger vers login
    if (!user && !isPublicRoute) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // Si connecté et sur la page login, rediriger vers dashboard
    if (user && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 🔒 RBAC : Vérification des routes par rôle
    if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
        const role = (user.user_metadata?.role as string) || 'joueur'

        if (!isRouteAllowed(role, request.nextUrl.pathname)) {
            // Rediriger vers le dashboard (page autorisée pour tous)
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes)
         */
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
}


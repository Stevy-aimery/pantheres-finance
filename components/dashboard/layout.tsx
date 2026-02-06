"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    LayoutDashboard,
    Users,
    Receipt,
    PiggyBank,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    Moon,
    Sun,
    Shield,
} from "lucide-react"
import { useTheme } from "next-themes"

interface DashboardLayoutProps {
    children: React.ReactNode
    user: User
    role: string
}

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Membres", href: "/dashboard/membres", icon: Users },
    { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
    { name: "Budget", href: "/dashboard/budget", icon: PiggyBank },
    { name: "Rapports", href: "/dashboard/rapports", icon: FileText },
    { name: "Paramètres", href: "/dashboard/parametres", icon: Settings },
]

export function DashboardLayout({ children, user, role }: DashboardLayoutProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { theme, setTheme } = useTheme()

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
        router.refresh()
    }

    const getRoleBadge = (role: string) => {
        const roleLabels: Record<string, { label: string; color: string }> = {
            tresorier: { label: "Trésorier", color: "bg-amber-500/20 text-amber-500" },
            bureau: { label: "Bureau", color: "bg-blue-500/20 text-blue-500" },
            joueur: { label: "Joueur", color: "bg-green-500/20 text-green-500" },
        }
        return roleLabels[role] || { label: role, color: "bg-gray-500/20 text-gray-500" }
    }

    const userInitials = user.email?.slice(0, 2).toUpperCase() || "U"
    const roleBadge = getRoleBadge(role)

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300",
                    sidebarCollapsed ? "w-[72px]" : "w-64",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-4 border-b border-border">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    {!sidebarCollapsed && (
                        <div className="overflow-hidden">
                            <h1 className="font-bold text-sm truncate">Panthères</h1>
                            <p className="text-xs text-muted-foreground truncate">Finance</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href))

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-amber-500/10 text-amber-500"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!sidebarCollapsed && <span>{item.name}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Collapse button (desktop only) */}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft className={cn("w-4 h-4 transition-transform", sidebarCollapsed && "rotate-180")} />
                </button>

                {/* User section */}
                <div className="p-3 border-t border-border">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors",
                                sidebarCollapsed && "justify-center"
                            )}>
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarFallback className="bg-amber-500/20 text-amber-500 text-xs">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                                {!sidebarCollapsed && (
                                    <div className="flex-1 text-left overflow-hidden">
                                        <p className="text-sm font-medium truncate">{user.email}</p>
                                        <span className={cn("text-xs px-1.5 py-0.5 rounded", roleBadge.color)}>
                                            {roleBadge.label}
                                        </span>
                                    </div>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                                {theme === "dark" ? (
                                    <Sun className="mr-2 h-4 w-4" />
                                ) : (
                                    <Moon className="mr-2 h-4 w-4" />
                                )}
                                {theme === "dark" ? "Mode clair" : "Mode sombre"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                Déconnexion
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main content */}
            <div className={cn(
                "transition-all duration-300",
                sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
            )}>
                {/* Top header (mobile) */}
                <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-sm border-b border-border lg:hidden">
                    <div className="flex items-center justify-between h-full px-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-sm">Panthères Finance</span>
                        </div>

                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-amber-500/20 text-amber-500 text-xs">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>

            {/* Mobile close button when sidebar is open */}
            {sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="fixed top-4 right-4 z-50 p-2 bg-card border border-border rounded-lg lg:hidden"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
    )
}

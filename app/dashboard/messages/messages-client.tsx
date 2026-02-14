"use client"

import { useState, useEffect, useRef, useCallback, useOptimistic } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    MessageSquare,
    Plus,
    Send,
    AlertTriangle,
    HelpCircle,
    Info,
    CheckCircle,
    Clock,
    Shield,
    Loader2,
    Search,
    ArrowLeft,
    User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ═══════════════════════════════════════════
//  TYPE DEFINITIONS
// ═══════════════════════════════════════════

interface Message {
    id: string
    contenu: string
    sujet: string
    type_message: "remarque" | "anomalie" | "question" | "autre"
    statut: "nouveau" | "en_cours" | "resolu"
    created_at: string
    is_from_tresorier: boolean
    membre_id: string
    parent_id: string | null
    auteur: {
        id: string
        nom_prenom: string
        fonction_bureau: string | null
    } | null
}

interface Conversation {
    id: string
    nom_prenom: string
    fonction_bureau: string | null
}

interface MessagesClientProps {
    messages: Message[]
    conversations: Conversation[]
    currentMembre: {
        id: string
        nom_prenom: string
        fonction_bureau: string | null
        role_bureau: boolean
    } | null
    role: string
}

// ═══════════════════════════════════════════
//  CONFIGS
// ═══════════════════════════════════════════

const MESSAGE_TYPES = {
    remarque: { label: "Remarque", icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
    anomalie: { label: "Anomalie", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    question: { label: "Question", icon: HelpCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
    autre: { label: "Autre", icon: MessageSquare, color: "text-gray-500", bg: "bg-gray-500/10" },
}

// ═══════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════

export function MessagesClient({
    messages: initialMessages,
    conversations,
    currentMembre,
    role,
}: MessagesClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const chatEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const isTresorier = role === "tresorier"

    // ─── STATE ───
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
        isTresorier ? null : currentMembre?.id || null
    )
    const [messageText, setMessageText] = useState("")
    const [sending, setSending] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [mobileShowChat, setMobileShowChat] = useState(false)

    // New message dialog
    const [newMessageOpen, setNewMessageOpen] = useState(false)
    const [newSujet, setNewSujet] = useState("")
    const [newContenu, setNewContenu] = useState("")
    const [newType, setNewType] = useState<"remarque" | "anomalie" | "question" | "autre">("remarque")

    // ─── DERIVED ───
    const conversationMessages = messages.filter(m => m.membre_id === selectedConversationId)
    const selectedContact = conversations.find(c => c.id === selectedConversationId)

    const filteredConversations = conversations.filter(c =>
        c.nom_prenom.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Stats
    const getUnreadCount = (membreId: string) =>
        messages.filter(m => m.membre_id === membreId && m.statut === "nouveau" && !m.is_from_tresorier).length

    const getLastMessage = (membreId: string) => {
        const membreMessages = messages.filter(m => m.membre_id === membreId)
        return membreMessages[membreMessages.length - 1]
    }

    // ─── SCROLL TO BOTTOM ───
    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [conversationMessages.length, selectedConversationId, scrollToBottom])

    // ─── SUPABASE REALTIME ───
    useEffect(() => {
        const channel = supabase
            .channel("messages-realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                (payload) => {
                    const newMessage = payload.new as Message
                    // Pour joueur : ne montrer que ses messages
                    if (!isTresorier && newMessage.membre_id !== currentMembre?.id) return

                    setMessages(prev => {
                        // Avoid duplicates (from optimistic UI)
                        if (prev.find(m => m.id === newMessage.id)) return prev
                        return [...prev, newMessage]
                    })
                    scrollToBottom()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, isTresorier, currentMembre?.id, scrollToBottom])

    // ─── SEND MESSAGE (Chat reply) ───
    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedConversationId) return

        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            contenu: messageText,
            sujet: "",
            type_message: "autre",
            statut: "nouveau",
            created_at: new Date().toISOString(),
            is_from_tresorier: isTresorier,
            membre_id: selectedConversationId,
            parent_id: null,
            auteur: currentMembre ? {
                id: currentMembre.id,
                nom_prenom: currentMembre.nom_prenom,
                fonction_bureau: currentMembre.fonction_bureau,
            } : null,
        }

        // Optimistic UI
        setMessages(prev => [...prev, optimisticMessage])
        setMessageText("")
        scrollToBottom()
        textareaRef.current?.focus()

        setSending(true)
        const { data, error } = await supabase.from("messages").insert({
            membre_id: selectedConversationId,
            contenu: optimisticMessage.contenu,
            sujet: "",
            type_message: "autre",
            statut: "nouveau",
            is_from_tresorier: isTresorier,
        }).select("id").single()

        setSending(false)

        if (error) {
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
            toast.error("Erreur lors de l'envoi")
            return
        }

        // Replace temp id with real id
        if (data) {
            setMessages(prev =>
                prev.map(m => m.id === optimisticMessage.id ? { ...m, id: data.id } : m)
            )
        }
    }

    // ─── NEW MESSAGE (Dialog — for first contact) ───
    const handleNewMessage = async () => {
        if (!currentMembre || !newContenu.trim()) {
            toast.error("Veuillez remplir le message")
            return
        }

        setSending(true)
        const { error } = await supabase.from("messages").insert({
            membre_id: currentMembre.id,
            sujet: newSujet || newType,
            contenu: newContenu,
            type_message: newType,
            statut: "nouveau",
            is_from_tresorier: false,
        })

        setSending(false)

        if (error) {
            toast.error("Erreur lors de l'envoi")
            return
        }

        toast.success("Message envoyé", {
            description: "Le trésorier recevra votre message",
        })
        setNewMessageOpen(false)
        setNewSujet("")
        setNewContenu("")
        setNewType("remarque")
        router.refresh()
    }

    // ─── KEY HANDLER ───
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    // ─── HELPERS ───
    const getInitials = (name: string) =>
        name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    }

    const formatDateSeparator = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (days === 0) return "Aujourd'hui"
        if (days === 1) return "Hier"
        if (days < 7) return date.toLocaleDateString("fr-FR", { weekday: "long" })
        return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    }

    const shouldShowDateSeparator = (msg: Message, index: number) => {
        if (index === 0) return true
        const prevDate = new Date(conversationMessages[index - 1].created_at).toDateString()
        const currDate = new Date(msg.created_at).toDateString()
        return prevDate !== currDate
    }

    // ═══════════════════════════════════════════
    //  RENDER
    // ═══════════════════════════════════════════

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
                    <p className="text-muted-foreground text-sm">
                        {isTresorier
                            ? "Conversations avec les membres"
                            : "Échangez avec le trésorier"}
                    </p>
                </div>
                {!isTresorier && (
                    <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Nouveau message</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Nouveau message</DialogTitle>
                                <DialogDescription>
                                    Envoyez un message au trésorier
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={newType} onValueChange={(v) => setNewType(v as typeof newType)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(MESSAGE_TYPES).map(([key, config]) => (
                                                <SelectItem key={key} value={key}>
                                                    <div className="flex items-center gap-2">
                                                        <config.icon className={cn("w-4 h-4", config.color)} />
                                                        {config.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sujet">Sujet (optionnel)</Label>
                                    <Input
                                        id="sujet"
                                        placeholder="Ex: Question sur mon paiement..."
                                        value={newSujet}
                                        onChange={(e) => setNewSujet(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contenu">Message</Label>
                                    <Textarea
                                        id="contenu"
                                        placeholder="Écrivez votre message ici..."
                                        rows={4}
                                        value={newContenu}
                                        onChange={(e) => setNewContenu(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setNewMessageOpen(false)}>
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleNewMessage}
                                    disabled={sending || !newContenu.trim()}
                                    className="bg-amber-500 hover:bg-amber-600"
                                >
                                    {sending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4 mr-2" />
                                    )}
                                    Envoyer
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* ═══════ CHAT LAYOUT ═══════ */}
            <div className="flex-1 flex rounded-xl border bg-card overflow-hidden min-h-0">

                {/* ──── SIDEBAR (Conversations) ──── */}
                {isTresorier && (
                    <div className={cn(
                        "w-full md:w-80 lg:w-96 border-r flex flex-col bg-muted/30",
                        mobileShowChat && "hidden md:flex"
                    )}>
                        {/* Search */}
                        <div className="p-3 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher un membre..."
                                    className="pl-9 bg-background"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Conversations list */}
                        <ScrollArea className="flex-1">
                            {filteredConversations.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground">
                                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Aucune conversation</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filteredConversations.map(contact => {
                                        const unread = getUnreadCount(contact.id)
                                        const lastMsg = getLastMessage(contact.id)
                                        const isActive = selectedConversationId === contact.id

                                        return (
                                            <button
                                                key={contact.id}
                                                onClick={() => {
                                                    setSelectedConversationId(contact.id)
                                                    setMobileShowChat(true)
                                                }}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/60",
                                                    isActive && "bg-amber-500/5 border-l-2 border-l-amber-500"
                                                )}
                                            >
                                                <Avatar className="h-10 w-10 flex-shrink-0">
                                                    <AvatarFallback className={cn(
                                                        "text-sm font-medium",
                                                        isActive
                                                            ? "bg-amber-500/20 text-amber-600"
                                                            : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {getInitials(contact.nom_prenom)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-sm truncate">
                                                            {contact.nom_prenom}
                                                        </span>
                                                        {lastMsg && (
                                                            <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                                                                {formatTime(lastMsg.created_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between mt-0.5">
                                                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                            {lastMsg
                                                                ? (lastMsg.is_from_tresorier ? "Vous : " : "") + lastMsg.contenu
                                                                : "Pas de messages"}
                                                        </p>
                                                        {unread > 0 && (
                                                            <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 h-5 min-w-5 flex items-center justify-center rounded-full ml-2 flex-shrink-0">
                                                                {unread}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                )}

                {/* ──── CHAT PANEL ──── */}
                <div className={cn(
                    "flex-1 flex flex-col min-w-0",
                    isTresorier && !mobileShowChat && !selectedConversationId && "hidden md:flex"
                )}>
                    {/* No conversation selected */}
                    {!selectedConversationId && isTresorier ? (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                    <MessageSquare className="w-8 h-8 text-amber-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Sélectionnez une conversation</p>
                                    <p className="text-sm">Choisissez un membre pour voir les messages</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div className="px-4 py-3 border-b flex items-center gap-3 bg-background">
                                {isTresorier && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden h-8 w-8"
                                        onClick={() => {
                                            setMobileShowChat(false)
                                            setSelectedConversationId(null)
                                        }}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </Button>
                                )}
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className={cn(
                                        isTresorier
                                            ? "bg-blue-500/20 text-blue-500"
                                            : "bg-amber-500/20 text-amber-500"
                                    )}>
                                        {isTresorier
                                            ? selectedContact
                                                ? getInitials(selectedContact.nom_prenom)
                                                : <User className="w-4 h-4" />
                                            : <Shield className="w-4 h-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">
                                        {isTresorier
                                            ? selectedContact?.nom_prenom || "Membre"
                                            : "Trésorier"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {isTresorier
                                            ? selectedContact?.fonction_bureau || "Joueur"
                                            : "Administration financière"}
                                    </p>
                                </div>
                            </div>

                            {/* Messages area */}
                            <ScrollArea className="flex-1 px-4">
                                <div className="py-4 space-y-1">
                                    {conversationMessages.length === 0 ? (
                                        <div className="flex items-center justify-center py-20 text-muted-foreground">
                                            <div className="text-center space-y-2">
                                                <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
                                                <p className="text-sm">Aucun message pour le moment</p>
                                                <p className="text-xs">Envoyez un message pour commencer</p>
                                            </div>
                                        </div>
                                    ) : (
                                        conversationMessages.map((msg, index) => {
                                            const isOwn = isTresorier
                                                ? msg.is_from_tresorier
                                                : !msg.is_from_tresorier
                                            const showDate = shouldShowDateSeparator(msg, index)

                                            return (
                                                <div key={msg.id}>
                                                    {/* Date separator */}
                                                    {showDate && (
                                                        <div className="flex items-center justify-center my-4">
                                                            <div className="px-3 py-1 rounded-full bg-muted text-[11px] text-muted-foreground font-medium">
                                                                {formatDateSeparator(msg.created_at)}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Subject badge (for first message with subject) */}
                                                    {msg.sujet && index === 0 && (
                                                        <div className="flex justify-center mb-3">
                                                            <Badge variant="secondary" className="text-xs gap-1">
                                                                {MESSAGE_TYPES[msg.type_message]?.icon && (
                                                                    <span className={MESSAGE_TYPES[msg.type_message].color}>
                                                                        {(() => {
                                                                            const Icon = MESSAGE_TYPES[msg.type_message].icon
                                                                            return <Icon className="w-3 h-3" />
                                                                        })()}
                                                                    </span>
                                                                )}
                                                                {msg.sujet}
                                                            </Badge>
                                                        </div>
                                                    )}

                                                    {/* Message bubble */}
                                                    <div className={cn(
                                                        "flex mb-1",
                                                        isOwn ? "justify-end" : "justify-start"
                                                    )}>
                                                        <div className={cn(
                                                            "max-w-[75%] sm:max-w-[65%]"
                                                        )}>
                                                            <div className={cn(
                                                                "px-3.5 py-2.5 rounded-2xl text-sm break-words leading-relaxed",
                                                                isOwn
                                                                    ? "bg-amber-500 text-white rounded-br-md"
                                                                    : "bg-muted rounded-bl-md",
                                                                msg.id.startsWith("temp-") && "opacity-70"
                                                            )}>
                                                                <p className="whitespace-pre-wrap">{msg.contenu}</p>
                                                            </div>
                                                            <p className={cn(
                                                                "text-[10px] text-muted-foreground mt-1 px-1",
                                                                isOwn ? "text-right" : "text-left"
                                                            )}>
                                                                {formatTime(msg.created_at)}
                                                                {isOwn && msg.id.startsWith("temp-") && (
                                                                    <span className="ml-1">
                                                                        <Clock className="w-2.5 h-2.5 inline" />
                                                                    </span>
                                                                )}
                                                                {isOwn && !msg.id.startsWith("temp-") && (
                                                                    <span className="ml-1">
                                                                        <CheckCircle className="w-2.5 h-2.5 inline text-emerald-400" />
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                            </ScrollArea>

                            {/* Input area */}
                            <div className="p-3 border-t bg-background">
                                <div className="flex items-end gap-2">
                                    <Textarea
                                        ref={textareaRef}
                                        placeholder="Écrire un message..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        rows={1}
                                        className="flex-1 resize-none min-h-[40px] max-h-[120px] rounded-xl bg-muted border-0 focus-visible:ring-1 focus-visible:ring-amber-500"
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!messageText.trim()}
                                        size="icon"
                                        className={cn(
                                            "h-10 w-10 rounded-xl flex-shrink-0 transition-all",
                                            messageText.trim()
                                                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md"
                                                : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {sending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                                    Appuyez sur Entrée pour envoyer · Shift+Entrée pour un retour à la ligne
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
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
    Reply,
    User,
    Shield,
    Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Message {
    id: string
    contenu: string
    sujet: string
    type_message: "remarque" | "anomalie" | "question" | "autre"
    statut: "nouveau" | "en_cours" | "resolu"
    created_at: string
    is_from_tresorier: boolean
    auteur: {
        id: string
        nom_prenom: string
        fonction_bureau: string | null
    } | null
    reponses: {
        id: string
        contenu: string
        created_at: string
        is_from_tresorier: boolean
        auteur: {
            id: string
            nom_prenom: string
        } | null
    }[]
}

interface MessagesClientProps {
    messages: Message[]
    currentMembre: {
        id: string
        nom_prenom: string
        fonction_bureau: string | null
        role_bureau: boolean
    } | null
    role: string
}

const MESSAGE_TYPES = {
    remarque: {
        label: "Remarque",
        icon: Info,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    anomalie: {
        label: "Signaler une anomalie",
        icon: AlertTriangle,
        color: "text-red-500",
        bg: "bg-red-500/10",
    },
    question: {
        label: "Question",
        icon: HelpCircle,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
    },
    autre: {
        label: "Autre",
        icon: MessageSquare,
        color: "text-gray-500",
        bg: "bg-gray-500/10",
    },
}

const STATUT_CONFIG = {
    nouveau: {
        label: "Nouveau",
        icon: Clock,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
    },
    en_cours: {
        label: "En cours",
        icon: Loader2,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    resolu: {
        label: "Résolu",
        icon: CheckCircle,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
}

export function MessagesClient({ messages, currentMembre, role }: MessagesClientProps) {
    const router = useRouter()
    const supabase = createClient()

    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
    const [newMessageOpen, setNewMessageOpen] = useState(false)
    const [replyText, setReplyText] = useState("")
    const [sending, setSending] = useState(false)

    // Form state
    const [newSujet, setNewSujet] = useState("")
    const [newContenu, setNewContenu] = useState("")
    const [newType, setNewType] = useState<"remarque" | "anomalie" | "question" | "autre">("remarque")

    const isTresorier = role === "tresorier"

    const handleNewMessage = async () => {
        if (!currentMembre || !newSujet.trim() || !newContenu.trim()) {
            toast.error("Veuillez remplir tous les champs")
            return
        }

        setSending(true)
        const { error } = await supabase.from("messages").insert({
            membre_id: currentMembre.id,
            sujet: newSujet,
            contenu: newContenu,
            type_message: newType,
            statut: "nouveau",
            is_from_tresorier: false,
        })

        setSending(false)

        if (error) {
            toast.error("Erreur lors de l'envoi du message")
            return
        }

        toast.success("Message envoyé", {
            description: "Le trésorier recevra votre message et vous répondra",
        })
        setNewMessageOpen(false)
        setNewSujet("")
        setNewContenu("")
        setNewType("remarque")
        router.refresh()
    }

    const handleReply = async () => {
        if (!selectedMessage || !replyText.trim()) return

        setSending(true)

        // Ajouter la réponse
        const { error } = await supabase.from("messages").insert({
            membre_id: currentMembre?.id,
            parent_id: selectedMessage.id,
            sujet: `Re: ${selectedMessage.sujet}`,
            contenu: replyText,
            type_message: selectedMessage.type_message,
            statut: "nouveau",
            is_from_tresorier: isTresorier,
        })

        if (!error && isTresorier) {
            // Mettre à jour le statut du message parent
            await supabase
                .from("messages")
                .update({ statut: "resolu" })
                .eq("id", selectedMessage.id)
        }

        setSending(false)

        if (error) {
            toast.error("Erreur lors de l'envoi de la réponse")
            return
        }

        toast.success("Réponse envoyée")
        setReplyText("")
        router.refresh()
    }

    const getInitials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (days === 0) {
            return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        } else if (days === 1) {
            return "Hier"
        } else if (days < 7) {
            return date.toLocaleDateString("fr-FR", { weekday: "long" })
        } else {
            return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
                    <p className="text-muted-foreground">
                        {isTresorier
                            ? "Gérez les messages et remarques des membres"
                            : "Contactez le trésorier ou signalez une anomalie"}
                    </p>
                </div>
                {!isTresorier && (
                    <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                                <Plus className="w-4 h-4" />
                                Nouveau message
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
                                    <Label>Type de message</Label>
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
                                    <Label htmlFor="sujet">Sujet</Label>
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
                                        rows={5}
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
                                    disabled={sending || !newSujet.trim() || !newContenu.trim()}
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

            {/* Stats pour Trésorier */}
            {isTresorier && (
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Clock className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {messages.filter(m => m.statut === "nouveau").length}
                                </p>
                                <p className="text-xs text-muted-foreground">Messages en attente</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {messages.filter(m => m.type_message === "anomalie").length}
                                </p>
                                <p className="text-xs text-muted-foreground">Anomalies signalées</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {messages.filter(m => m.statut === "resolu").length}
                                </p>
                                <p className="text-xs text-muted-foreground">Résolus</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Messages Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Liste des messages */}
                <Card className="lg:max-h-[600px] lg:overflow-hidden flex flex-col">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">
                            {isTresorier ? "Tous les messages" : "Mes messages"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-3">
                        {messages.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">Aucun message</p>
                                <p className="text-sm">
                                    {isTresorier
                                        ? "Les messages des membres apparaîtront ici"
                                        : "Cliquez sur \"Nouveau message\" pour commencer"}
                                </p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const typeConfig = MESSAGE_TYPES[message.type_message]
                                const statutConfig = STATUT_CONFIG[message.statut]
                                const isSelected = selectedMessage?.id === message.id

                                return (
                                    <div
                                        key={message.id}
                                        onClick={() => setSelectedMessage(message)}
                                        className={cn(
                                            "p-4 rounded-lg border transition-all cursor-pointer",
                                            isSelected
                                                ? "border-amber-500 bg-amber-500/5"
                                                : "hover:bg-muted/50",
                                            message.statut === "nouveau" && "border-l-4 border-l-amber-500"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("p-2 rounded-lg", typeConfig.bg)}>
                                                    <typeConfig.icon className={cn("w-4 h-4", typeConfig.color)} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{message.sujet}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        {isTresorier && message.auteur && (
                                                            <>
                                                                <span>{message.auteur.nom_prenom}</span>
                                                                <span>•</span>
                                                            </>
                                                        )}
                                                        <span>{formatDate(message.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <Badge className={cn("text-xs", statutConfig.bg, statutConfig.color)}>
                                                    {statutConfig.label}
                                                </Badge>
                                                {message.reponses.length > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {message.reponses.length} réponse(s)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                            {message.contenu}
                                        </p>
                                    </div>
                                )
                            })
                        )}
                    </CardContent>
                </Card>

                {/* Détails du message sélectionné */}
                <Card className="lg:max-h-[600px] lg:overflow-hidden flex flex-col">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Conversation</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        {!selectedMessage ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Sélectionnez un message pour voir la conversation</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Message original */}
                                <div className="flex gap-3">
                                    <Avatar className="h-10 w-10 flex-shrink-0">
                                        <AvatarFallback className="bg-blue-500/20 text-blue-500">
                                            {selectedMessage.auteur
                                                ? getInitials(selectedMessage.auteur.nom_prenom)
                                                : "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {selectedMessage.auteur?.nom_prenom || "Utilisateur"}
                                            </span>
                                            {selectedMessage.auteur?.fonction_bureau && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {selectedMessage.auteur.fonction_bureau}
                                                </Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(selectedMessage.created_at)}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg bg-muted">
                                            <p className="text-sm font-medium mb-1">{selectedMessage.sujet}</p>
                                            <p className="text-sm whitespace-pre-wrap">{selectedMessage.contenu}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Réponses */}
                                {selectedMessage.reponses.map((reponse) => (
                                    <div
                                        key={reponse.id}
                                        className={cn(
                                            "flex gap-3",
                                            reponse.is_from_tresorier && "flex-row-reverse"
                                        )}
                                    >
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                            <AvatarFallback className={cn(
                                                reponse.is_from_tresorier
                                                    ? "bg-amber-500/20 text-amber-500"
                                                    : "bg-blue-500/20 text-blue-500"
                                            )}>
                                                {reponse.is_from_tresorier
                                                    ? <Shield className="w-4 h-4" />
                                                    : reponse.auteur
                                                        ? getInitials(reponse.auteur.nom_prenom)
                                                        : "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={cn(
                                            "flex-1 space-y-1",
                                            reponse.is_from_tresorier && "text-right"
                                        )}>
                                            <div className={cn(
                                                "flex items-center gap-2",
                                                reponse.is_from_tresorier && "justify-end"
                                            )}>
                                                <span className="font-medium">
                                                    {reponse.is_from_tresorier
                                                        ? "Trésorier"
                                                        : reponse.auteur?.nom_prenom || "Utilisateur"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(reponse.created_at)}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "p-3 rounded-lg inline-block max-w-[85%]",
                                                reponse.is_from_tresorier
                                                    ? "bg-amber-500/10 text-left ml-auto"
                                                    : "bg-muted"
                                            )}>
                                                <p className="text-sm whitespace-pre-wrap">{reponse.contenu}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Zone de réponse */}
                                <div className="pt-4 border-t">
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder="Écrire une réponse..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            rows={2}
                                            className="flex-1 resize-none"
                                        />
                                        <Button
                                            onClick={handleReply}
                                            disabled={sending || !replyText.trim()}
                                            className="bg-amber-500 hover:bg-amber-600"
                                        >
                                            {sending ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

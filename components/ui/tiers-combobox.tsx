"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, User, Building2, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Membre {
    id: string
    nom_prenom: string
}

interface Sponsor {
    id: string
    nom: string
}

interface TiersComboboxProps {
    value: string
    onValueChange: (value: string) => void
    onMembreSelect?: (membreId: string) => void
    membres: Membre[]
    sponsors?: Sponsor[]
    placeholder?: string
}

export function TiersCombobox({
    value,
    onValueChange,
    onMembreSelect,
    membres,
    sponsors = [],
    placeholder = "Sélectionner ou saisir un tiers...",
}: TiersComboboxProps) {
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")

    // Trouver si la valeur actuelle correspond à un membre ou sponsor
    const selectedMembre = membres.find(m => m.nom_prenom === value)
    const selectedSponsor = sponsors.find(s => s.nom === value)

    const handleSelect = (selectedValue: string, type: "membre" | "sponsor" | "custom", id?: string) => {
        onValueChange(selectedValue)
        if (type === "membre" && id && onMembreSelect) {
            onMembreSelect(id)
        }
        setOpen(false)
        setSearchValue("")
    }

    const filteredMembres = membres.filter(m =>
        m.nom_prenom.toLowerCase().includes(searchValue.toLowerCase())
    )

    const filteredSponsors = sponsors.filter(s =>
        s.nom.toLowerCase().includes(searchValue.toLowerCase())
    )

    // Vérifier si la recherche correspond exactement à un membre ou sponsor
    const exactMatch =
        membres.some(m => m.nom_prenom.toLowerCase() === searchValue.toLowerCase()) ||
        sponsors.some(s => s.nom.toLowerCase() === searchValue.toLowerCase())

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {value ? (
                        <span className="flex items-center gap-2 truncate">
                            {selectedMembre && <User className="h-4 w-4 text-blue-500 shrink-0" />}
                            {selectedSponsor && <Building2 className="h-4 w-4 text-amber-500 shrink-0" />}
                            {!selectedMembre && !selectedSponsor && value && (
                                <span className="text-muted-foreground">📝</span>
                            )}
                            <span className="truncate">{value}</span>
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Rechercher ou saisir..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {searchValue.trim() ? (
                                <button
                                    className="flex items-center gap-2 w-full px-2 py-3 text-sm hover:bg-muted cursor-pointer"
                                    onClick={() => handleSelect(searchValue.trim(), "custom")}
                                >
                                    <PlusCircle className="h-4 w-4 text-emerald-500" />
                                    <span>Ajouter &quot;{searchValue.trim()}&quot;</span>
                                </button>
                            ) : (
                                <span className="text-muted-foreground">Aucun résultat</span>
                            )}
                        </CommandEmpty>

                        {/* Membres */}
                        {filteredMembres.length > 0 && (
                            <CommandGroup heading="👤 Membres">
                                {filteredMembres.map((membre) => (
                                    <CommandItem
                                        key={membre.id}
                                        value={membre.nom_prenom}
                                        onSelect={() => handleSelect(membre.nom_prenom, "membre", membre.id)}
                                    >
                                        <User className="mr-2 h-4 w-4 text-blue-500" />
                                        {membre.nom_prenom}
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                value === membre.nom_prenom ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {/* Sponsors */}
                        {filteredSponsors.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="🏢 Sponsors">
                                    {filteredSponsors.map((sponsor) => (
                                        <CommandItem
                                            key={sponsor.id}
                                            value={sponsor.nom}
                                            onSelect={() => handleSelect(sponsor.nom, "sponsor", sponsor.id)}
                                        >
                                            <Building2 className="mr-2 h-4 w-4 text-amber-500" />
                                            {sponsor.nom}
                                            <Check
                                                className={cn(
                                                    "ml-auto h-4 w-4",
                                                    value === sponsor.nom ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}

                        {/* Option saisie libre si pas de match exact */}
                        {searchValue.trim() && !exactMatch && (filteredMembres.length > 0 || filteredSponsors.length > 0) && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="✏️ Saisie personnalisée">
                                    <CommandItem
                                        value={`custom-${searchValue}`}
                                        onSelect={() => handleSelect(searchValue.trim(), "custom")}
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4 text-emerald-500" />
                                        Utiliser &quot;{searchValue.trim()}&quot;
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

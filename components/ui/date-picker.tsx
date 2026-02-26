"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, formatDateLong } from "@/lib/utils"
import { fr } from "date-fns/locale"

interface DatePickerProps {
    id?: string
    value: string // YYYY-MM-DD
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

/**
 * DatePicker réutilisable — affiche en français, stocke en YYYY-MM-DD
 */
export function DatePicker({
    id,
    value,
    onChange,
    placeholder = "Sélectionner une date",
    className,
    disabled,
}: DatePickerProps) {
    const [open, setOpen] = useState(false)

    const parseDate = (str: string): Date | undefined => {
        if (!str) return undefined
        const [y, m, d] = str.split("-").map(Number)
        if (!y || !m || !d) return undefined
        return new Date(y, m - 1, d)
    }

    const selected = parseDate(value)

    const handleSelect = (date: Date | undefined) => {
        if (!date) return
        const yyyy = date.getFullYear()
        const mm = String(date.getMonth() + 1).padStart(2, "0")
        const dd = String(date.getDate()).padStart(2, "0")
        onChange(`${yyyy}-${mm}-${dd}`)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !selected && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    {selected ? formatDateLong(selected) : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={handleSelect}
                    locale={fr}
                    defaultMonth={selected}
                    initialFocus
                    classNames={{
                        day_selected: "bg-amber-500 text-white hover:bg-amber-600 focus:bg-amber-600",
                        day_today: "border border-amber-400 text-amber-600 font-semibold",
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}

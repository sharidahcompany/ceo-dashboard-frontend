"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Edit } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionResource } from "@/actions/website/customiztion.actions";
import { Button } from "@/components/ui/button";

interface SortableSectionItemProps {
    section: SectionResource;
    onEdit?: (section: SectionResource) => void;
    onDelete?: (id: number) => void;
}

export function SortableSectionItem({ section, onEdit, onDelete }: SortableSectionItemProps) {
    const t = useTranslations();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    // Find a display name, fallback to type
    const displayName = section.type_localized || t("sections." + section.type, { defaultValue: section.type.charAt(0).toUpperCase() + section.type.slice(1) });
    
    // Fixed sections that have no customization
    const isFixed = ["products", "navbar", "footer", "vision"].includes(section.type);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-3 mb-2 bg-card border rounded-md shadow-sm group ${
                isDragging ? "opacity-50 border-primary" : "hover:border-primary/50"
            }`}
        >
            <div className="flex items-center gap-3">
                <button
                    className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="w-4 h-4" />
                </button>
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{displayName}</span>
                    <span className="text-xs text-muted-foreground">{t("attributes.order_value", { order: section.order, defaultValue: `Order: ${section.order}` })}</span>
                </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isFixed && onEdit && (
                    <Button variant="ghost" size="icon" onClick={() => onEdit(section)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Edit className="w-4 h-4" />
                    </Button>
                )}
                {onDelete && (
                    <Button variant="ghost" size="icon" onClick={() => onDelete(section.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

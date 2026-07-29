"use client"
import { BuffetResource, deleteBuffet } from "@/actions/buffet/buffet.actions";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Coffee, Edit, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import BuffetForm from "./BuffetForm";
import { FieldSeparator } from "@/components/ui/field";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Popover, PopoverClose, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

export default function Buffets({ buffets }: { buffets: BuffetResource[] }) {
    const t = useTranslations();
    const [openCreateForm, setOpenCreateForm] = React.useState(false);
    const [openEditForm, setOpenEditForm] = React.useState(false);
    const [selectedBuffet, setSelectedBuffet] = React.useState<BuffetResource | null>(null);
    const [deletingId, setDeletingId] = React.useState<number | null>(null);
    const [popoverOpenId, setPopoverOpenId] = React.useState<number | null>(null);
    const [isPending, startTransition] = React.useTransition();
    const router = useRouter();

    const onSuccess = () => {
        setOpenCreateForm(false);
        setOpenEditForm(false);
        setSelectedBuffet(null);
        router.refresh();
    };

    const handleEdit = (buffet: BuffetResource) => {
        setSelectedBuffet(buffet);
        setOpenEditForm(true);
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
        startTransition(async () => {
            const result = await deleteBuffet([id]);
            if (!result.success) {
                toast.error(result.error);
            } else {
                toast.success(result.data.message);
                setPopoverOpenId(null);
                router.refresh();
            }
            setDeletingId(null);
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>
                        {t("messages.buffets.available_buffets")}
                    </CardTitle>
                    <CardDescription>
                        {t("messages.buffets.available_buffets_description")}
                    </CardDescription>
                    {buffets.length > 0 && (
                        <CardAction>
                            <Button variant={'outline'} onClick={() => setOpenCreateForm(true)}>
                                <Coffee /> {t("messages.buffets.add_new_buffet")}
                            </Button>
                        </CardAction>
                    )}
                </CardHeader>
                <CardContent>
                    {buffets.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia>
                                    <Coffee />
                                </EmptyMedia>
                                <EmptyTitle>
                                    {t("messages.buffets.no_buffets")}
                                </EmptyTitle>
                                <EmptyDescription>
                                    {t("messages.buffets.no_buffets_description")}
                                </EmptyDescription>
                            </EmptyHeader>
                            <EmptyContent>
                                <Button variant={'outline'} onClick={() => setOpenCreateForm(true)}>
                                    <Coffee /> {t("messages.buffets.add_new_buffet")}
                                </Button>
                            </EmptyContent>
                        </Empty>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {buffets.map((buffet) => {
                                return (
                                    <Card
                                        key={buffet.id}
                                        className="flex flex-row items-center justify-between p-4 w-full cursor-pointer hover:border-primary/50 transition-colors"
                                        onClick={() => router.push(`/buffets/${buffet.id}`)}
                                    >
                                        <div className="flex items-center gap-4 w-full">
                                            {/* Icon Container */}
                                            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-muted text-muted-foreground shrink-0">
                                                <Coffee className="w-6 h-6" />
                                            </div>

                                            {/* Title & Description */}
                                            <CardHeader className="p-0 space-y-1 flex-1">
                                                <CardTitle className="text-base font-semibold leading-none">
                                                    {buffet.name_localized}
                                                </CardTitle>
                                                {buffet.branch?.name_localized && (
                                                    <CardDescription className="text-sm">
                                                        {buffet.branch.name_localized}
                                                    </CardDescription>
                                                )}
                                                <CardAction onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="ghost"
                                                        size={'icon-xs'}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(buffet);
                                                        }}
                                                    >
                                                        <Edit />
                                                    </Button>

                                                    {/* Popover Confirm Delete */}
                                                    <Popover
                                                        open={popoverOpenId === buffet.id}
                                                        onOpenChange={(open) => setPopoverOpenId(open ? buffet.id : null)}
                                                    >
                                                        <PopoverTrigger
                                                            render={
                                                                <Button
                                                                    variant="destructive"
                                                                    size={'icon-xs'}
                                                                    disabled={isPending && deletingId === buffet.id}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {isPending && deletingId === buffet.id ? (
                                                                        <Spinner className="w-3.5 h-3.5" />
                                                                    ) : (
                                                                        <Trash2 />
                                                                    )}
                                                                </Button>
                                                            }
                                                        />
                                                        <PopoverContent
                                                            className="w-64 p-3 space-y-3"
                                                            align="end"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="space-y-1">
                                                                <PopoverTitle className="font-semibold text-sm leading-none flex items-center gap-1.5 text-destructive">
                                                                    <Trash2 className="w-4 h-4" />
                                                                    {t("messages.buffets.delete_buffet_title")}
                                                                </PopoverTitle>
                                                                <PopoverDescription className="text-xs text-muted-foreground">
                                                                    {t("messages.buffets.delete_buffet_confirm")}
                                                                </PopoverDescription>
                                                            </div>
                                                            <div className="flex justify-end gap-2">
                                                                <PopoverClose
                                                                    render={
                                                                        <Button variant="outline" size="sm">
                                                                            {t("buttons.cancel")}
                                                                        </Button>
                                                                    }
                                                                />
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    disabled={isPending && deletingId === buffet.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(buffet.id);
                                                                    }}
                                                                >
                                                                    {isPending && deletingId === buffet.id ? (
                                                                        <Spinner className="w-3.5 h-3.5" />
                                                                    ) : (
                                                                        t("buttons.delete")
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </CardAction>
                                            </CardHeader>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={openCreateForm} onOpenChange={setOpenCreateForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={'flex items-center gap-1'}>
                            <Coffee /> {t("messages.buffets.add_new_buffet")}
                        </DialogTitle>
                        <DialogDescription>
                            {t("messages.buffets.add_new_buffet_description")}
                        </DialogDescription>
                    </DialogHeader>
                    <FieldSeparator />
                    <BuffetForm onSuccess={onSuccess} />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={openEditForm} onOpenChange={(open) => {
                setOpenEditForm(open);
                if (!open) setSelectedBuffet(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={'flex items-center gap-1'}>
                            <Coffee /> {t("messages.buffets.edit_buffet")}
                        </DialogTitle>
                        <DialogDescription>
                            {t("messages.buffets.edit_buffet_description")}
                        </DialogDescription>
                    </DialogHeader>
                    <FieldSeparator />
                    {selectedBuffet && (
                        <BuffetForm key={selectedBuffet.id} initialData={selectedBuffet} onSuccess={onSuccess} />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
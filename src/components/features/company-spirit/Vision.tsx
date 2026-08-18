"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Edit2, Sparkles, Image as ImageIcon, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import VisionForm, { VisionFormData } from "./VisionForm";
import { FieldSeparator } from "@/components/ui/field";
import { VisionResource } from "@/actions/company-spirit/vision.actions";
import GoalTimer from "./GoalTimer";

export default function Vision({ vision }: { vision: VisionResource | null }) {
    const t = useTranslations();
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedVision, setSelectedVision] = useState<VisionResource | null>(null);

    const handleEditClick = (item: VisionResource) => {
        setSelectedVision(item);
        setEditOpen(true);
    };

    return (
        <div  >
            <Card>
                <CardContent>
                    {!vision ? (
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 bg-primary/5 rounded-full text-primary">
                                <Sparkles className="size-10 stroke-[1.5]" />
                            </div>
                            <div className="space-y-1 max-w-sm">
                                <h3 className="text-lg font-semibold tracking-tight">{t("messages.vision.title")}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t("messages.vision.description")}
                                </p>
                            </div>
                            <Button onClick={() => setCreateOpen(true)} className="mt-2">
                                <Eye />
                                {t("buttons.add_new_vision")}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center  text-center space-y-4">
                            <div className="p-4 bg-primary/5 rounded-full w-24 h-24 text-primary flex justify-center items-center">
                                {vision.media_url ? (
                                    <Image src={vision.media_url} alt="Vision" width={100} height={100} className="w-20 h-auto object-contain" />
                                ) : (
                                    <Sparkles className="size-10 stroke-[1.5]" />
                                )}
                            </div>
                            <div className="space-y-1 max-w-sm">
                                <h3 className="text-lg font-semibold tracking-tight">{vision.title_localized}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {vision.description_localized}
                                </p>
                            </div>

                            {vision.end_date && <GoalTimer endDate={vision.end_date} className="w-fit" />}

                            <Button variant="outline" onClick={() => handleEditClick(vision)} >{t("buttons.edit_vision")}</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Vision Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent >
                    <DialogHeader>
                        <DialogTitle>{t("buttons.add_new_vision")}</DialogTitle>
                        <DialogDescription>
                            {t("messages.vision.description")}
                        </DialogDescription>
                        <FieldSeparator />
                    </DialogHeader>
                    <VisionForm
                        onSuccess={() => setCreateOpen(false)}
                        onCancel={() => setCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Vision Dialog */}
            <Dialog open={editOpen} onOpenChange={(open) => {
                setEditOpen(open);
                if (!open) setSelectedVision(null);
            }}>
                <DialogContent  >
                    <DialogHeader>
                        <DialogTitle>{t("buttons.edit_vision")}</DialogTitle>
                        <DialogDescription>
                            {t("messages.vision.description")}
                        </DialogDescription>
                        <FieldSeparator />
                    </DialogHeader>
                    {selectedVision && (
                        <VisionForm
                            initialData={selectedVision}
                            onSuccess={() => {
                                setEditOpen(false);
                                setSelectedVision(null);
                            }}
                            onCancel={() => {
                                setEditOpen(false);
                                setSelectedVision(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

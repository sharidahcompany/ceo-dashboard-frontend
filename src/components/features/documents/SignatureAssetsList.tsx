"use client";

import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Stamp } from "lucide-react";

import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    deleteSignatureAssets,
    getSignatureAssets,
    SignatureAssetResource,
} from "@/actions/workspace/signature-assets.actions";

function AssetCard({ asset }: { asset: SignatureAssetResource }) {
    const t = useTranslations();

    return (
        <div className="flex h-full flex-col gap-2 rounded-xl border bg-card p-3">
            <div className="flex h-24 items-center justify-center rounded-md border bg-white">
                {asset.image_data_uri ? (
                    <Image
                        src={asset.image_data_uri}
                        alt={asset.name}
                        width={140}
                        height={80}
                        className="max-h-20 object-contain"
                        unoptimized
                    />
                ) : (
                    <span className="text-xs text-muted-foreground">{asset.name}</span>
                )}
            </div>
            <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">{asset.name}</span>
                <Badge variant="outline">{t(`enums.documentAnchorType.${asset.type.value}`)}</Badge>
            </div>
            {asset.is_company && (
                <Badge variant="secondary" className="w-fit text-[10px]">
                    {t("attributes.company")}
                </Badge>
            )}
        </div>
    );
}

export default function SignatureAssetsList() {
    const t = useTranslations();

    const handleDelete = async (ids: string[]) => {
        const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
        return deleteSignatureAssets(numericIds);
    };

    return (
        <Card>
            <CardContent>
                <DataGrid<SignatureAssetResource, any>
                    title={t("routes.signature_assets")}
                    description={t("messages.documents.signature_assets_description")}
                    fetchAction={getSignatureAssets}
                    deleteAction={handleDelete}
                    viewMode="grid"
                    renderCard={(asset) => <AssetCard asset={asset} />}
                    idKey="id"
                    createTitle={t("messages.documents.create_new_asset")}
                    createIcon={Stamp}
                    editable={false}
                    deletable
                />
            </CardContent>
        </Card>
    );
}

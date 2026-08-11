"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
    getSignatureAssets,
    SignatureAssetResource,
} from "@/actions/workspace/signature-assets.actions";

export interface SignatureAssetPickerProps {
    /** Restricts the grid to one kind — a stamp anchor never offers signatures. */
    type: "signature" | "stamp";
    selectedId: number | null;
    onSelect: (asset: SignatureAssetResource) => void;
}

/**
 * Saved personal signatures plus (for stamps) the shared company stamp.
 */
export default function SignatureAssetPicker({
    type,
    selectedId,
    onSelect,
}: SignatureAssetPickerProps) {
    const t = useTranslations();
    const [loading, setLoading] = useState(true);
    const [assets, setAssets] = useState<SignatureAssetResource[]>([]);

    useEffect(() => {
        const load = async () => {
            const res = await getSignatureAssets(`filter[type]=${type}&per_page=50`);
            if (res.success) setAssets(res.data.data);
            setLoading(false);
        };
        load();
    }, [type]);

    if (loading) {
        return (
            <div className="flex justify-center py-6">
                <Spinner />
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                {t("messages.documents.no_saved_assets")}
            </p>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {assets.map((asset) => (
                <button
                    key={asset.id}
                    type="button"
                    onClick={() => onSelect(asset)}
                    className={cn(
                        "flex h-24 flex-col items-center justify-center gap-1 rounded-md border bg-white p-2",
                        selectedId === asset.id ? "border-primary ring-1 ring-primary" : "border-input",
                    )}
                >
                    {asset.image_data_uri ? (
                        <Image
                            src={asset.image_data_uri}
                            alt={asset.name}
                            width={90}
                            height={50}
                            className="max-h-12 object-contain"
                            unoptimized
                        />
                    ) : (
                        <span className="text-xs text-muted-foreground">{asset.name}</span>
                    )}
                    {asset.is_company && (
                        <Badge variant="secondary" className="text-[10px]">
                            {t("attributes.company")}
                        </Badge>
                    )}
                </button>
            ))}
        </div>
    );
}

import React from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface FileUploadProps<TFieldValues extends FieldValues> {
    name: FieldPath<TFieldValues>;
    control: Control<TFieldValues>;
    initialUrl?: string | null;
    accept?: string;
    label?: string;
    className?: string;
}

export function FileUpload<TFieldValues extends FieldValues>({
    name,
    control,
    initialUrl = null,
    accept = "image/*",
    className = "",
}: FileUploadProps<TFieldValues>) {
    const t = useTranslations();
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialUrl || null);

    React.useEffect(() => {
        return () => {
            if (previewUrl && previewUrl !== initialUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl, initialUrl]);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value }, fieldState: { error } }) => {
                const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        onChange(file);
                        if (previewUrl && previewUrl !== initialUrl && previewUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(previewUrl);
                        }
                        setPreviewUrl(URL.createObjectURL(file));
                    }
                };

                const handleRemoveImage = (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(null);

                    const fileInput = document.getElementById(`file-upload-${name}`) as HTMLInputElement;
                    if (fileInput) {
                        fileInput.value = '';
                    }

                    if (previewUrl && previewUrl !== initialUrl && previewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(previewUrl);
                    }
                    setPreviewUrl(null);
                };

                return (
                    <div className={`w-full ${className}`}>
                        <div className="relative w-full">
                            <label htmlFor={`file-upload-${name}`} className="cursor-pointer block">
                                <div className="p-3 border border-dashed rounded-lg w-full h-32 cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden">
                                    {previewUrl ? (
                                        <Image
                                            src={previewUrl}
                                            alt="Preview"
                                            fill
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            className="object-contain p-2"
                                        />
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                                            <Upload className="h-6 w-6 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">{t("buttons.upload_file")}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t("messages.file_upload.drag_file")}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </label>

                            {previewUrl && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 end-2 z-20 h-7 w-7 bg-background/80 hover:bg-background border rounded-full shadow-sm"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <input
                            id={`file-upload-${name}`}
                            type="file"
                            className="hidden"
                            accept={accept}
                            onChange={handleFileChange}
                        />
                    </div>
                );
            }}
        />
    );
}
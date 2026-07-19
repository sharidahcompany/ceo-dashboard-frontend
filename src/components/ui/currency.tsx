import React from "react";
import {
  Controller,
  Control,
  FieldErrors,
  FieldValues,
  Path,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Currency {
  code: string;
  label: string;
  symbol: string;
}

interface CurrencyFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  currencies?: Currency[];
}

export const CurrencyField = <TFieldValues extends FieldValues>({
  control,
  name,
  errors,
  currencies,
}: CurrencyFieldProps<TFieldValues>) => {
  const t = useTranslations();
  const error = errors[name];

  return (
    <Field className="w-full">
      <FieldLabel>{t("attributes.currency")}</FieldLabel>

      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const selectedCurrency = currencies?.find(
            (c) => c.code === field.value,
          );

          return (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("attributes.currency")}>
                  {selectedCurrency ? (
                    <div className="flex items-center gap-1.5">
                      <span>{selectedCurrency.label}</span>
                      <span className="text-muted-foreground">
                        ({selectedCurrency.symbol})
                      </span>
                    </div>
                  ) : null}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {currencies?.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-1.5">
                      <span>{currency.label}</span>
                      <span className="opacity-70">({currency.symbol})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }}
      />

      {error && <FieldError>{error.message as string}</FieldError>}
    </Field>
  );
};

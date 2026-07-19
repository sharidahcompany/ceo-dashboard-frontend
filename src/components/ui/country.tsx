import React from "react";
import {
  Controller,
  Control,
  FieldErrors,
  FieldValues,
  Path,
} from "react-hook-form";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Country {
  iso3: string;
  label: string;
  flag: string;
}

interface CountryFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  countries?: Country[];
}

export const CountryField = <TFieldValues extends FieldValues>({
  control,
  name,
  errors,
  countries,
}: CountryFieldProps<TFieldValues>) => {
  const t = useTranslations();
  const error = errors[name];

  return (
    <Field className="w-full">
      <FieldLabel>{t("attributes.country")}</FieldLabel>

      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const selectedCountry = countries?.find(
            (c) => c.iso3 === field.value,
          );

          return (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("attributes.country")}>
                  {selectedCountry ? (
                    <div className="flex items-center gap-2">
                      <Image
                        src={selectedCountry?.flag}
                        alt="flag"
                        width={20}
                        height={10}
                        className="w-6 h-auto"
                      />
                      <span>{selectedCountry.label}</span>
                    </div>
                  ) : null}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {countries?.map((country) => (
                  <SelectItem key={country.iso3} value={country.iso3}>
                    <div className="flex items-center gap-2">
                      {country.flag && (
                        <Image
                          src={country?.flag}
                          alt="flag"
                          width={20}
                          height={10}
                          className="w-6 h-auto"
                        />
                      )}{" "}
                      <span>{country.label}</span>
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

"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Pencil, Save, X, Camera, Building2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { CountryField } from "@/components/ui/country";
import { CurrencyField } from "@/components/ui/currency";
import { useIsOwnerOrSuperAdmin } from "@/providers/AbilityProvider";

import {
  getCurrentOrganization,
  getCurrentSubscription,
  updateOrganization,
  OrganizationResource,
  SubscriptionResource,
} from "@/actions/workspace/organization.actions";
import {
  getCountries,
  getCurrencies,
  CountryOption,
  CurrencyOption,
} from "@/actions/common/common.actions";

const organizationSchema = z.object({
  name_ar: z.string().min(1, { message: "validation.required" }),
  name_en: z.string().min(1, { message: "validation.required" }),
  commercial_number: z.string().optional(),
  tax_number: z.string().optional(),
  building_number: z.string().optional(),
  street: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  is_vat_registered: z.boolean(),
});

type OrganizationValues = z.infer<typeof organizationSchema>;

function organizationDisplayName(org: OrganizationResource | null): string {
  if (!org) return "";
  if (org.name_localized) return org.name_localized;
  if (typeof org.name === "string") return org.name;
  return org.name?.ar || org.name?.en || "";
}

export default function OrganizationForm() {
  const t = useTranslations();
  const canEditOrganization = useIsOwnerOrSuperAdmin();

  const [organization, setOrganization] = useState<OrganizationResource | null>(
    null,
  );
  const [subscription, setSubscription] = useState<SubscriptionResource | null>(
    null,
  );
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name_ar: "",
      name_en: "",
      commercial_number: "",
      tax_number: "",
      building_number: "",
      street: "",
      district: "",
      city: "",
      postal_code: "",
      country: "",
      currency: "",
      is_vat_registered: false,
    },
  });

  const resetFromOrganization = (org: OrganizationResource) => {
    const name =
      typeof org.name === "object" && org.name ? org.name : { ar: "", en: "" };
    reset({
      name_ar: name.ar || (typeof org.name === "string" ? org.name : ""),
      name_en: name.en || "",
      commercial_number: org.commercial_number || "",
      tax_number: org.tax_number || "",
      building_number: org.building_number || "",
      street: org.street || "",
      district: org.district || "",
      city: org.city || "",
      postal_code: org.postal_code || "",
      country: org.country || "",
      currency: org.currency || "",
      is_vat_registered: org.is_vat_registered || false,
    });
  };

  useEffect(() => {
    const load = async () => {
      const [orgRes, subRes, countriesRes, currenciesRes] = await Promise.all([
        getCurrentOrganization(),
        getCurrentSubscription(),
        getCountries(),
        getCurrencies(),
      ]);

      if (orgRes.success && orgRes.data) {
        setOrganization(orgRes.data);
        resetFromOrganization(orgRes.data);
      } else if (!orgRes.success) {
        toast.error(orgRes.error);
      }

      if (subRes.success && subRes.data) {
        setSubscription(subRes.data);
      }

      if (countriesRes.success) setCountries(countriesRes.data);
      if (currenciesRes.success) setCurrencies(currenciesRes.data);

      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const cancelEditing = () => {
    if (organization) resetFromOrganization(organization);
    setLogoFile(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    setIsEditing(false);
  };

  const onSubmit = (values: OrganizationValues) => {
    if (!organization) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name[ar]", values.name_ar);
      formData.append("name[en]", values.name_en);
      formData.append("commercial_number", values.commercial_number || "");
      formData.append("tax_number", values.tax_number || "");
      formData.append("building_number", values.building_number || "");
      formData.append("street", values.street || "");
      formData.append("district", values.district || "");
      formData.append("city", values.city || "");
      formData.append("postal_code", values.postal_code || "");
      formData.append("country", values.country || "");
      formData.append("currency", values.currency || "");
      formData.append(
        "is_vat_registered",
        values.is_vat_registered ? "1" : "0",
      );
      if (logoFile) formData.append("logo", logoFile);

      const res = await updateOrganization(formData);
      if (res.success && res.data) {
        toast.success(res.message || t("organization.updated"));
        setOrganization(res.data);
        resetFromOrganization(res.data);
        setLogoFile(null);
        if (logoPreview) URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
        setIsEditing(false);
      } else if (!res.success) {
        toast.error(res.error);
      }
    });
  };

  const statusVariant = (status?: string) => {
    switch (status) {
      case "active":
        return "default" as const;
      case "trialing":
        return "secondary" as const;
      default:
        return "destructive" as const;
    }
  };

  return (
    <div className="space-y-6 w-full">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="w-full">
          <CardHeader className="border-b">
            <CardTitle>{t("organization.title")}</CardTitle>
            <CardDescription>{t("organization.description")}</CardDescription>
            {!loading && organization && !isEditing && canEditOrganization && (
              <CardAction>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="size-4" />
                  {t("buttons.edit")}
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : !organization ? (
              <p className="text-sm text-muted-foreground">
                {t("errors.something_went_wrong")}
              </p>
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-fit">
                  <Avatar className="h-20 w-20">
                    {(logoPreview || organization.logo_url) && (
                      <AvatarImage
                        src={logoPreview || organization.logo_url || ""}
                        alt={organizationDisplayName(organization)}
                      />
                    )}
                    <AvatarFallback className="bg-muted">
                      <Building2 className="size-8 text-muted-foreground" />
                    </AvatarFallback>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="absolute inset-e-0 bottom-0 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm ring-2 ring-background hover:bg-accent cursor-pointer"
                      >
                        <Camera className="size-3" />
                      </button>
                    )}
                  </Avatar>

                  {isEditing && (
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
                  <Field>
                    <FieldLabel>{t("attributes.name_ar")}</FieldLabel>
                    <FieldContent>
                      <Controller
                        name="name_ar"
                        control={control}
                        render={({ field }) => (
                          <Input
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            readOnly={!isEditing}
                            disabled={!isEditing}
                          />
                        )}
                      />
                      {isEditing && errors.name_ar && (
                        <FieldError>{t(errors.name_ar.message!)}</FieldError>
                      )}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>{t("attributes.name_en")}</FieldLabel>
                    <FieldContent>
                      <Controller
                        name="name_en"
                        control={control}
                        render={({ field }) => (
                          <Input
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            readOnly={!isEditing}
                            disabled={!isEditing}
                          />
                        )}
                      />
                      {isEditing && errors.name_en && (
                        <FieldError>{t(errors.name_en.message!)}</FieldError>
                      )}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>{t("attributes.commercial_number")}</FieldLabel>
                    <FieldContent>
                      <Controller
                        name="commercial_number"
                        control={control}
                        render={({ field }) => (
                          <Input
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            readOnly={!isEditing}
                            disabled={!isEditing}
                          />
                        )}
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>{t("attributes.tax_number")}</FieldLabel>
                    <FieldContent>
                      <Controller
                        name="tax_number"
                        control={control}
                        render={({ field }) => (
                          <Input
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            readOnly={!isEditing}
                            disabled={!isEditing}
                          />
                        )}
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>{t("organization.building_number")}</FieldLabel>
                    <FieldContent>
                      <Controller
                        name="building_number"
                        control={control}
                        render={({ field }) => (
                          <Input
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            readOnly={!isEditing}
                            disabled={!isEditing}
                          />
                        )}
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>{t("organization.street")}</FieldLabel>
                    <FieldContent>
                      <Controller
                        name="street"
                        control={control}
                        render={({ field }) => (
                          <Input
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            readOnly={!isEditing}
                            disabled={!isEditing}
                          />
                        )}
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>{t("organization.district")}</FieldLabel>
                    <FieldContent>
                      <Controller
                        name="district"
                        control={control}
                        render={({ field }) => (
                          <Input
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            readOnly={!isEditing}
                            disabled={!isEditing}
                          />
                        )}
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>{t("organization.city")}</FieldLabel>
                    <FieldContent>
                      <Controller
                        name="city"
                        control={control}
                        render={({ field }) => (
                          <Input
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            readOnly={!isEditing}
                            disabled={!isEditing}
                          />
                        )}
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>{t("organization.postal_code")}</FieldLabel>
                    <FieldContent>
                      <Controller
                        name="postal_code"
                        control={control}
                        render={({ field }) => (
                          <Input
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            readOnly={!isEditing}
                            disabled={!isEditing}
                          />
                        )}
                      />
                    </FieldContent>
                  </Field>

                  {isEditing ? (
                    <CountryField
                      control={control}
                      name="country"
                      errors={errors}
                      countries={countries}
                    />
                  ) : (
                    <Field>
                      <FieldLabel>{t("attributes.country")}</FieldLabel>
                      <FieldContent>
                        <Input
                          value={
                            countries.find(
                              (c) => c.iso3 === organization.country,
                            )?.label ||
                            organization.country ||
                            ""
                          }
                          readOnly
                          disabled
                        />
                      </FieldContent>
                    </Field>
                  )}

                  {isEditing ? (
                    <CurrencyField
                      control={control}
                      name="currency"
                      errors={errors}
                      currencies={currencies}
                    />
                  ) : (
                    <Field>
                      <FieldLabel>{t("attributes.currency")}</FieldLabel>
                      <FieldContent>
                        <Input
                          value={
                            currencies.find(
                              (c) => c.code === organization.currency,
                            )?.label ||
                            organization.currency ||
                            ""
                          }
                          readOnly
                          disabled
                        />
                      </FieldContent>
                    </Field>
                  )}

                  <Field>
                    <Controller
                      name="is_vat_registered"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isEditing}
                          />
                          <FieldLabel className="cursor-pointer">
                            {t("attributes.is_vat_registered")}
                          </FieldLabel>
                        </div>
                      )}
                    />
                  </Field>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className="gap-2"
              onClick={cancelEditing}
            >
              <X className="size-4" />
              {t("buttons.cancel")}
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {t("buttons.save")}
            </Button>
          </div>
        )}
      </form>

      <Card className="w-full">
        <CardHeader className="border-b">
          <CardTitle>{t("organization.current_plan_title")}</CardTitle>
          <CardDescription>
            {t("organization.current_plan_description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[100px]">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : subscription?.plan ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field>
                <FieldLabel>{t("plans.fields.name")}</FieldLabel>
                <FieldContent className="flex items-center gap-2">
                  <span>{subscription.plan.name}</span>
                  {subscription.plan.is_free && (
                    <Badge variant="secondary">{t("plans.free_badge")}</Badge>
                  )}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{t("organization.status")}</FieldLabel>
                <FieldContent>
                  <Badge variant={statusVariant(subscription.status)}>
                    {t(
                      `organization.subscription_status.${subscription.status}`,
                      {
                        defaultValue: subscription.status,
                      },
                    )}
                  </Badge>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{t("plans.fields.price")}</FieldLabel>
                <FieldContent>
                  {subscription.plan.is_free
                    ? t("plans.free_badge")
                    : `${subscription.plan.price} ${subscription.plan.currency}`}
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>{t("plans.fields.billing_interval")}</FieldLabel>
                <FieldContent>
                  {t(`plans.interval.${subscription.plan.billing_interval}`)}
                </FieldContent>
              </Field>

              {subscription.current_period_end && (
                <Field>
                  <FieldLabel>{t("organization.renews_at")}</FieldLabel>
                  <FieldContent>{subscription.current_period_end}</FieldContent>
                </Field>
              )}

              {subscription.trial_ends_at && (
                <Field>
                  <FieldLabel>{t("organization.trial_ends_at")}</FieldLabel>
                  <FieldContent>{subscription.trial_ends_at}</FieldContent>
                </Field>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("organization.no_subscription")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, KeyRound, Pencil, Save, X, Camera } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldContent,
  FieldError,
  FieldSet,
} from "@/components/ui/field";
import { useAppStore } from "@/providers/StoreProvider";

import {
  getAuthenticatedUser,
  updateProfile,
  changePassword,
  UserResource,
} from "@/actions/workspace/user.actions";

const profileSchema = z.object({
  first_name: z.string().min(1, { message: "validation.required" }),
  last_name: z.string().min(1, { message: "validation.required" }),
  email: z
    .string()
    .min(1, { message: "validation.required" })
    .email({ message: "validation.email" }),
  phone: z.string().optional(),
  username: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, { message: "validation.required" }),
    password: z.string().min(8, { message: "validation.required" }),
    password_confirmation: z
      .string()
      .min(1, { message: "validation.required" }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "validation.required",
    path: ["password_confirmation"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function ProfileForm() {
  const t = useTranslations();
  const setUserStore = useAppStore((state) => state.setUser);

  const [user, setUser] = useState<UserResource | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isProfilePending, startProfileTransition] = useTransition();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      const res = await getAuthenticatedUser();
      if (res.success) {
        setUser(res.data);
        resetProfile({
          first_name: res.data.first_name || "",
          last_name: res.data.last_name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          username: res.data.username || "",
        });
      } else {
        toast.error(res.error);
      }
      setLoadingUser(false);
    };
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      username: "",
    },
  });

  const onSubmitProfile = (values: ProfileValues) => {
    if (!user) return;
    startProfileTransition(async () => {
      const formData = new FormData();
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("email", values.email);
      formData.append("phone", values.phone || "");
      if (values.username) formData.append("username", values.username);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await updateProfile(user.id, formData);
      if (res.success) {
        toast.success(res.message || t("success"));
        const mergedUser = { ...user, ...res.data };
        setUser(mergedUser);
        setUserStore(mergedUser);
        setAvatarFile(null);
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
        setIsEditing(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  const cancelEditing = () => {
    if (user) {
      resetProfile({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        username: user.username || "",
      });
    }
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setIsEditing(false);
  };

  const {
    control: passwordControl,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  const onSubmit = (values: ChangePasswordValues) => {
    startTransition(async () => {
      const res = await changePassword(values);
      if (res.success) {
        toast.success(
          res.message ||
            t("profile.password_updated") ||
            "Password updated successfully.",
        );
        reset();
      } else {
        toast.error(res.error);
      }
    });
  };

  const userFallback = user?.first_name
    ? user.first_name.slice(0, 1).toUpperCase() +
      (user.last_name?.slice(0, 1).toUpperCase() || "")
    : "US";

  return (
    <div className="space-y-6 w-full">
      <form onSubmit={handleProfileSubmit(onSubmitProfile)}>
        <Card className="w-full">
          <CardHeader className="border-b">
            <CardTitle>{t("profile.title") || "Profile"}</CardTitle>
            <CardDescription>
              {t("profile.description") || "View your account information."}
            </CardDescription>
            {!loadingUser && !isEditing && (
              <CardAction>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="size-4" />
                  {t("buttons.edit") || "Edit"}
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {loadingUser ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-fit">
                  <Avatar className="h-20 w-20">
                    {(avatarPreview || user?.avatar) && (
                      <AvatarImage
                        src={avatarPreview || user?.avatar || ""}
                        alt={user?.first_name || "User Avatar"}
                      />
                    )}
                    <AvatarFallback className="bg-muted text-lg">
                      {userFallback}
                    </AvatarFallback>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute inset-e-0 bottom-0 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm ring-2 ring-background hover:bg-accent cursor-pointer"
                      >
                        <Camera className="size-3" />
                      </button>
                    )}
                  </Avatar>

                  {isEditing && (
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
                  <Field>
                    <FieldLabel>
                      {t("attributes.first_name") || "First Name"}
                    </FieldLabel>
                    <FieldContent>
                      <Controller
                        name="first_name"
                        control={profileControl}
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
                      {isEditing && profileErrors.first_name && (
                        <FieldError>
                          {t(profileErrors.first_name.message!)}
                        </FieldError>
                      )}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t("attributes.last_name") || "Last Name"}
                    </FieldLabel>
                    <FieldContent>
                      <Controller
                        name="last_name"
                        control={profileControl}
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
                      {isEditing && profileErrors.last_name && (
                        <FieldError>
                          {t(profileErrors.last_name.message!)}
                        </FieldError>
                      )}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>{t("attributes.email") || "Email"}</FieldLabel>
                    <FieldContent>
                      <Controller
                        name="email"
                        control={profileControl}
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
                      {isEditing && profileErrors.email && (
                        <FieldError>
                          {t(profileErrors.email.message!)}
                        </FieldError>
                      )}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {t("attributes.phone") || "Phone Number"}
                    </FieldLabel>
                    <FieldContent>
                      <Controller
                        name="phone"
                        control={profileControl}
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
                    <FieldLabel>
                      {t("attributes.username") || "Username"}
                    </FieldLabel>
                    <FieldContent>
                      <Controller
                        name="username"
                        control={profileControl}
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
                      {isEditing && profileErrors.username && (
                        <FieldError>
                          {t(profileErrors.username.message!)}
                        </FieldError>
                      )}
                    </FieldContent>
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
              disabled={isProfilePending}
              className="gap-2"
              onClick={cancelEditing}
            >
              <X className="size-4" />
              {t("buttons.cancel")}
            </Button>
            <Button type="submit" disabled={isProfilePending} className="gap-2">
              {isProfilePending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {t("buttons.save")}
            </Button>
          </div>
        )}
      </form>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="w-full">
          <CardHeader className="border-b">
            <CardTitle>
              {t("profile.change_password_title") || "Change Password"}
            </CardTitle>
            <CardDescription>
              {t("profile.change_password_description") ||
                "Update your account password."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <FieldSet>
              <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                <Field>
                  <FieldLabel>
                    {t("attributes.current_password") || "Current Password"}
                  </FieldLabel>
                  <FieldContent>
                    <Controller
                      name="current_password"
                      control={passwordControl}
                      render={({ field }) => (
                        <Input
                          type="password"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          ref={field.ref}
                        />
                      )}
                    />
                    {errors.current_password && (
                      <FieldError>
                        {t(errors.current_password.message!)}
                      </FieldError>
                    )}
                  </FieldContent>
                </Field>

                <div className="hidden md:block" />

                <Field>
                  <FieldLabel>
                    {t("attributes.password") || "Password"}
                  </FieldLabel>
                  <FieldContent>
                    <Controller
                      name="password"
                      control={passwordControl}
                      render={({ field }) => (
                        <Input
                          type="password"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          ref={field.ref}
                        />
                      )}
                    />
                    {errors.password && (
                      <FieldError>{t(errors.password.message!)}</FieldError>
                    )}
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>
                    {t("attributes.password_confirmation") ||
                      "Confirm Password"}
                  </FieldLabel>
                  <FieldContent>
                    <Controller
                      name="password_confirmation"
                      control={passwordControl}
                      render={({ field }) => (
                        <Input
                          type="password"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          ref={field.ref}
                        />
                      )}
                    />
                    {errors.password_confirmation && (
                      <FieldError>
                        {t(errors.password_confirmation.message!)}
                      </FieldError>
                    )}
                  </FieldContent>
                </Field>
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            {t("buttons.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldContent,
  FieldError,
  FieldSet,
} from "@/components/ui/field";
import { Loader2, User, UserPlus } from "lucide-react";
import {
  getEmployees,
  inviteUser,
  InviteUserData,
  UserResource,
} from "@/actions/workspace/user.actions";

export default function EmployeesPage() {
  const t = useTranslations();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [gridKey, setGridKey] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteUserData>({
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      phone: "",
    },
  });

  const onInvite = (values: InviteUserData) => {
    startTransition(async () => {
      const res = await inviteUser(values);
      if (res.success) {
        toast.success(res.message || t("success"));
        setIsInviteOpen(false);
        reset();
        setGridKey((k) => k + 1);
      } else {
        toast.error(res.error);
      }
    });
  };

  const columns = useMemo<ColumnDef<UserResource>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: t("attributes.name") || "Name",
        cell: ({ row }) => {
          const u = row.original;
          const fullName =
            u.full_name ||
            `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
            "-";
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {u.avatar && <AvatarImage src={u.avatar} alt={fullName} />}
                <AvatarFallback className="bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{fullName}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: t("attributes.email"),
        cell: ({ row }) => row.original.email || "-",
      },
      {
        accessorKey: "phone",
        header: t("attributes.phone"),
        cell: ({ row }) => row.original.phone || "-",
      },
    ],
    [t],
  );

  return (
    <Card>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2">
                  <UserPlus className="size-4" />
                  {t("messages.hr.invite_employee")}
                </Button>
              }
            />
            <DialogContent>
              <form onSubmit={handleSubmit(onInvite)}>
                <DialogHeader>
                  <DialogTitle>{t("messages.hr.invite_employee")}</DialogTitle>
                  <DialogDescription>
                    {t("messages.hr.invite_employee_description")}
                  </DialogDescription>
                </DialogHeader>
                <FieldSet className="py-4">
                  <FieldGroup className="md:grid md:grid-cols-2 md:gap-4">
                    <Field>
                      <FieldLabel>{t("attributes.first_name")}</FieldLabel>
                      <FieldContent>
                        <Input
                          {...register("first_name", {
                            required: "validation.required",
                          })}
                        />
                        {errors.first_name && (
                          <FieldError>
                            {t(errors.first_name.message!)}
                          </FieldError>
                        )}
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel>{t("attributes.last_name")}</FieldLabel>
                      <FieldContent>
                        <Input
                          {...register("last_name", {
                            required: "validation.required",
                          })}
                        />
                        {errors.last_name && (
                          <FieldError>
                            {t(errors.last_name.message!)}
                          </FieldError>
                        )}
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel>{t("attributes.username")}</FieldLabel>
                      <FieldContent>
                        <Input
                          {...register("username", {
                            required: "validation.required",
                          })}
                        />
                        {errors.username && (
                          <FieldError>{t(errors.username.message!)}</FieldError>
                        )}
                      </FieldContent>
                    </Field>
                    <Field>
                      <FieldLabel>{t("attributes.phone")}</FieldLabel>
                      <FieldContent>
                        <Input
                          {...register("phone", {
                            required: "validation.required",
                          })}
                        />
                        {errors.phone && (
                          <FieldError>{t(errors.phone.message!)}</FieldError>
                        )}
                      </FieldContent>
                    </Field>
                    <Field className="md:col-span-2">
                      <FieldLabel>{t("attributes.email")}</FieldLabel>
                      <FieldContent>
                        <Input
                          type="email"
                          {...register("email", {
                            required: "validation.required",
                          })}
                        />
                        {errors.email && (
                          <FieldError>{t(errors.email.message!)}</FieldError>
                        )}
                      </FieldContent>
                    </Field>
                  </FieldGroup>
                </FieldSet>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteOpen(false)}
                    disabled={isPending}
                  >
                    {t("buttons.cancel")}
                  </Button>
                  <Button type="submit" disabled={isPending} className="gap-2">
                    {isPending && <Loader2 className="size-4 animate-spin" />}
                    {t("buttons.save")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataGrid<UserResource, any>
          key={gridKey}
          title={t("routes.employees")}
          fetchAction={getEmployees}
          columns={columns}
          idKey="id"
          editable={true}
          deletable={false}
        />
      </CardContent>
    </Card>
  );
}

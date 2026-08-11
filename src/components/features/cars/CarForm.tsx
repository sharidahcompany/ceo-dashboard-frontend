"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, NumericInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, X, Save } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  getCar,
  createCar,
  updateCar,
  assignCar,
  returnCar,
  CarData,
  CarResource,
  CarAssignmentResource,
} from "@/actions/workspace/cars.actions";
import { SelectUser } from "@/components/ui/select-user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldContent,
  FieldError,
  FieldSet,
} from "@/components/ui/field";
import { useAppStore } from "@/providers/StoreProvider";
import { CarJourneyMapLoader } from "@/components/features/cars/CarJourneyMapLoader";
import { useCarLocationTracking } from "@/hooks/use-car-location-tracking";

interface CarFormValues {
  model: string;
  year: string;
  status: string;
  has_gps: boolean;
  traccar_device_id: string;
}

interface AssignFormValues {
  user_id: string;
  notes: string;
}

export default function CarForm() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const carId =
    (params?.id as string) || (searchParams?.get("id") as string) || undefined;

  const [isPending, startTransition] = useTransition();
  const [isAssignPending, startAssignTransition] = useTransition();
  const [loadingData, setLoadingData] = useState(!!carId);
  const [car, setCar] = useState<CarResource | null>(null);
  const [assignments, setAssignments] = useState<CarAssignmentResource[]>([]);

  const statusOptions = [
    { value: "active", label: t("attributes.active") || "Active" },
    { value: "maintenance", label: t("attributes.maintenance") || "In Maintenance" },
  ];

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<CarFormValues>({
    defaultValues: {
      model: "",
      year: "",
      status: "active",
      has_gps: false,
      traccar_device_id: "",
    },
  });

  const {
    control: assignControl,
    handleSubmit: handleAssignSubmit,
    reset: resetAssignForm,
    formState: { errors: assignErrors },
  } = useForm<AssignFormValues>({
    defaultValues: { user_id: "", notes: "" },
  });

  const loadCar = async () => {
    if (!carId) return;
    const res = await getCar(carId);
    if (res.success) {
      const data = res.data;
      setCar(data);
      setValue("model", data.model || "");
      setValue("year", String(data.year || ""));
      setValue("status", data.status?.value || "active");
      setValue("has_gps", !!data.has_gps);
      setValue("traccar_device_id", data.traccar_device_id || "");
      setAssignments(data.assignments ?? []);
    } else {
      toast.error(res.error);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    loadCar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  const hasGps = watch("has_gps");

  const currentUserId = useAppStore((state) => state.user?.id);
  const isCurrentDriver =
    !!currentUserId && car?.current_assignment?.user_id === currentUserId;
  const isTracking = !!carId && !!car?.has_gps && isCurrentDriver;

  const { lastPoint, error: trackingError } = useCarLocationTracking(
    carId,
    isTracking,
  );

  useEffect(() => {
    if (trackingError) toast.error(trackingError);
  }, [trackingError]);

  const onSubmit = (values: CarFormValues) => {
    startTransition(async () => {
      const payload: CarData = {
        model: values.model,
        year: Number(values.year),
        status: values.status,
        has_gps: values.has_gps,
        traccar_device_id: values.has_gps
          ? values.traccar_device_id || null
          : null,
      };

      const res = carId ? await updateCar(carId, payload) : await createCar(payload);

      if (res.success) {
        toast.success(res.message || t("success"));
        if (!carId) {
          router.push("/cars");
        } else {
          setCar(res.data);
        }
      } else {
        toast.error(res.error);
      }
    });
  };

  const onAssign = (values: AssignFormValues) => {
    if (!carId) return;
    startAssignTransition(async () => {
      const res = await assignCar(carId, {
        user_id: values.user_id,
        notes: values.notes || null,
      });
      if (res.success) {
        toast.success(res.message || t("success"));
        resetAssignForm();
        loadCar();
      } else {
        toast.error(res.error);
      }
    });
  };

  const onReturn = () => {
    if (!carId || !car?.current_assignment) return;
    startAssignTransition(async () => {
      const res = await returnCar(carId, car.current_assignment!.id);
      if (res.success) {
        toast.success(res.message || t("success"));
        loadCar();
      } else {
        toast.error(res.error);
      }
    });
  };

  const formatDateTime = (dt?: string | null) =>
    dt ? String(dt).substring(0, 16).replace("T", " ") : "-";

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="w-full">
          <CardHeader className="border-b">
            <CardTitle>
              {carId
                ? t("routes.edit_car") || "Edit Car"
                : t("routes.create_car") || "Add Car"}
            </CardTitle>
            <CardDescription>
              {t("messages.cars.car_description") ||
                "Fill in the car details below"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <FieldSet>
              <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                <Field>
                  <FieldLabel>{t("attributes.model") || "Model"}</FieldLabel>
                  <FieldContent>
                    <Input
                      {...register("model", { required: "validation.required" })}
                      placeholder={t("attributes.model") || "e.g. Toyota Camry"}
                    />
                    {errors.model && (
                      <FieldError>{t(errors.model.message!)}</FieldError>
                    )}
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>{t("attributes.year") || "Year"}</FieldLabel>
                  <FieldContent>
                    <NumericInput
                      {...register("year", { required: "validation.required" })}
                      placeholder="2024"
                    />
                    {errors.year && (
                      <FieldError>{t(errors.year.message!)}</FieldError>
                    )}
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>{t("attributes.status") || "Status"}</FieldLabel>
                  <FieldContent>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => {
                        const selectedLabel = statusOptions.find(
                          (opt) => opt.value === field.value,
                        )?.label;
                        return (
                          <Select
                            value={field.value}
                            onValueChange={(v) => v && field.onChange(v)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue>{selectedLabel}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      }}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>{t("attributes.has_gps") || "Has GPS"}</FieldLabel>
                  <FieldContent>
                    <Controller
                      name="has_gps"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center gap-2 py-2">
                          <Checkbox
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span className="text-sm text-muted-foreground">
                            {t("messages.cars.has_gps_hint") ||
                              "This car reports its live location"}
                          </span>
                        </div>
                      )}
                    />
                  </FieldContent>
                </Field>

                {hasGps && (
                  <Field className="md:col-span-2">
                    <FieldLabel>
                      {t("attributes.traccar_device_id") ||
                        "Traccar Device ID"}
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        {...register("traccar_device_id")}
                        placeholder={
                          t("attributes.traccar_device_id_placeholder") ||
                          "e.g. IMEI or Traccar unique ID"
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("messages.cars.traccar_device_id_hint") ||
                          "Links this car to a device in Traccar so live GPS updates are received via webhook"}
                      </p>
                    </FieldContent>
                  </Field>
                )}
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/cars">
            <Button type="button" variant="outline" disabled={isPending} className="gap-2">
              <X className="size-4" />
              {t("buttons.cancel")}
            </Button>
          </Link>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {t("buttons.save")}
          </Button>
        </div>
      </form>

      {carId && (
        <Card className="w-full">
          <CardHeader className="border-b">
            <CardTitle>
              {t("attributes.current_assignment") || "Current Assignment"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {car?.current_assignment ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">
                      {`${car.current_assignment.user?.first_name || ""} ${car.current_assignment.user?.last_name || ""}`.trim() ||
                        car.current_assignment.user?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("attributes.taken_at") || "Taken at"}:{" "}
                      {formatDateTime(car.current_assignment.taken_at)}
                    </p>
                  </div>
                  <Badge variant="default">
                    {t("attributes.checked_out") || "Checked out"}
                  </Badge>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isAssignPending}
                    onClick={onReturn}
                    className="gap-2"
                  >
                    {isAssignPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    {t("buttons.return_car") || "Mark Returned"}
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleAssignSubmit(onAssign)}
                className="flex flex-col gap-4"
              >
                <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                  <Field>
                    <FieldLabel>
                      {t("attributes.assign_to") || "Assign To"}
                    </FieldLabel>
                    <FieldContent>
                      <SelectUser
                        control={assignControl}
                        name="user_id"
                        isTenantOnly
                      />
                      {assignErrors.user_id && (
                        <FieldError>
                          {t(assignErrors.user_id.message!)}
                        </FieldError>
                      )}
                    </FieldContent>
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel>{t("attributes.notes") || "Notes"}</FieldLabel>
                    <FieldContent>
                      <Controller
                        name="notes"
                        control={assignControl}
                        render={({ field }) => (
                          <Textarea
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            rows={2}
                          />
                        )}
                      />
                    </FieldContent>
                  </Field>
                </FieldGroup>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isAssignPending} className="gap-2">
                    {isAssignPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    {t("buttons.assign_car") || "Check Out"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {carId && assignments.length > 0 && (
        <Card className="w-full">
          <CardHeader className="border-b">
            <CardTitle>
              {t("attributes.assignment_history") || "Assignment History"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("attributes.employee") || "Employee"}</TableHead>
                  <TableHead>{t("attributes.taken_at") || "Taken at"}</TableHead>
                  <TableHead>
                    {t("attributes.returned_at") || "Returned at"}
                  </TableHead>
                  <TableHead>{t("attributes.notes") || "Notes"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {`${a.user?.first_name || ""} ${a.user?.last_name || ""}`.trim() ||
                        a.user?.username ||
                        "-"}
                    </TableCell>
                    <TableCell>{formatDateTime(a.taken_at)}</TableCell>
                    <TableCell>
                      {a.returned_at ? (
                        formatDateTime(a.returned_at)
                      ) : (
                        <Badge variant="default">
                          {t("attributes.checked_out") || "Checked out"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {carId && car?.has_gps && (
        <CarJourneyMapLoader
          carId={carId}
          isTracking={isTracking}
          livePoint={lastPoint}
        />
      )}
    </div>
  );
}

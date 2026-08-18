"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { getEmployees, getEmployee, UserResource } from "@/actions/workspace/user.actions";
import EmployeePermissionsForm from "@/components/features/hr/EmployeePermissionsForm";

function getUserFullName(user?: UserResource | null) {
  if (!user) return "";
  return user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim();
}

export default function PermissionsPage() {
  const t = useTranslations();
  const { ref, inView } = useInView();
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[] | undefined>(undefined);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["employees-permissions-select"],
    queryFn: ({ pageParam = 1 }) => getEmployees(`page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.success) return undefined;
      const meta = lastPage.data.meta;
      if (!meta || !meta.current_page || !meta.last_page) return undefined;
      return meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const employees =
    data?.pages.flatMap((page) => (page.success ? page.data.data : [])) ?? [];

  const selectedEmployee = employees.find((e) => String(e.id) === selectedId) || null;

  useEffect(() => {
    if (!selectedId) {
      setSelectedPermissions(undefined);
      return;
    }
    let cancelled = false;
    setLoadingPermissions(true);
    getEmployee(selectedId).then((res) => {
      if (cancelled) return;
      setSelectedPermissions(res.success ? res.data.permissions ?? [] : []);
      setLoadingPermissions(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  return (
    <PermissionGate permission="workspace.user.update">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("routes.permissions")}</CardTitle>
            <CardDescription>
              {t("messages.employees.permissions_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Combobox
              items={employees}
              value={selectedId}
              onValueChange={(value) => setSelectedId(value as string)}
            >
              <ComboboxInput
                placeholder={t("actions.select_user")}
                value={selectedEmployee ? getUserFullName(selectedEmployee) : ""}
              />
              <ComboboxContent>
                <ComboboxEmpty>
                  {isLoading
                    ? t("actions.loading")
                    : isError
                      ? t("errors.unknown_error")
                      : t("actions.no_results")}
                </ComboboxEmpty>
                <ComboboxList>
                  {(user: UserResource) => (
                    <ComboboxItem
                      key={user.id}
                      value={String(user.id)}
                      className="flex items-center gap-3 py-2 cursor-pointer"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        {user.avatar && <AvatarImage src={user.avatar} alt={user.username} />}
                        <AvatarFallback className="bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm truncate">
                        {getUserFullName(user)}
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
                {hasNextPage && (
                  <div
                    ref={ref}
                    className="p-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-2"
                  >
                    {isFetchingNextPage && <Spinner />}
                  </div>
                )}
              </ComboboxContent>
            </Combobox>
          </CardContent>
        </Card>

        {selectedEmployee && (
          loadingPermissions ? (
            <div className="flex items-center justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <EmployeePermissionsForm
              key={selectedEmployee.id}
              employeeId={selectedEmployee.id}
              initialPermissions={selectedPermissions}
            />
          )
        )}
      </div>
    </PermissionGate>
  );
}

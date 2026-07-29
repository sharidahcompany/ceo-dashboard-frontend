"use client";

import { BuffetResource } from "@/actions/buffet/buffet.actions";
import {
  BuffetCategoryResource,
  deleteBuffetCategory,
} from "@/actions/buffet/buffet-category.actions";
import {
  BuffetItemResource,
  deleteBuffetItem,
} from "@/actions/buffet/buffet-item.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldSeparator } from "@/components/ui/field";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "@/i18n/navigation";
import { getErrorMessage } from "@/lib/utils";
import {
  Coffee,
  Edit,
  Layers,
  MapPin,
  Plus,
  ShoppingCart,
  Trash2,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";
import { toast } from "sonner";
import BuffetCategoryForm from "./BuffetCategoryForm";
import BuffetItemForm from "./BuffetItemForm";
import BuffetOrderForm from "./BuffetOrderForm";

export default function BuffetDetail({ buffet }: { buffet: BuffetResource }) {
  const t = useTranslations();
  const router = useRouter();

  // Category Modals
  const [openCreateCategoryForm, setOpenCreateCategoryForm] =
    React.useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] =
    React.useState<BuffetCategoryResource | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = React.useState<
    number | null
  >(null);
  const [popoverCategoryOpenId, setPopoverCategoryOpenId] = React.useState<
    number | null
  >(null);

  // Item Modals
  const [selectedCategoryIdForNewItem, setSelectedCategoryIdForNewItem] =
    React.useState<number | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] =
    React.useState<BuffetItemResource | null>(null);
  const [selectedItemForRequest, setSelectedItemForRequest] =
    React.useState<BuffetItemResource | null>(null);
  const [deletingItemId, setDeletingItemId] = React.useState<number | null>(
    null,
  );
  const [popoverItemOpenId, setPopoverItemOpenId] = React.useState<
    number | null
  >(null);

  const [isPending, startTransition] = React.useTransition();

  const handleRefresh = () => {
    setOpenCreateCategoryForm(false);
    setSelectedCategoryForEdit(null);
    setSelectedCategoryIdForNewItem(null);
    setSelectedItemForEdit(null);
    setSelectedItemForRequest(null);
    router.refresh();
  };

  const handleDeleteCategory = (id: number) => {
    setDeletingCategoryId(id);
    startTransition(async () => {
      const result = await deleteBuffetCategory([id]);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(result.data.message);
        setPopoverCategoryOpenId(null);
        router.refresh();
      }
      setDeletingCategoryId(null);
    });
  };

  const handleDeleteItem = (id: number) => {
    setDeletingItemId(id);
    startTransition(async () => {
      const result = await deleteBuffetItem([id]);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(result.data.message);
        setPopoverItemOpenId(null);
        router.refresh();
      }
      setDeletingItemId(null);
    });
  };

  const categories = buffet.buffet_categories || buffet.buffet_categories || [];

  return (
    <div className="space-y-6">
      {/* Buffet Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-muted text-muted-foreground shrink-0">
                <Coffee className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  {buffet.name_localized}
                </CardTitle>
                {buffet.branch?.name_localized && (
                  <CardDescription className="flex items-center gap-1 mt-1 text-sm">
                    <MapPin className="w-4 h-4" />
                    {buffet.branch.name_localized}
                  </CardDescription>
                )}
              </div>
            </div>

            <CardAction>
              <Button
                onClick={() => setOpenCreateCategoryForm(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                {t("messages.buffets.add_new_category")}
              </Button>
            </CardAction>
          </div>
        </CardHeader>

        {buffet.users && buffet.users.length > 0 && (
          <CardContent>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t("attributes.buffet_employees")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {buffet.users.map((user) => (
                <div
                  key={user.id}
                  className="px-3 py-1.5 rounded-md bg-muted text-sm font-medium"
                >
                  {user.first_name
                    ? `${user.first_name} ${user.last_name || ""}`
                    : user.username}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Categories and Items Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Layers className="w-5 h-5" />
            {t("routes.categories")}
          </h2>
        </div>

        {categories.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p>
              {t("messages.buffets.no_categories") ||
                "لا توجد أقسام في هذا البوفيه حتى الآن"}
            </p>
            <Button
              variant="outline"
              className="mt-4 gap-2"
              onClick={() => setOpenCreateCategoryForm(true)}
            >
              <Plus className="w-4 h-4" />
              {t("messages.buffets.add_new_category")}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((category) => {
              const items =
                (category as any).category_items ||
                (category as any).buffet_items ||
                (category as any).items ||
                [];

              return (
                <Card key={category.id} className="space-y-4">
                  <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        {category.name_localized}
                      </CardTitle>
                    </div>

                    <CardAction className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() =>
                          setSelectedCategoryIdForNewItem(category.id)
                        }
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t("messages.buffets.add_new_item")}
                      </Button>

                      {/* Edit Category Button */}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setSelectedCategoryForEdit(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      {/* Delete Category Popover */}
                      <Popover
                        open={popoverCategoryOpenId === category.id}
                        onOpenChange={(open) =>
                          setPopoverCategoryOpenId(open ? category.id : null)
                        }
                      >
                        <PopoverTrigger
                          render={
                            <Button
                              variant="destructive"
                              size="icon-xs"
                              disabled={
                                isPending && deletingCategoryId === category.id
                              }
                            >
                              {isPending &&
                                deletingCategoryId === category.id ? (
                                <Spinner className="w-3.5 h-3.5" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          }
                        />
                        <PopoverContent
                          className="w-64 p-3 space-y-3"
                          align="end"
                        >
                          <div className="space-y-1">
                            <PopoverTitle className="font-semibold text-sm leading-none flex items-center gap-1.5 text-destructive">
                              <Trash2 className="w-4 h-4" />
                              {t("messages.buffets.delete_category_title")}
                            </PopoverTitle>
                            <PopoverDescription className="text-xs text-muted-foreground">
                              {t("messages.buffets.delete_category_confirm")}
                            </PopoverDescription>
                          </div>
                          <div className="flex justify-end gap-2">
                            <PopoverClose
                              render={
                                <Button variant="outline" size="sm">
                                  {t("buttons.cancel")}
                                </Button>
                              }
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={
                                isPending && deletingCategoryId === category.id
                              }
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              {isPending &&
                                deletingCategoryId === category.id ? (
                                <Spinner className="w-3.5 h-3.5" />
                              ) : (
                                t("buttons.delete")
                              )}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </CardAction>
                  </CardHeader>

                  {/* Items List inside Category */}
                  <CardContent>
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-2">
                        {t("messages.buffets.no_items_in_category")}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1   gap-5">
                        {items.map((item: BuffetItemResource) => (
                          <Card key={item.id}>
                            <CardContent className="flex gap-5">
                              <div>
                                {item.icon ? (
                                  <div className="relative h-30 w-30  overflow-hidden border rounded-xl">
                                    <Image
                                      src={item.icon}
                                      alt={item.name_localized || ""}
                                      width={30}
                                      height={30}
                                      className="object-cover h-30 w-30"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex h-30 w-30 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                    <Coffee className="w-8 h-8" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-sm truncate">
                                      {item.name_localized}
                                    </h4>
                                    {item.is_vip && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        VIP
                                      </Badge>
                                    )}
                                  </div>
                                  {item.description_localized && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {item.description_localized}
                                    </p>
                                  )}
                                  <p className="text-xs font-semibold text-primary">
                                    {item.price}
                                  </p>
                                </div>

                                <CardAction className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="default"
                                    size="icon-xs"
                                    onClick={() =>
                                      setSelectedItemForRequest(item)
                                    }
                                    title={
                                      t("messages.buffets.request_item") ||
                                      "Request Item"
                                    }
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => setSelectedItemForEdit(item)}
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>

                                  <Popover
                                    open={popoverItemOpenId === item.id}
                                    onOpenChange={(open) =>
                                      setPopoverItemOpenId(
                                        open ? item.id : null,
                                      )
                                    }
                                  >
                                    <PopoverTrigger
                                      render={
                                        <Button
                                          variant="destructive"
                                          size="icon-xs"
                                          disabled={
                                            isPending &&
                                            deletingItemId === item.id
                                          }
                                        >
                                          {isPending &&
                                            deletingItemId === item.id ? (
                                            <Spinner className="w-3.5 h-3.5" />
                                          ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                          )}
                                        </Button>
                                      }
                                    />
                                    <PopoverContent
                                      className="w-64 p-3 space-y-3"
                                      align="end"
                                    >
                                      <div className="space-y-1">
                                        <PopoverTitle className="font-semibold text-sm leading-none flex items-center gap-1.5 text-destructive">
                                          <Trash2 className="w-4 h-4" />
                                          {t(
                                            "messages.buffets.delete_item_title",
                                          )}
                                        </PopoverTitle>
                                        <PopoverDescription className="text-xs text-muted-foreground">
                                          {t(
                                            "messages.buffets.delete_item_confirm",
                                          )}
                                        </PopoverDescription>
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <PopoverClose
                                          render={
                                            <Button variant="outline" size="sm">
                                              {t("buttons.cancel")}
                                            </Button>
                                          }
                                        />
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          disabled={
                                            isPending &&
                                            deletingItemId === item.id
                                          }
                                          onClick={() =>
                                            handleDeleteItem(item.id)
                                          }
                                        >
                                          {isPending &&
                                            deletingItemId === item.id ? (
                                            <Spinner className="w-3.5 h-3.5" />
                                          ) : (
                                            t("buttons.delete")
                                          )}
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </CardAction>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Category Dialog */}
      <Dialog
        open={openCreateCategoryForm}
        onOpenChange={setOpenCreateCategoryForm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              {t("messages.buffets.add_new_category")}
            </DialogTitle>
            <DialogDescription>
              {t("messages.buffets.add_new_category_description")}
            </DialogDescription>
          </DialogHeader>
          <FieldSeparator />
          <BuffetCategoryForm buffetId={buffet.id} onSuccess={handleRefresh} />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog
        open={!!selectedCategoryForEdit}
        onOpenChange={(open) => {
          if (!open) setSelectedCategoryForEdit(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              {t("messages.buffets.edit_category")}
            </DialogTitle>
            <DialogDescription>
              {t("messages.buffets.edit_category_description")}
            </DialogDescription>
          </DialogHeader>
          <FieldSeparator />
          {selectedCategoryForEdit && (
            <BuffetCategoryForm
              key={selectedCategoryForEdit.id}
              initialData={selectedCategoryForEdit}
              buffetId={buffet.id}
              onSuccess={handleRefresh}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Item Dialog */}
      <Dialog
        open={!!selectedCategoryIdForNewItem}
        onOpenChange={(open) => {
          if (!open) setSelectedCategoryIdForNewItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="w-5 h-5" />
              {t("messages.buffets.add_new_item")}
            </DialogTitle>
            <DialogDescription>
              {t("messages.buffets.add_new_item_description")}
            </DialogDescription>
          </DialogHeader>
          <FieldSeparator />
          {selectedCategoryIdForNewItem && (
            <BuffetItemForm
              categoryId={selectedCategoryIdForNewItem}
              onSuccess={handleRefresh}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog
        open={!!selectedItemForEdit}
        onOpenChange={(open) => {
          if (!open) setSelectedItemForEdit(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="w-5 h-5" />
              {t("messages.buffets.edit_item")}
            </DialogTitle>
            <DialogDescription>
              {t("messages.buffets.edit_item_description")}
            </DialogDescription>
          </DialogHeader>
          <FieldSeparator />
          {selectedItemForEdit && (
            <BuffetItemForm
              key={selectedItemForEdit.id}
              initialData={selectedItemForEdit}
              categoryId={selectedItemForEdit.buffet_category_id}
              onSuccess={handleRefresh}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Request Item Dialog */}
      <Dialog
        open={!!selectedItemForRequest}
        onOpenChange={(open) => {
          if (!open) setSelectedItemForRequest(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {t("messages.buffets.request_item")}
            </DialogTitle>
            <DialogDescription>
              {t("messages.buffets.request_item_description")}
            </DialogDescription>
          </DialogHeader>
          <FieldSeparator />
          <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
            {selectedItemForRequest && (
              <BuffetOrderForm
                initialData={{
                  id: 0,
                  user_id: 0,
                  notes: undefined,
                  status: "pending",
                  items: [
                    {
                      id: 0,
                      buffet_order_id: 0,
                      buffet_item_id: selectedItemForRequest.id,
                      quantity: 1,
                      notes: undefined,
                    },
                  ],
                }}
                onSuccess={() => {
                  setSelectedItemForRequest(null);
                  router.refresh();
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

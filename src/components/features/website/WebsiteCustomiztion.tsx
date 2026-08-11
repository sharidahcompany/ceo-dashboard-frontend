"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useAppStore } from "@/providers/StoreProvider";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { Monitor, Smartphone, Tablet, Plus, Save, Menu } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import {
  getSections,
  reorderSections,
  SectionResource,
  createSection,
  deleteSections,
} from "@/actions/website/customiztion.actions";
import SectionForm from "./SectionForm";
import { SortableSectionItem } from "./SortableSectionItem";

type PreviewMode = "desktop" | "tablet" | "mobile";

export default function WebsiteCustomization() {
  const t = useTranslations();
  const roles = useAppStore((state) => state.roles || []);
  const isSuperAdmin = roles.includes("super-admin");

  const fixedSections = [
    { type: "navbar", label: "Navbar" },
    { type: "products", label: "Products" },
    { type: "vision", label: "Vision" },
    { type: "footer", label: "Footer" },
    ...(isSuperAdmin ? [{ type: "plans", label: "Plans" }] : []),
  ];

  const [sections, setSections] = useState<SectionResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [isPending, startTransition] = useTransition();

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<
    SectionResource | undefined
  >();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const loadSections = async () => {
    setIsLoading(true);
    const result = await getSections();
    if (result.success) {
      // Sort by order ascending
      const sorted = result.data.data.sort(
        (a, b) => (a.order || 0) - (b.order || 0),
      );
      setSections(sorted);
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadSections();
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((i) => i.id === active.id);
      const newIndex = sections.findIndex((i) => i.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newArray = arrayMove(sections, oldIndex, newIndex);

        // Update order values sequentially
        const updatedArray = newArray.map((item, index) => ({
          ...item,
          order: index,
        }));

        // Update state synchronously
        setSections(updatedArray);

        // Call API in background
        startTransition(async () => {
          const payload = updatedArray.map((item) => ({
            id: item.id,
            order: item.order,
          }));
          const res = await reorderSections(payload);
          if (!res.success) {
            toast.error(res.error || "Failed to reorder sections");
            // Re-fetch to reset state on failure
            loadSections();
          } else {
            toast.success(
              t("messages.success", { defaultValue: "Reordered successfully" }),
            );
          }
        });
      }
    }
  };

  const handleAddFixedSection = (type: string) => {
    startTransition(async () => {
      const nextOrder =
        sections.length > 0
          ? Math.max(...sections.map((s) => s.order || 0)) + 1
          : 0;
      const res = await createSection({
        order: nextOrder,
        type,
        content: [] as any, // empty content array for fixed sections
      });

      if (res.success) {
        toast.success(t("messages.success", { defaultValue: "Section added" }));
        loadSections();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleEdit = (section: SectionResource) => {
    setEditingSection(section);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingSection(undefined);
    loadSections();
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      const res = await deleteSections([id]);
      if (res.success) {
        toast.success(
          t("messages.success", { defaultValue: "Section deleted" }),
        );
        loadSections();
      } else {
        toast.error(res.error);
      }
    });
  };

  // Calculate preview container width
  const getPreviewWidth = () => {
    switch (previewMode) {
      case "mobile":
        return "max-w-[375px]";
      case "tablet":
        return "max-w-[768px]";
      case "desktop":
        return "max-w-full";
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      {/* Left Sidebar: Section Builder */}
      <div className="w-1/3 flex flex-col gap-4 border rounded-xl bg-card p-4 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {t("routes.customization", { defaultValue: "Website Sections" })}
          </h2>

          <Dialog
            open={isFormOpen}
            onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) setEditingSection(undefined);
            }}
          >
            <DialogTrigger
              render={
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setEditingSection(undefined)}
                >
                  <Plus className="w-4 h-4" />
                  {t("buttons.add", { defaultValue: "Add Section" })}
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <DialogHeader>
                <DialogTitle>
                  {editingSection
                    ? t("sections.edit", { defaultValue: "Edit Section" })
                    : t("sections.new", { defaultValue: "Add New Section" })}
                </DialogTitle>
              </DialogHeader>
              <SectionForm
                initialData={editingSection}
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 flex-wrap mb-2">
          {fixedSections.map((fs) => (
            <Button
              key={fs.type}
              variant="outline"
              size="sm"
              onClick={() => handleAddFixedSection(fs.type)}
              disabled={isPending}
            >
              + {t("sections." + fs.type, { defaultValue: fs.label })}
            </Button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Spinner className="w-6 h-6" />
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {sections.map((section) => (
                  <SortableSectionItem
                    key={section.id}
                    section={section}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Right Side: Preview */}
      <div className="flex-1 flex flex-col border rounded-xl bg-muted/30 overflow-hidden shadow-sm">
        {/* Preview Header */}
        <div className="h-14 border-b bg-card flex items-center justify-between px-4">
          <h3 className="font-medium text-sm text-muted-foreground">
            {t("common.preview", { defaultValue: "Preview" })}
          </h3>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
            <Button
              variant={previewMode === "desktop" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => setPreviewMode("desktop")}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === "tablet" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => setPreviewMode("tablet")}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === "mobile" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => setPreviewMode("mobile")}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview Window */}
        <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-gray-50 dark:bg-black">
          <div
            className={`w-full bg-white dark:bg-card border shadow-lg rounded-md transition-all duration-300 min-h-full flex flex-col ${getPreviewWidth()}`}
          >
            {/* Mock rendering of sections */}
            {sections.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                {t("messages.no_sections", {
                  defaultValue:
                    "No sections added yet. Add a section to preview.",
                })}
              </div>
            ) : (
              sections.map((section) => {
                if (section.type === "navbar") {
                  return (
                    <div
                      key={section.id}
                      className="w-full border-b p-4 flex justify-between items-center bg-card relative group"
                    >
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 pointer-events-none transition-colors z-10" />
                      <div className="flex items-center gap-2 font-bold text-lg">
                        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-black text-sm">
                          C
                        </div>
                        <span>CEO App</span>
                      </div>
                      {previewMode === "mobile" ? (
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <Menu className="w-5 h-5" />
                        </Button>
                      ) : (
                        <>
                          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
                            <span className="hover:text-primary cursor-pointer">
                              {t("routes.home", { defaultValue: "Home" })}
                            </span>
                            <span className="hover:text-primary cursor-pointer">
                              {t("sections.services", {
                                defaultValue: "Services",
                              })}
                            </span>
                            <span className="hover:text-primary cursor-pointer">
                              {t("sections.features", {
                                defaultValue: "Features",
                              })}
                            </span>
                            <span className="hover:text-primary cursor-pointer">
                              {t("sections.about", { defaultValue: "About" })}
                            </span>
                          </div>
                          <Button size="sm">Get Started</Button>
                        </>
                      )}
                    </div>
                  );
                }

                if (section.type === "header") {
                  const title = section.content?.title || "";
                  const description = section.content?.description || "";
                  const image = section.content?.image || "";
                  return (
                    <div
                      key={section.id}
                      className="w-full py-16 px-8 border-b relative group bg-card"
                    >
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 pointer-events-none transition-colors z-10" />
                      <div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
                        {image && (
                          <div className="w-full max-w-xl aspect-video relative overflow-hidden rounded-2xl border bg-muted flex items-center justify-center">
                            <img
                              src={image}
                              alt={title || "Hero Image"}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <div className="space-y-4">
                          {title && (
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                              {title}
                            </h1>
                          )}
                          {description && (
                            <p className="text-muted-foreground text-sm md:text-base whitespace-pre-line leading-relaxed">
                              {description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (section.type === "footer") {
                  let footerGridClass =
                    "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
                  if (previewMode === "mobile") {
                    footerGridClass = "grid-cols-1";
                  } else if (previewMode === "tablet") {
                    footerGridClass = "grid-cols-2";
                  }

                  return (
                    <div
                      key={section.id}
                      className="w-full border-t p-8 bg-muted/40 relative group mt-auto"
                    >
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 pointer-events-none transition-colors z-10" />
                      <div className={`grid ${footerGridClass} gap-8`}>
                        <div>
                          <div className="flex items-center gap-2 font-bold text-lg mb-3">
                            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-black text-xs">
                              C
                            </div>
                            <span>CEO App</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Elevate your business control and operations in one
                            central system.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-3">Links</h4>
                          <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>Privacy Policy</li>
                            <li>Terms of Service</li>
                            <li>Support</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-3">
                            Contact
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            support@ceoapp.com
                          </p>
                        </div>
                      </div>
                      <div className="border-t mt-6 pt-4 text-center text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} CEO App. All rights
                        reserved.
                      </div>
                    </div>
                  );
                }

                if (section.type === "vision") {
                  return (
                    <div
                      key={section.id}
                      className="w-full py-16 px-8 text-center bg-primary/5 border-b relative group"
                    >
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 pointer-events-none transition-colors z-10" />
                      <div className="max-w-2xl mx-auto">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">
                          Our Vision
                        </span>
                        <h3 className="text-3xl font-black mb-4">
                          Empowering Innovation Globally
                        </h3>
                        <p className="text-muted-foreground leading-relaxed italic text-sm">
                          &quot;To provide startups and enterprises with tools
                          that simplify complexity, drive performance, and
                          inspire continuous growth.&quot;
                        </p>
                      </div>
                    </div>
                  );
                }

                if (section.type === "products") {
                  const mockProducts = [
                    {
                      name: "Wireless Noise-Canceling Headphones",
                      category: "Electronics",
                      price: "$199.99",
                      rating: "4.8",
                      emoji: "🎧",
                      bgColor: "bg-blue-500/10 text-blue-500",
                    },
                    {
                      name: "Minimalist Leather Smart Watch",
                      category: "Wearables",
                      price: "$149.00",
                      rating: "4.6",
                      emoji: "⌚",
                      bgColor: "bg-amber-500/10 text-amber-500",
                    },
                    {
                      name: "Ergonomic Mechanical Keyboard",
                      category: "Accessories",
                      price: "$129.50",
                      rating: "4.9",
                      emoji: "⌨️",
                      bgColor: "bg-purple-500/10 text-purple-500",
                    },
                  ];

                  let productGridClass =
                    "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
                  if (previewMode === "mobile") {
                    productGridClass = "grid-cols-1";
                  } else if (previewMode === "tablet") {
                    productGridClass = "grid-cols-2";
                  }

                  return (
                    <div
                      key={section.id}
                      className="w-full py-12 px-8 border-b relative group bg-muted/20 dark:bg-muted/5"
                    >
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 pointer-events-none transition-colors z-10" />
                      <div className="flex justify-between items-end mb-8">
                        <div>
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">
                            Our Store
                          </span>
                          <h3 className="text-2xl font-bold mt-1">
                            Trending Products
                          </h3>
                        </div>
                        <span className="text-xs font-semibold text-primary hover:underline cursor-pointer">
                          View All Products &rarr;
                        </span>
                      </div>
                      <div className={`grid ${productGridClass} gap-6`}>
                        {mockProducts.map((prod, i) => (
                          <div
                            key={i}
                            className="border rounded-xl bg-card overflow-hidden shadow-sm flex flex-col group/item hover:shadow-md transition-shadow"
                          >
                            <div className="aspect-square bg-muted/30 flex items-center justify-center relative">
                              <div
                                className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${prod.bgColor}`}
                              >
                                {prod.emoji}
                              </div>
                              <span className="absolute top-3 left-3 bg-card px-2 py-0.5 rounded-full text-[10px] font-semibold border text-muted-foreground shadow-xs">
                                {prod.category}
                              </span>
                            </div>
                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-1 text-[11px] text-amber-500 font-medium mb-1">
                                  <span>★</span>
                                  <span>{prod.rating}</span>
                                </div>
                                <h4 className="font-semibold text-sm line-clamp-2 hover:text-primary cursor-pointer mb-2">
                                  {prod.name}
                                </h4>
                              </div>
                              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                                <span className="text-base font-bold text-foreground">
                                  {prod.price}
                                </span>
                                <Button
                                  size="sm"
                                  className="h-8 px-3 text-xs gap-1.5"
                                >
                                  <span>Add to Cart</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (section.type === "plans") {
                  const mockPlans = [
                    {
                      name: "Basic Suite",
                      desc: "Core dashboard, tasks, & basic reports.",
                      price: "$29",
                    },
                    {
                      name: "Enterprise Hub",
                      desc: "Complete CRM, advanced HR, and custom features.",
                      price: "$99",
                    },
                    {
                      name: "Ultimate Plus",
                      desc: "Dedicated cloud hosting, API access, and 24/7 SLA.",
                      price: "$199",
                    },
                  ];

                  let plansGridClass = "grid-cols-1 md:grid-cols-3";
                  if (previewMode === "mobile") {
                    plansGridClass = "grid-cols-1";
                  } else if (previewMode === "tablet") {
                    plansGridClass = "grid-cols-2";
                  }

                  return (
                    <div
                      key={section.id}
                      className="w-full py-12 px-8 border-b relative group bg-card"
                    >
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 pointer-events-none transition-colors z-10" />
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold">
                          Featured Packages
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Pick the perfect tier for your enterprise
                        </p>
                      </div>
                      <div className={`grid ${plansGridClass} gap-6`}>
                        {mockPlans.map((prod, i) => (
                          <div
                            key={i}
                            className="border rounded-xl p-6 bg-card flex flex-col justify-between shadow-sm"
                          >
                            <div>
                              <h4 className="font-bold text-lg mb-2">
                                {prod.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                                {prod.desc}
                              </p>
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                              <span className="text-lg font-bold">
                                {prod.price}{" "}
                                <span className="text-xs font-normal text-muted-foreground">
                                  /mo
                                </span>
                              </span>
                              <Button
                                size="sm"
                                variant={i === 1 ? "default" : "outline"}
                              >
                                Choose
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (section.type === "carousel") {
                  const items = Array.isArray(section.content?.items)
                    ? section.content.items
                    : [];
                  const title = section.content?.title || "";
                  const description = section.content?.description || "";

                  let basisClass = "basis-full"; // mobile always 1
                  if (previewMode === "tablet") {
                    const count = section.content?.slides_per_view_tablet || 1;
                    basisClass =
                      count === 2
                        ? "basis-1/2"
                        : count === 3
                          ? "basis-1/3"
                          : "basis-full";
                  } else if (previewMode === "desktop") {
                    const count = section.content?.slides_per_view_desktop || 1;
                    basisClass =
                      count === 2
                        ? "basis-1/2"
                        : count === 3
                          ? "basis-1/3"
                          : count === 4
                            ? "basis-1/4"
                            : "basis-full";
                  }

                  return (
                    <div
                      key={section.id}
                      className="p-8 border-b relative group bg-card"
                    >
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 pointer-events-none transition-colors z-10" />

                      {(title || description) && (
                        <div className="text-center mb-6">
                          {title && (
                            <h3 className="text-2xl font-bold mb-2">{title}</h3>
                          )}
                          {description && (
                            <p className="text-muted-foreground text-sm max-w-xl mx-auto whitespace-pre-line leading-relaxed">
                              {description}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="px-12 pb-4">
                        {items.length === 0 ? (
                          <div className="aspect-video bg-muted rounded-xl flex items-center justify-center text-sm text-muted-foreground">
                            No slides added yet
                          </div>
                        ) : (
                          <Carousel className="w-full">
                            <CarouselContent>
                              {items.map((item, index) => (
                                <CarouselItem
                                  key={index}
                                  className={basisClass}
                                >
                                  <div className="p-1">
                                    <div className="flex aspect-video items-center justify-center bg-muted rounded-xl relative overflow-hidden">
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={
                                            item.caption || `Slide ${index + 1}`
                                          }
                                          className="object-cover w-full h-full"
                                        />
                                      ) : (
                                        <span className="text-4xl font-semibold">
                                          {t("sections.slide", {
                                            defaultValue: "Slide",
                                          })}{" "}
                                          {index + 1}
                                        </span>
                                      )}
                                      {item.caption && (
                                        <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white p-3 text-center text-sm">
                                          {item.caption}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                          </Carousel>
                        )}
                      </div>
                    </div>
                  );
                }

                if (section.type === "features") {
                  const title = section.content?.title || "";
                  const description = section.content?.description || "";
                  const items = Array.isArray(section.content?.items)
                    ? section.content.items
                    : [];

                  let gridColsClass = "grid-cols-1";
                  if (previewMode === "tablet") {
                    gridColsClass = "grid-cols-2";
                  } else if (previewMode === "desktop") {
                    gridColsClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
                  }

                  return (
                    <div
                      key={section.id}
                      className="w-full py-16 px-8 border-b relative group bg-card"
                    >
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 pointer-events-none transition-colors z-10" />

                      {(title || description) && (
                        <div className="text-center max-w-2xl mx-auto mb-12">
                          {title && (
                            <h3 className="text-3xl font-bold mb-4">{title}</h3>
                          )}
                          {description && (
                            <p className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed">
                              {description}
                            </p>
                          )}
                        </div>
                      )}

                      {items.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                          No feature cards added yet
                        </div>
                      ) : (
                        <div className={`grid ${gridColsClass} gap-8`}>
                          {items.map((item, index) => (
                            <div
                              key={index}
                              className="flex flex-col items-center text-center p-6 border rounded-2xl bg-card shadow-xs"
                            >
                              {item.image && (
                                <div className="w-16 h-16 rounded-full overflow-hidden mb-4 border bg-muted flex items-center justify-center">
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <h4 className="font-semibold text-lg mb-2">
                                {item.title}
                              </h4>
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                {item.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                if (section.type === "section") {
                  const content = section.content || {};
                  const title = content.title || "";
                  const description = content.description || "";
                  const image = content.image || "";
                  const alignment = content.text_alignment || "center";
                  const layout = content.layout || "text-top-image-bottom";

                  const alignClass =
                    alignment === "left"
                      ? "text-left"
                      : alignment === "right"
                        ? "text-right"
                        : "text-center";

                  const isRowLayout =
                    layout === "text-left-image-right" ||
                    layout === "text-right-image-left";
                  const isReverseLayout =
                    layout === "text-right-image-left" ||
                    layout === "text-bottom-image-top";
                  const isMobileView = previewMode === "mobile";
                  const layoutClass = isRowLayout
                    ? `grid grid-cols-1 ${isMobileView ? "" : "md:grid-cols-2"} gap-6 items-center`
                    : `grid grid-cols-1 gap-4 items-center`;

                  const textOrder = isRowLayout
                    ? layout === "text-right-image-left"
                      ? "order-2 md:order-2"
                      : "order-1 md:order-1"
                    : layout === "text-bottom-image-top"
                      ? "order-2"
                      : "order-1";

                  const imageOrder = isRowLayout
                    ? layout === "text-right-image-left"
                      ? "order-1 md:order-1"
                      : "order-2 md:order-2"
                    : layout === "text-bottom-image-top"
                      ? "order-1"
                      : "order-2";

                  return (
                    <div
                      key={section.id}
                      className="p-8 border-b relative group bg-card"
                    >
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 pointer-events-none transition-colors z-10" />
                      <div className={layoutClass}>
                        <div className={`w-full ${alignClass} ${textOrder}`}>
                          {title && (
                            <h3 className="text-2xl font-bold mb-3">{title}</h3>
                          )}
                          {description && (
                            <p className="text-muted-foreground text-sm whitespace-pre-line leading-relaxed">
                              {description}
                            </p>
                          )}
                        </div>

                        {image && (
                          <div
                            className={`w-full max-w-md aspect-video relative overflow-hidden rounded-xl border bg-muted flex items-center justify-center justify-self-center ${imageOrder}`}
                          >
                            <img
                              src={image}
                              alt={title || "Section Image"}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={section.id}
                    className="p-4 border-b text-center relative group"
                  >
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 pointer-events-none transition-colors" />
                    <h4 className="font-semibold text-lg uppercase tracking-wider mb-2">
                      {t("sections.type_section", {
                        type:
                          section.type_localized ||
                          t("sections." + section.type, {
                            defaultValue: section.type,
                          }),
                        defaultValue: `${section.type} Section`,
                      })}
                    </h4>
                    <pre className="text-xs text-left bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(section.content, null, 2)}
                    </pre>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

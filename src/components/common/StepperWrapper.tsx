"use client";

import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTrigger,
} from "@/components/reui/stepper";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Building2, CreditCard, Fan, PartyPopper } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function StepperWrapper({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  const steps = [
    {
      id: 1,
      title: t("messages.org_info.title"),
      icon: <Building2 className="h-4 w-4" />,
      path: "", // Base path
    },
    {
      id: 2,
      title: t("messages.plan.title"),
      icon: <Fan className="h-4 w-4" />,
      path: "plan",
    },
    {
      id: 3,
      title: t("messages.payment.title"),
      icon: <CreditCard className="h-4 w-4" />,
      path: "payment",
    },
    {
      id: 4,
      title: t("messages.congrats.title"),
      icon: <PartyPopper className="h-4 w-4" />,
      path: "congrats",
    },
  ];

  // 1. Determine base URL path dynamically (e.g., "/checkout")
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  // Find if the current last URL segment matches any step sub-path
  const activeStepConfig =
    steps.find((s) => s.path === lastSegment) || steps[0];
  const currentStep = activeStepConfig.id;

  // Reconstruct the base path without the step sub-path suffix
  const isLastSegmentAStep = steps.some(
    (s) => s.path === lastSegment && s.path !== "",
  );
  const basePath = isLastSegmentAStep
    ? "/" + segments.slice(0, -1).join("/")
    : "/" + segments.join("/");

  // 2. Navigation handler that updates the URL
  const handleStepChange = (stepId: number) => {
    const targetStep = steps.find((s) => s.id === stepId);
    if (!targetStep) return;

    // Construct the final destination URL
    const targetPath = targetStep.path
      ? `${basePath.replace(/\/$/, "")}/${targetStep.path}`
      : basePath;

    router.push(targetPath);
  };

  return (
    <Stepper
      value={currentStep}
      onValueChange={handleStepChange}
      className="w-full max-w-md space-y-8"
    >
      <StepperNav>
        {steps.map((step) => (
          <StepperItem key={step.id} step={step.id}>
            <StepperTrigger asChild>
              <StepperIndicator className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=completed]:bg-green-500 data-[state=completed]:text-white data-[state=inactive]:text-gray-500">
                {step.icon}
              </StepperIndicator>
            </StepperTrigger>
            {steps.length > step.id && (
              <StepperSeparator className="group-data-[state=completed]/step:bg-green-500" />
            )}
          </StepperItem>
        ))}
      </StepperNav>

      <StepperPanel className="text-sm">{children}</StepperPanel>

      {/* Buttons */}
      <div className="flex items-center justify-between gap-2.5">
        <Button
          variant="outline"
          onClick={() => handleStepChange(currentStep - 1)}
          disabled={currentStep === 1}
        >
          {t("buttons.previous")}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleStepChange(currentStep + 1)}
          disabled={currentStep === steps.length}
        >
          {t("buttons.next")}
        </Button>
      </div>
    </Stepper>
  );
}

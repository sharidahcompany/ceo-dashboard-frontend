import * as Icons from "lucide-react";

type IconName = keyof typeof Icons;

interface DynamicIconProps {
  name: IconName;
  className?: string;
  size?: number;
}

export default function DynamicIcon({
  name,
  className,
  size = 20,
}: DynamicIconProps) {
  const IconComponent = Icons[name] as Icons.LucideIcon;

  if (!IconComponent) {
    return <Icons.HelpCircle className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
}

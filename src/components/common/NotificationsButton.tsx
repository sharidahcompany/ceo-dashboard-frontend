import { Bell } from "lucide-react";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function NotificationsButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9 relative">
        <Bell className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle language</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

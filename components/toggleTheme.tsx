"use client";

import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() =>
        setTheme(
          document.documentElement.classList.contains("dark")
            ? "light"
            : "dark"
        )
      }
      className="text-foreground/80 hover:text-foreground"
    >
      <SunMedium
        className="hidden h-[18px] w-[18px] dark:block"
        strokeWidth={1.75}
      />

      <Moon
        className="block h-[18px] w-[18px] dark:hidden"
        strokeWidth={1.75}
      />
    </button>
  );
}
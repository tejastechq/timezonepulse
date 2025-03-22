"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
  color?: string;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
  color?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
  size?: "sm" | "md" | "lg";
  maxWidth?: string;
}

const buttonVariants = {
  initial: {
    width: "auto",
    paddingLeft: ".35rem",
    paddingRight: ".35rem",
  },
  animate: (isSelected: boolean) => ({
    width: isSelected ? "auto" : "auto",
    paddingLeft: isSelected ? ".75rem" : ".35rem",
    paddingRight: isSelected ? ".75rem" : ".35rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", maxWidth: "6rem", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.1, type: "spring", bounce: 0, duration: 0.6 };

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-primary-500",
  onChange,
  size = "md",
  maxWidth = "max-w-md"
}: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const outsideClickRef = React.useRef(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useOnClickOutside(outsideClickRef, () => {
    setSelected(null);
    onChange?.(null);
  });

  const handleSelect = (index: number) => {
    setSelected(index);
    onChange?.(index);
  };

  const Separator = () => (
    <div className="mx-0.5 h-[20px] w-[1px] bg-border" aria-hidden="true" />
  );

  // Icon size based on the component size prop
  const getIconSize = () => {
    switch (size) {
      case "sm": return 12;
      case "lg": return 18;
      case "md":
      default: return 16;
    }
  };

  // Height based on the size prop
  const getHeight = () => {
    switch (size) {
      case "sm": return "h-7";
      case "lg": return "h-10";
      case "md":
      default: return "h-8";
    }
  };

  const iconSize = getIconSize();
  const heightClass = getHeight();

  return (
    <div
      ref={(el) => {
        outsideClickRef.current = el;
        containerRef.current = el;
      }}
      className={cn(
        "flex flex-wrap items-center gap-0.5 rounded-2xl border bg-background p-0.5 shadow-sm overflow-hidden",
        maxWidth,
        heightClass,
        className
      )}
    >
      <div className="flex flex-nowrap overflow-hidden">
        {tabs.map((tab, index) => {
          if (tab.type === "separator") {
            return <Separator key={`separator-${index}`} />;
          }

          const Icon = tab.icon;
          const iconColor = tab.color || "";

          return (
            <motion.button
              key={tab.title}
              variants={buttonVariants}
              initial={false}
              animate="animate"
              custom={selected === index}
              onClick={() => handleSelect(index)}
              transition={transition}
              title={tab.title}
              aria-label={tab.title}
              className={cn(
                "relative flex items-center rounded-xl px-2 py-1 text-xs font-medium transition-colors duration-300",
                selected === index
                  ? cn("bg-muted", activeColor)
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              style={{ height: "100%" }}
            >
              <Icon size={iconSize} className={iconColor} />
              <AnimatePresence initial={false}>
                {selected === index && (
                  <motion.span
                    variants={spanVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={transition}
                    className="overflow-hidden text-xs whitespace-nowrap ml-1"
                  >
                    {tab.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
} 
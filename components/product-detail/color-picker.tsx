import { cn } from "cn";
import type { ComponentProps } from "react";

import { Link } from "@/components/ui/link";
import { Swatch } from "@/components/ui/swatch";
import { colorFromName } from "@/lib/product/color-names";
import type { OptionGroupState } from "@/lib/product/types";

interface ColorPickerProps extends ComponentProps<"div"> {
  hideImages?: boolean;
  onSelectValue?: (optionName: string, value: string) => void;
  option: OptionGroupState;
}

export function ColorPicker({
  hideImages,
  onSelectValue,
  option,
  className,
  ...props
}: ColorPickerProps) {
  const selectedValue = option.values.find((value) => value.selected)?.name ?? "";
  return (
    <div className={cn("grid gap-2.5", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">
        {option.name}: <span className="font-semibold text-foreground">{selectedValue}</span>
      </p>
      <div className="flex flex-wrap gap-3">
        {option.values.map((value) => {
          const named = colorFromName(value.name);
          const fill = value.swatch?.color || named.hex;
          const imageUrl = hideImages
            ? undefined
            : value.swatch?.image || (fill ? undefined : value.image);
          const unavailable = !value.exists || !value.available;
          const swatch = (
            <Swatch
              color={fill}
              image={imageUrl}
              label={value.name}
              selected={value.selected}
              className={cn(
                "size-10",
                named.light && "after:inset-ring-foreground/25",
                unavailable &&
                  "before:pointer-events-none before:absolute before:inset-0 before:z-10 before:m-auto before:h-px before:w-[140%] before:-translate-x-[15%] before:-rotate-45 before:bg-foreground/60",
              )}
            />
          );
          if (!value.exists || !value.available) {
            return (
              <span
                key={value.name}
                className="block cursor-not-allowed rounded-full opacity-40"
                aria-label={`${option.name}: ${value.name} (unavailable)`}
              >
                {swatch}
              </span>
            );
          }
          return (
            <Link
              key={value.name}
              href={value.href}
              scroll={false}
              className="block cursor-pointer rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-2"
              aria-label={`Select ${option.name}: ${value.name}`}
              aria-current={value.selected ? "true" : undefined}
              onClick={
                onSelectValue && !value.crossProduct
                  ? (event) => {
                      event.preventDefault();
                      onSelectValue(option.name, value.name);
                    }
                  : undefined
              }
            >
              {swatch}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

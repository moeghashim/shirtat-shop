import { cn } from "cn";
import type { ComponentProps } from "react";

import { Link } from "@/components/ui/link";
import { Swatch } from "@/components/ui/swatch";
import { type Locale, defaultLocale } from "@/lib/i18n";
import { localizeOptionName, localizeOptionValue } from "@/lib/i18n/product";
import { colorFromName } from "@/lib/product/color-names";
import type { OptionGroupState } from "@/lib/product/types";

interface ColorPickerProps extends ComponentProps<"div"> {
  hideImages?: boolean;
  locale?: Locale;
  onSelectValue?: (optionName: string, value: string) => void;
  option: OptionGroupState;
}

export function ColorPicker({
  hideImages,
  locale = defaultLocale,
  onSelectValue,
  option,
  className,
  ...props
}: ColorPickerProps) {
  const optionName = localizeOptionName(option.name, locale);
  const selectedValue = localizeOptionValue(
    option.name,
    option.values.find((value) => value.selected)?.name ?? "",
    locale,
  );
  return (
    <div className={cn("grid gap-2.5", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">
        {optionName}: <span className="font-semibold text-foreground">{selectedValue}</span>
      </p>
      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={optionName}>
        {option.values.map((value) => {
          const named = colorFromName(value.name);
          const valueName = localizeOptionValue(option.name, value.name, locale);
          const fill = named.background ? undefined : value.swatch?.color || named.hex;
          // Swatches are always solid fabric colours; images only as last resort.
          const imageUrl = hideImages || named.background || fill ? undefined : value.swatch?.image;
          const unavailable = !value.exists || !value.available;
          const swatch = (
            <Swatch
              color={fill}
              background={named.background}
              image={imageUrl}
              label={valueName}
              selected={value.selected}
              className={cn(
                "size-10",
                named.light && "after:inset-ring-1 after:inset-ring-foreground/40",
                unavailable &&
                  "before:pointer-events-none before:absolute before:inset-0 before:z-10 before:m-auto before:h-px before:w-[140%] before:-translate-x-[15%] before:-rotate-45 before:bg-foreground/60",
              )}
            />
          );
          if (!value.exists) {
            return (
              <button
                key={value.name}
                className="block cursor-not-allowed rounded-full opacity-40"
                aria-label={`${optionName}: ${valueName} (${locale === "ar" ? "غير متاح" : "unavailable"})`}
                disabled
                type="button"
              >
                {swatch}
              </button>
            );
          }
          return (
            <Link
              key={value.name}
              href={value.href}
              scroll={false}
              className="block cursor-pointer rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-2"
              aria-label={
                locale === "ar"
                  ? `اختر ${optionName}: ${valueName}${value.available ? "" : " (نفدت الكمية)"}`
                  : `Select ${optionName}: ${valueName}${value.available ? "" : " (sold out)"}`
              }
              role="radio"
              aria-checked={value.selected}
              title={valueName}
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

import { cn } from "cn";
import type { ComponentProps } from "react";

import { Link } from "@/components/ui/link";
import { type Locale, defaultLocale } from "@/lib/i18n";
import { localizeOptionName, localizeOptionValue } from "@/lib/i18n/product";
import type { OptionGroupState } from "@/lib/product/types";

interface OptionPickerProps extends ComponentProps<"div"> {
  compact?: boolean;
  locale?: Locale;
  onSelectValue?: (optionName: string, value: string) => void;
  option: OptionGroupState;
}

export function OptionPicker({
  compact = false,
  locale = defaultLocale,
  onSelectValue,
  option,
  className,
  ...props
}: OptionPickerProps) {
  const optionName = localizeOptionName(option.name, locale);
  return (
    <div className={cn("grid gap-2.5", className)} {...props}>
      <p className="text-sm font-medium text-foreground/70">{optionName}</p>
      <div className="flex flex-wrap gap-2">
        {option.values.map((value) => {
          const valueName = localizeOptionValue(option.name, value.name, locale);
          const classes = cn(
            "grid px-4 text-center text-sm rounded-lg transition-all border",
            compact ? "py-1" : "h-11 min-w-14 content-center px-3 py-0",
            !value.exists
              ? "font-normal border-dashed border-border text-muted-foreground/50 line-through cursor-not-allowed"
              : value.selected
                ? "font-medium border-foreground bg-foreground text-background"
                : "font-normal border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            value.exists && !value.available && "border-dashed line-through",
          );

          // Invisible medium-weight twin reserves the bold width so pills don't shift on selection.
          const label = (
            <>
              <span className="col-start-1 row-start-1">{valueName}</span>
              <span aria-hidden="true" className="invisible col-start-1 row-start-1 font-medium">
                {valueName}
              </span>
            </>
          );

          if (!value.exists) {
            return (
              <button
                key={value.name}
                aria-label={`${optionName}: ${valueName} (${locale === "ar" ? "غير متاح" : "unavailable"})`}
                className={classes}
                disabled
                type="button"
              >
                {label}
              </button>
            );
          }

          return (
            <Link
              key={value.name}
              href={value.href}
              scroll={false}
              className={classes}
              aria-current={value.selected ? "true" : undefined}
              aria-label={
                value.available
                  ? undefined
                  : `${optionName}: ${valueName} (${locale === "ar" ? "نفدت الكمية" : "sold out"})`
              }
              onClick={
                onSelectValue && !value.crossProduct
                  ? (event) => {
                      event.preventDefault();
                      onSelectValue(option.name, value.name);
                    }
                  : undefined
              }
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

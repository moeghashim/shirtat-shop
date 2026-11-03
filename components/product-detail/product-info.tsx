import { cn } from "cn";
import type { ComponentProps } from "react";

import { type Locale, defaultLocale } from "@/lib/i18n";
import { localizeOptionName, localizeOptionValue } from "@/lib/i18n/product";
import { isColorOption } from "@/lib/product";
import type { OptionGroupState } from "@/lib/product/types";

import { ColorPicker } from "./color-picker";
import { OptionPicker } from "./option-picker";

interface ProductInfoOptionsProps extends ComponentProps<"div"> {
  compact?: boolean;
  hideImages?: boolean;
  locale?: Locale;
  onSelectValue?: (optionName: string, value: string) => void;
  options: OptionGroupState[];
}

function ProductInfoOptions({
  compact = false,
  hideImages,
  locale = defaultLocale,
  onSelectValue,
  options,
  className,
  ...props
}: ProductInfoOptionsProps) {
  // Shopify emits a synthetic Title/Default Title option for products with no variant axes — hide it.
  const isShopifyDefaultOption = (opt: OptionGroupState) =>
    opt.name === "Title" && opt.values.length === 1 && opt.values[0]?.name === "Default Title";
  const isSingleValueOption = (opt: OptionGroupState) => opt.values.length === 1;
  const renderable = options.filter((opt) => !isShopifyDefaultOption(opt));
  if (renderable.length === 0) return null;

  const singleValueOptions = renderable.filter(isSingleValueOption);
  const colorOptions = renderable.filter((opt) => !isSingleValueOption(opt) && isColorOption(opt));
  const otherOptions = renderable.filter((opt) => !isSingleValueOption(opt) && !isColorOption(opt));
  return (
    <div data-slot="product-info-options" className={className} {...props}>
      <div className={cn("grid", compact ? "gap-2.5" : "gap-5")}>
        {singleValueOptions.map((option) => (
          <p key={option.name} className="text-sm font-medium text-foreground/70">
            {localizeOptionName(option.name, locale)}:{" "}
            <span className="text-foreground">
              {localizeOptionValue(option.name, option.values[0]?.name ?? "", locale)}
            </span>
          </p>
        ))}

        {colorOptions.map((option) => (
          <ColorPicker
            key={option.name}
            hideImages={hideImages}
            locale={locale}
            onSelectValue={onSelectValue}
            option={option}
          />
        ))}

        {otherOptions.map((option) => (
          <OptionPicker
            compact={compact}
            key={option.name}
            locale={locale}
            onSelectValue={onSelectValue}
            option={option}
          />
        ))}
      </div>
    </div>
  );
}

interface ProductInfoDescriptionProps extends ComponentProps<"div"> {
  descriptionHtml: string;
}

function ProductInfoDescription({
  descriptionHtml,
  className,
  ...props
}: ProductInfoDescriptionProps) {
  if (!descriptionHtml) return null;
  return (
    <div data-slot="product-info-description" className={className} {...props}>
      <div
        className="prose prose-sm text-foreground/80"
        // oxlint-disable-next-line react/no-danger -- Product descriptions pass through sanitizeShopifyHtml when fetched.
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      />
    </div>
  );
}

export { ProductInfoDescription, ProductInfoOptions };

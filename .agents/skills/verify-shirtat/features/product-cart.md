# Product page and cart
## Sub-features
Gallery carousel, colour swatches (solid circles, colour name on hover via title/aria-label), Details (`shirtat.specs`) and Printing (`shirtat.print_method`) sections, Add to Cart → cart sheet, `/cart`.
## How to get to it (user POV)
Click any product card, e.g. /products/ana-ibn-jala-t-shirt.
## Driving it with Playwright
`[data-slot="pdp-carousel"]`, `[data-slot="swatch"]` (computed background is an rgb colour, no url()), `getByRole('button',{name:/add to cart/i})`, then body text matches checkout/subtotal; `/cart` text has the product or subtotal.
## Gotchas
STOP at the cart. Never press Checkout. Swatch hex values are estimates; bodysuits and Bayni products have no per-colour photos.

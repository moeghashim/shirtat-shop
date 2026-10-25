# Collections
## Sub-features
`/collections/kids`, `/collections/baby` (filled automatically from tags `category:kids` / `category:baby`), AR versions under `/ar/collections/...`.
## How to get to it (user POV)
Menu → Kids / Baby.
## Driving it with Playwright
Count `[data-slot="product-card"]` > 0; AR expects `dir=rtl`.
## Gotchas
`networkidle` can hang on /ar collections (image streaming); the harness waits for `load` then up to 15 s idle.

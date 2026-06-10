# Performance optimization todo

- [x] Inspect key layout/components (BaseLayout, Gallery, Figure, Header, Footer) and gather hotspots.
- [x] Optimize font loading in BaseLayout (swap media + noscript fallback).
- [x] Make reveal-on-scroll script deferred and guard against empty lists.
- [x] Gallery: reduce eager image loading; switch to lazy by default and keep only first image high priority.
- [x] Gallery: guard lightbox open() when src is empty.
- [x] Gallery: improve script type safety.
- [x] Figure component: set fetchpriority + sizes to improve LCP behavior.
- [x] Run build + lighthouse/perf checks (or at least astro build) to ensure nothing broke.
- [x] Review remaining image tags (TopicHero, full-bleed feature on index, etc.) and apply same lazy/priority strategy.
- [ ] Consider adding Astro image optimization (if desired) for all images.





Example 1 command:

```
npm run mas -- "Move the total number of phones count below the Search Phones section."
```

Example 1 real output:
```
> pricing-catalog@0.1.0 mas
> tsx mas/index.ts Move the total number of phones count below the Search Phones section.

[coordinator] starting
[researcher] starting
[coordinator] starting
[programmer] starting
[coordinator] starting
[tester] starting
[coordinator] starting

=== Maintenance workflow result ===

Moved the live phone count below the complete Search Phones panel and above the results in `components/catalog-filter.tsx`.

Preserved:

- Live `filteredProducts.length` updates
- Singular/plural wording
- `aria-live="polite"`
- Consistent mobile and desktop DOM order

Verification passed:

- ESLint
- TypeScript
- Production build
- `git diff --check`

Only `components/catalog-filter.tsx` was modified. No regressions were found.
```
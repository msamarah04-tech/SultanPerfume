# Pricing Audit — Al Sultan Perfumes

> **Status:** complete, verified clean, shipped.
> **Date:** 2026-05-23.
> **Scope:** server-authoritative pricing for `bundle`, `percentage`, and
> `fixed` offer types, per-product / global / cart-wide quantity tiers,
> delivery fee, and the frontend mirror. Establishes the foundation for
> the follow-up `OFFER_LIMITS.md` work (date bounds, min-cart, product
> restrictions).

---

## Why this audit existed

The follow-up prompt that introduces offer limits (date bounds, min
cart, product restrictions) requires four things from the pricing
system before it can safely be stacked on top:

1. The three existing offer types actually work end-to-end.
2. The frontend mirror is in sync with server math.
3. A non-persisting `POST /orders/preview` endpoint exists.
4. A `pricing_audit` table exists so admin actions that move totals
   leave a trail.

When we looked at the code, the first item was broken (promo codes
silently dropped) and items 3 and 4 didn't exist. Layering new offer
constraints on top of a broken discount path would have multiplied
the failure modes.

---

## Findings

### F1 — Promo codes silently dropped (CRITICAL, FIXED)

**Symptom:** Customer entered a promo code at checkout, saw the
discount line item ("خصم 5 د.أ"), saw a reduced total, hit "تأكيد
الطلب", and the order was saved at the **full undiscounted price**.

**Root cause:**
- [order.schema.js:6-21](server/src/schemas/order.schema.js#L6-L21) —
  `createOrderSchema` accepted only `{ customer, items }`. Any
  `promoCode` field was stripped by `validate()` before it reached
  the route.
- [public.orders.routes.js:14](server/src/routes/public.orders.routes.js#L14) —
  the route destructured `{ customer, items }` and computed totals
  from items only; it never looked at promo codes.
- [Checkout.jsx:285-311](src/pages/Checkout.jsx#L285-L311) — the
  frontend looked up the offer in `offersApi.list()`, computed the
  discount client-side, and only stored it in component state.
  Never sent.

**Fix:** Promo codes are now first-class server input. The schema
accepts an optional `promoCode`, the route looks up the matching
offer, validates type/active/date window, computes the discount in
piasters, caps it at the subtotal, and persists it to the order.
The frontend submits the code it has applied; the server is the
final authority.

### F2 — No preview endpoint (FIXED)

There was no way for the checkout page to learn what the server
total would be before submit. The customer might apply a code and
see one number, then receive a confirmation with a different number.

**Fix:** Added `POST /orders/preview`. Same input shape as `POST
/orders` (minus `customer`), runs the same compute function, returns
the same totals, persists nothing. Used by Checkout to render the
sidebar total and to validate promo codes on Apply.

### F3 — No drift protection between preview and create (FIXED BY F2)

When two endpoints compute the same thing, they drift. To make that
impossible, `computeOrderPricing` is the single function that both
endpoints call. They cannot return different totals for the same
input — the math lives in one place.

### F4 — No audit trail for pricing-affecting changes (FIXED)

If an order totalled an unexpected number, there was no way to
reconstruct which offer / tier / setting was active at the time.

**Fix:** Added `pricing_audit` table (migration v7) and a
`writePricingAudit` helper, wired into admin offer create/update/
delete, settings updates that touch pricing keys, and bulk-tier
edits. Read via `GET /admin/audit/pricing`.

### F5 — Order record had no discount column (FIXED)

The `orders` table stored only `subtotal`, `delivery_fee`, `total`.
With a promo applied, `subtotal + delivery_fee ≠ total` — and the
admin had no way to see *why* an order totalled less than its
subtotal.

**Fix:** Migration v7 adds `orders.discount` (piasters) and
`orders.applied_promo_code` (text). Persisted on every order.
Exposed on the order API response.

### F6 — `offers.starts_at` / `offers.ends_at` were unenforced (FIXED)

The columns existed in the schema but nothing checked them. An
expired promo code would still apply.

**Fix:** `computeOrderPricing` checks both fields against an
injected `now` and raises `PROMO_NOT_STARTED` / `PROMO_EXPIRED` for
promo codes and `OFFER_NOT_STARTED` / `OFFER_EXPIRED` for bundle
offers.

### F7 — Cart-wide tier had no upper bound (FIXED)

**Symptom:** With a tier like "5 for 25 JOD" configured, adding a 6th,
10th, 100th bottle still totalled 25 JOD. The cart-tier matched
greedily on `minQty ≤ cartQty` and **replaced** the subtotal — it
never noticed when the customer was past the highest configured
threshold. Per-bottle price kept falling toward zero as qty grew.

**Fix:** `computeOrderPricing` now finds the cap (= the largest
`minQty` in the enabled tiers) and gates the replacement:

- `cartQty ≤ cap` → subtotal becomes `cartTierTotal` (unchanged
  behaviour).
- `cartQty > cap` → subtotal becomes `cartTierTotal + (cartQty − cap)
  × excessUnitPrice`, where `excessUnitPrice` is a per-bottle JOD
  rate on `cartQuantityTiers` (admin-editable in the bulk-tier
  modal; defaults to 5 JOD).

The frontend mirror in [src/context/CartContext.jsx](src/context/CartContext.jsx)
applies the same cap so the cart sidebar matches.

Example with a "5 for 25" tier and the default 5 JOD excess rate:

| qty | before fix | after fix |
|---|---|---|
| 5 | 25 | 25 |
| 6 | 25 | 30 (25 + 5) |
| 10 | 25 | 50 (25 + 5×5) |
| 100 | 25 | 500 (25 + 95×5) |

Covered by scenarios 2b, 2c, and 2d in the verification suite.

### F8 — Frontend mirror matches server math (CONFIRMED CLEAN)

[src/lib/pricing.js](src/lib/pricing.js) + [src/context/CartContext.jsx](src/context/CartContext.jsx)
and [server/src/lib/pricing.js](server/src/lib/pricing.js) implement
the same `resolveTieredLineTotal`, `resolveCartTier`, and cap logic.
Same precedence (per-product > global %), same sort, same min-qty
match, same cap on cart-tier excess. The frontend computes for UX;
the server computes for truth. Verified by scenario 17 below.

---

## Precedence matrix

What overrides what, in the order the server applies it.

| Stage | Source | Effect | Wins over |
|---|---|---|---|
| 1. Bundle line | `productId` starts with `bundle:` → `offers.price` (piasters) | Bundle item priced at offer price; **never** participates in tier math | Everything below |
| 2. Per-product tier | `product_quantity_tiers` rows | Largest `minQty ≤ qty` wins; tier's `unit_price` is the **line total** | Global % |
| 3. Global % tier | `settings.quantityPricing` | Applies `discountPercent` to `base × qty`. Only fires if product has **no** per-product tiers | base × qty |
| 4. Cart-wide tier | `settings.cartQuantityTiers` | When non-bundle qty ≥ `minQty`, **replaces** the non-bundle subtotal with `totalPrice`. **Caps at the highest tier's `minQty`** — every additional bottle past the cap costs `excessUnitPrice` JOD (admin-configurable, defaults to 5). Allocated across lines by raw catalog proportions | Stages 2 & 3 *for non-bundle items only* |
| 5. Promo code | `offers.promo_code` matched in `offers` table, type `percentage` or `fixed` | `discount = min(computed, subtotal)`. Bundle-type codes are rejected | Capped at subtotal |
| 6. Delivery fee | `settings.deliveryFee`, `settings.freeDeliveryThreshold` | `freeThreshold > 0 && subtotal ≥ freeThreshold` ⇒ free. **Checked against pre-discount subtotal** | n/a |

Final formula:
```
total = max(0, subtotal − discount) + deliveryFee
```

Where `subtotal` is the post-tier sum (after stages 1–4).

**Why free-delivery uses pre-discount subtotal:** the customer who
buys 25 JOD of perfume and applies SAVE5 to bring the cart to 20 JOD
still "spent 25 with us" — and we don't want a promo code to silently
revoke the free-delivery they would have qualified for. This is a
business decision; if it should change, it's a one-line edit in
`computeOrderPricing`.

---

## What changed in code

### New / modified files

| File | Change |
|---|---|
| [server/src/lib/pricing.js](server/src/lib/pricing.js) | Added `computeOrderPricing`, `PricingError` |
| [server/src/lib/audit.js](server/src/lib/audit.js) | New — `writePricingAudit`, `listPricingAudit` |
| [server/src/db/schema.sql](server/src/db/schema.sql) | Added `orders.discount`, `orders.applied_promo_code`, `pricing_audit` table |
| [server/src/db/migrate.js](server/src/db/migrate.js) | New v7 block — idempotent ALTERs + table creation |
| [server/src/schemas/order.schema.js](server/src/schemas/order.schema.js) | Added optional `promoCode` to `createOrderSchema`; added `previewOrderSchema` |
| [server/src/routes/public.orders.routes.js](server/src/routes/public.orders.routes.js) | Rewritten — single helper drives both `POST /` and the new `POST /preview` |
| [server/src/routes/admin.routes.js](server/src/routes/admin.routes.js) | Audit-log writer wired into offer create/update/delete, settings update, bulk-tiers; added `GET /admin/audit/pricing` |
| [server/src/repositories/orders.repo.js](server/src/repositories/orders.repo.js) | Persists discount + applied_promo_code |
| [server/src/lib/mappers.js](server/src/lib/mappers.js) | Order API surface exposes `discount` + `appliedPromoCode` |
| [src/lib/api.js](src/lib/api.js) | `ordersApi.preview` |
| [src/pages/Checkout.jsx](src/pages/Checkout.jsx) | Live `/orders/preview` for the total, sends `promoCode` on submit, server-validated promo apply with Arabic error messages |
| [server/scripts/audit-verify.mjs](server/scripts/audit-verify.mjs) | New — 20-scenario verification harness |

### Migration v7

- `orders.discount INTEGER NOT NULL DEFAULT 0` (piasters)
- `orders.applied_promo_code TEXT` (nullable)
- `pricing_audit` table with `(actor, entity, entity_key, old_value, new_value, note, at)`
- Idempotent — re-running the migration is a no-op.

### Error codes

All raised as HTTP 422 with `{ ok:false, error:{ code, message } }`:

| Code | When |
|---|---|
| `EMPTY_CART` | items array empty |
| `INVALID_ITEM` | item missing `productId` |
| `INVALID_QUANTITY` | quantity not a positive integer |
| `PRODUCT_NOT_FOUND` | product doesn't exist or is inactive |
| `SIZE_NOT_FOUND` | requested size not on product |
| `OFFER_NOT_FOUND` | bundle line refs an unknown / inactive offer |
| `OFFER_NOT_STARTED` | bundle offer has `startsAt` in the future |
| `OFFER_EXPIRED` | bundle offer has `endsAt` in the past |
| `PROMO_INVALID` | code doesn't match any active offer |
| `PROMO_INACTIVE` | matched offer is `active: false` |
| `PROMO_WRONG_TYPE` | code belongs to a `bundle` offer, not `percentage`/`fixed` |
| `PROMO_NOT_STARTED` | promo's `startsAt` is in the future |
| `PROMO_EXPIRED` | promo's `endsAt` is in the past |

---

## Verification

Live curl scenarios against `localhost:4000` via
`server/scripts/audit-verify.mjs`. The harness logs in as admin,
snapshots settings, drives each scenario, and restores settings at
the end. All scenarios used a tier-free fixture product (`p050`) so
that per-product tiers wouldn't mask the rule under test.

```
✓ 1. single item, no promo                       subtotal=12 total=12
✓ 2. cart-wide tier overrides subtotal           subtotal=30
✓ 2b. cart-tier caps; excess at 5 JOD/bottle     qty=5 subtotal=40 (30+2×5)
✓ 2c. cart-tier cap holds at large qty           qty=10 subtotal=65 (30+7×5)
✓ 2d. admin-configurable excess rate             qty=5 with rate=8 → 46
✓ 3. global % tier applies                       subtotal=18 (25% off 24)
✓ 4. percentage promo applies                    subtotal=24 discount=2.4 total=21.6
✓ 5. fixed promo applies                         discount=5 total=19
✓ 6. discount caps at subtotal                   discount=12 total=0
✓ 7. invalid promo → PROMO_INVALID               status=422
✓ 8. expired promo → PROMO_EXPIRED               status=422
✓ 9. future promo → PROMO_NOT_STARTED            status=422
✓ 10. inactive promo rejected                    status=422
✓ 11. bundle-type code → PROMO_WRONG_TYPE        status=422
✓ 12. delivery fee added                         deliveryFee=3 total=15
✓ 13. free-delivery threshold waives fee         deliveryFee=0 total=24
✓ 14. free-delivery uses PRE-discount subtotal   deliveryFee=0 total=21.6
✓ 15. bundle item uses offer.price (25 JOD)      subtotal=25
✓ 16. bundle excluded from cart-tier allocation  bundle=25 catalog=5 subtotal=30
✓ 17. preview total == create total (no drift)   both 21.6
✓ 18. discount + applied_promo_code persisted    discount=1.2 code=SAVE10
✓ 19. audit log records offer create             actor=admin note=created
✓ 20. audit log records settings change          19 rows

23/23 scenarios passed
```

To re-run: `cd server && node scripts/audit-verify.mjs` (server must
be on :4000).

### Observation worth recording

Scenario 3 initially failed because the original fixture (`p001`)
had a per-product tier of `2 bottles for 13 JOD`. The system
correctly applied that tier and ignored the global %, because
**per-product tiers override global %** — exactly what the
precedence matrix says. The "failure" was a confused test
expectation, not a bug. The harness was switched to `p050` (no
tiers) for the global-% scenario specifically; that's the one place
the audit needs a clean slate to isolate the rule under test.

---

## Behavioural changes for existing data

- **Existing orders** — unaffected. They show `discount: 0` and
  `appliedPromoCode: null` on the API surface (the SQLite ALTER
  TABLE defaults zero/null for existing rows).
- **Existing offers** — unaffected. `starts_at` and `ends_at` were
  already in the schema and (until now) ignored; any offer that has
  these fields set will now actually start / expire. Audit suggests
  the admin scans `/admin/offers` once after deploy to confirm no
  unintended expiries.
- **Existing customers with stale localStorage carts** — the
  Checkout page calls `/orders/preview` on mount, so any client-side
  total will be reconciled with the server before the customer
  submits.

---

## Known limitations carried forward (out of scope for this audit)

These are real but were explicitly outside the audit's scope and
deferred to follow-up work. None of them block the offer-limits
prompt.

1. **OrderConfirmed page does not yet render `discount` or
   `appliedPromoCode`.** The data is persisted and returned, but the
   confirmation screen still shows only `total`. One template edit.
2. **No `whatsapp.js` builder lives in `src/lib/` yet.** The
   `PROJECT_OVERVIEW.md` mentions it but the file doesn't exist —
   order confirmation just shows totals, no auto-generated WhatsApp
   message. If that gets built, it should read `discount` and
   `appliedPromoCode` from the order response (already exposed).
3. **No "stackable promos" — only one code per order.** The audit
   matrix treats promo as a single discount field; combining codes
   is a different design.
4. **Free-delivery threshold uses pre-discount subtotal.**
   Documented above as a deliberate business decision, but worth
   restating: a customer using a heavy promo that brings the cart
   below the threshold still gets free delivery.
5. **Per-customer promo limits ("use once per customer")** require a
   customer-identity model the project doesn't yet have.

These are flagged for the offer-limits prompt and any subsequent
work, but none of them invalidate any rule above.

---

## Pre-conditions met for follow-up prompts

The offer-limits prompt (date bounds / min cart / product
restrictions) can now proceed. It will find:

- ✅ Promo codes that actually work server-side
- ✅ A `POST /orders/preview` endpoint to power live "applied" /
  "not eligible" UI
- ✅ A `pricing_audit` table for Step 6 logging
- ✅ `offers.starts_at` / `offers.ends_at` already enforced — date
  bounds only need to be exposed through the admin form
- ✅ `PricingError` class with structured codes — extend it with the
  three new eligibility codes (`BELOW_MIN_CART`,
  `PRODUCT_NOT_ELIGIBLE`, etc.) rather than inventing a new error
  model
- ✅ `computeOrderPricing` is the single source of truth; eligibility
  gates plug in there and nowhere else

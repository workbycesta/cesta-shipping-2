# Manifest Floor-Price Proportional Adjustment

## The problem

- b4traders gives one **lot floor price** per lot (e.g. ₹1,00,000).
- The website shows the **hiked + rounded-up** floor price
  (`F = ceil_to_1000(raw_lot_floor × (1 + hike%))`).
- The manifest Excel has one Floor Price per item row. Each row is hiked and
  rounded individually, so `Σ(row prices)` drifts away from `F`
  (rounding error × number of rows). On a real lot (120141: 105 items,
  floor ₹18,000) the raw rows summed to ₹17,996 while the lot floor is ₹18,000
  — and per-row rounding only makes it worse.

## Requirement

After all adjustments, the manifest's Floor Price column must add up to
**exactly** the website floor price `F`, with the rounding difference spread
**proportionately** (a ₹70,000 item absorbs ~7× more of the difference than a
₹10,000 item) — never split equally.

## Formula (largest-remainder apportionment)

Let the lot's raw floor be `L` and the lot-level hike percent be `p_lot`
(the custom range containing `L`, else the global default hike).

```
Target  T  =  ceil_to_1000( L × (1 + p_lot/100) )      … the website floor price
```

For each manifest row `i` with a positive numeric raw floor `r_i`, let `p_i`
be that row's own hike percent (custom range containing `r_i`, else default).
Exact (unrounded) hiked values:

```
h_i  =  r_i × (1 + p_i/100)
S    =  Σ h_i                                   … exact hiked total
k    =  T / S                                   … single proportional scale factor
a_i  =  h_i × k                                 … ideal adjusted price (may be fractional)
```

Convert ideals to whole rupees with the **largest remainder method**:

```
base_i     =  floor(a_i)
deficit D  =  T − Σ base_i        (0 ≤ D < n, mathematically)
final_i    =  base_i + 1  for the D rows with the largest (a_i − base_i), else base_i
```

`Σ final_i = T` exactly, and every row is within ₹1 of its ideal proportional
share — the fairest possible whole-rupee split. Sorting is by fractional
remainder (ties: larger ideal first) so big-ticket items win ties
deterministically.

## Worked example

Lot floor `L = ₹1,00,000`, global default hike 10%.
Custom ranges: ₹70,000 in a 5% band, ₹20,000 in a 5% band, ₹10,000 outside
all bands (default 10%).

- Lot: `H = 100000 × 1.10 = 110000` → `T = ceil1000 = ₹1,10,000`
- Rows exact: `73500, 21000, 11000` → `S = 105500`, `k = 110000/105500 ≈ 1.04265`
- Ideals: `76635.07…, 21895.73…, 11469.19…`
- Floors: `76635 + 21895 + 11469 = 109999` → `D = 1`
- Largest remainder `.73…` → +1 to the second row
- **Final: ₹76,635 + ₹21,896 + ₹11,469 = ₹1,10,000 exactly**,
  shares ≈ 69.67 / 19.91 / 10.43 % — proportional to value, not equal thirds
  (equal split of the ₹4,500 gap would wrongly give +₹1,500 to every row).

## Rules & edge cases

1. Only rows with a **positive numeric** Floor Price take part; blank /
   non-numeric cells are left untouched and excluded from `S`.
2. If `T ≤ 0`, `S ≤ 0`, or there are no scalable rows, no adjustment happens
   (rows keep the plain per-row hiked value) — never divide by zero.
3. The scale factor `k` can be `< 1` (rounding pushed the sum over `F`) or
   `> 1`; the method is identical either way.
4. Applies to **both** manifest paths: the b4traders manifest file
   (`manifest_url`) and the inventory-API fallback sheet.
5. Frontend display (`formatMoney`), bid minimum (`F + ₹1,000`) and the
   manifest total all tie to the same `F`, so they can never disagree.
6. Implemented in `server/index.js`: `hikePercentFor`, `ceilTo1000`,
   `adjustProportionallyTo`, used by `buildManifestExcel`
   (covers both the download and the email-manifest endpoints).
   `ceilTo1000` carries a 1e-9 tolerance against float dust
   (`100000 × 1.1` computing as `110000.00000000001` must stay ₹1,10,000);
   the same tolerance was applied to the frontend `applyPriceHike` so the
   displayed floor price always equals the manifest total.

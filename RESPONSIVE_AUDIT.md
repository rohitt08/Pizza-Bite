# Responsive Layout Audit

## Scope and test method

Checked the local Vite application in the integrated browser at CSS viewport widths 320, 360, 375, 390, 414, 430, 768, 1024, and 1440 px. The browser emulator reports DPR 0.8, so viewport dimensions were scaled when setting device pixels to achieve the requested CSS widths. Also checked short landscape layouts at 320x320 CSS px. These are browser-emulated viewport checks, not physical iPhone or Android device tests.

## Confirmed issues fixed

- Customer details modal was taller than a 320x568 viewport and vertically centered with its top at -47 px, clipping the header. It now starts at the safe-area top on small screens and the overlay itself scrolls; the submit action is reachable after scrolling.
- Review, receipt, menu poster, and admin delete dialogs now use safe-area-aware overlay padding, internal/overlay scrolling, and dynamic viewport height limits where appropriate.
- Customer sticky header and staff header account for top safe-area inset; the fixed cart bar and cart footer account for bottom safe-area inset.
- Removed `user-scalable=no` and maximum-scale restriction so users can pinch-zoom for accessibility.
- Raised primary customer controls and quantity controls to minimum 44 px mobile touch targets; close, edit, category, payment, and checkout controls are also touch sized.
- Responsive page-shell minimum heights use `100dvh` with `min-h-screen` fallback. The document is clipped to its viewport horizontally; category chips retain their intended independent horizontal scrolling.

## Measured results

| View | Widths / orientation | Result |
|---|---|---|
| Customer menu | 320, 360, 375, 390, 414, 430, 768, 1024, 1440 px | No document-level horizontal overflow. Buttons/inputs met 44 px minimum in the final measured matrix. Category strip scrolls internally by design. |
| Staff PIN gate (`/u804`) | Same nine widths | No document-level horizontal overflow, controls outside the viewport, or controls below 44 px in the measured matrix. |
| Customer details modal | 320x568 portrait | Modal starts inside the viewport; overlay scrolls; Continue action is reachable at the bottom. |
| Cart drawer | 320x320 short landscape | Drawer, cart row, and footer actions fit without page overflow; touch targets at least 44 px. |
| Order review | 320x320 short landscape; 320, 360, 375, 390, 414, 430, 768, 1024, 1440 px width matrix | Overlay stays within viewport and scrolls when needed; payment and submit controls remain within the overlay and 44 px minimum. |
| Unknown physical-device safe areas | Not available | CSS `env(safe-area-inset-*)` handling was added, but hardware notch/home-indicator rendering was not physically verified. |

## Remaining limitations

- No physical iPhone, Android, tablet, portrait/landscape rotation sensor, or Safari/Chrome device lab was available. Browser viewport tests do not establish universal compatibility.
- Full authenticated POS dashboard screens could not be tested because the configured Supabase project currently reports anonymous sign-ins disabled; only the staff login gate was inspected.
- No payment/order submit was performed during responsive testing, to avoid writing test orders to a database.

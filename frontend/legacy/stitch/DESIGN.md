# Design System Specification: The Vigilant Editorial

## 1. Overview & Creative North Star: "The Authoritative Guardian"
The objective of this design system is to transform a "Smart Parking Violation System" from a cold, bureaucratic utility into a high-end, authoritative experience. We move beyond standard administrative dashboards toward a style we call **"The Authoritative Guardian."**

Our Creative North Star balances the gravitas of a legal institution with the fluid, high-tech responsiveness of modern telemetry. We break the "template" look by eschewing rigid borders in favor of **Tonal Architecture**. By using intentional asymmetry in layout and overlapping editorial-scale typography, we create an interface that feels both urgent and impeccably organized. It is not just a tool; it is a premium digital record.

---

### 2. Colors & Surface Architecture
The palette is rooted in "Trustworthy Deep Blues," but executed through a sophisticated layered approach. We use tonal depth rather than lines to define the canvas.

#### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` component should sit on a `surface` background to create a "soft edge."

#### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Each inner container uses a slightly different tier to define its importance:
*   **Base Layer:** `surface` (#f3faff) for the main application background.
*   **Sectioning:** `surface-container-low` (#e6f6ff) to group secondary information.
*   **Hero/Action Cards:** `surface-container-lowest` (#ffffff) to make critical violation data "pop" forward.

#### The "Glass & Gradient" Rule
To elevate the system above "generic" status, floating elements (like violation overlays or status bars) must use **Glassmorphism**. 
*   **Execution:** Apply semi-transparent `surface` colors with a `backdrop-filter: blur(12px)`.
*   **Signature Textures:** Use subtle linear gradients for primary actions, transitioning from `primary` (#001e42) to `primary-container` (#003368). This provides a "visual soul" and depth that a flat color cannot achieve.

---

### 3. Typography: Editorial Utility
We utilize **Inter** for its neutral, high-legibility characteristics, but we apply it with an editorial hierarchy to ensure urgency is conveyed without clutter.

*   **Display Scale (`display-lg` to `display-sm`):** Reserved for high-impact numbers (e.g., total fine amounts or active violation counts). These should feel massive and indisputable.
*   **Headline Scale (`headline-lg` to `headline-sm`):** Used for section titles. Implement these with tight letter-spacing (-0.02em) to create an authoritative, "newspaper-header" feel.
*   **Body Scale (`body-lg` to `body-sm`):** Optimized for long-form violation descriptions and legal fine print. Use `on-surface-variant` (#43474f) to reduce eye strain against the high-contrast background.
*   **Label Scale (`label-md` to `label-sm`):** Used for metadata like "License Plate" or "Timestamp." These must always be uppercase with a +0.05em letter-spacing for quick scanning in field conditions.

---

### 4. Elevation & Depth: Tonal Layering
We reject the heavy-handed shadows of the early web. Our depth is environmental.

*   **The Layering Principle:** Depth is achieved by "stacking" the surface-container tiers. Place a `surface-container-lowest` card on a `surface-container-low` background to create a natural lift.
*   **Ambient Shadows:** When a floating modal is required, shadows must be extra-diffused. 
    *   *Value:* `0px 20px 40px rgba(7, 30, 39, 0.06)`. 
    *   *Shadow Color:* Use a tinted version of `on-surface` (#071e27) to mimic natural ambient light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, it must be a "Ghost Border": use `outline-variant` (#c3c6d1) at **15% opacity**. Never use 100% opaque borders.

---

### 5. Components
Each component must feel like a custom-machined tool.

*   **Buttons:**
    *   **Primary:** A gradient of `primary` to `primary-container`. High contrast white text (`on-primary`). 
    *   **Alert (Violation):** Use `secondary` (#964900) for warnings and `tertiary` (#460003) for urgent fines.
    *   **Shape:** Use `md` (0.375rem) roundedness for a disciplined, professional look. Avoid the "playfulness" of full-pill buttons.
*   **Violation Cards:** Forbid divider lines. Use vertical white space and `surface-container-highest` headers to separate license plate data from the fine description.
*   **Input Fields:** Use `surface-container-low` for the fill. Upon focus, shift the background to `surface-container-lowest` and apply a 1px "Ghost Border" of `primary`.
*   **Status Chips:** 
    *   *Warning:* `secondary-container` background with `on-secondary-container` text.
    *   *Urgent:* `error-container` background with `on-error-container` text.
*   **Interactive Maps:** The map interface should be treated as a background texture, with UI controls using the "Glassmorphism" rule to feel integrated into the environment.

---

### 6. Do's and Don'ts

#### Do
*   **Do** use asymmetrical spacing to draw the eye to critical violation data.
*   **Do** prioritize `primary-fixed` (#d6e3ff) backgrounds for active selection states to ensure high visibility in sunlight.
*   **Do** use `headline-lg` for "Fine Amount" to ensure there is no ambiguity for the user.

#### Don't
*   **Don't** use black (#000000) for text. Always use `on-surface` (#071e27) to maintain a premium, deep-blue tonal consistency.
*   **Don't** use standard "Drop Shadows" on buttons. Let the color contrast and the "Ghost Border" do the work.
*   **Don't** use dividers. If two pieces of information need to be separated, use an 8px or 16px vertical gap from the spacing scale or a subtle background color shift.
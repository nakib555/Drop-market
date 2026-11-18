# Kinto Studio — Premium Mobile Footer Redesign Prompt

## Role

Act as a senior mobile UX/UI designer, e-commerce product designer, and experienced front-end engineer. Redesign and implement the **mobile footer only** for Kinto Studio, a premium multi-category e-commerce marketplace.

Use the two supplied screenshots as the source of truth for the existing footer's content, brand direction, and current problems. Preserve the recognizable Kinto Studio identity while substantially improving mobile layout, hierarchy, usability, responsiveness, and visual polish.

This is an implementation task, not just a visual concept. Inspect the existing project and make the footer fully functional using the project's current framework, components, styling conventions, routing, state management, and design tokens.

---

# 1. Design direction

Create a premium, minimalist, editorial-style mobile footer.

### Preserve the existing brand identity
- Warm off-white / ivory background.
- Near-black typography and controls.
- Muted warm-grey secondary text.
- Subtle light-grey dividers and borders.
- Existing KINTO STUDIO wordmark and elegant typographic character.
- Generous but controlled whitespace.
- Restrained, refined details rather than decorative clutter.

Do not replace the existing visual identity with a generic dark marketplace footer, bright gradients, excessive colours, oversized icons, or card-heavy UI.

### Desired impression
The footer should feel:
- Premium and established.
- Calm, refined, and editorial.
- Easy to scan with one hand.
- Compact without feeling cramped.
- Consistent with the rest of Kinto Studio.
- Designed intentionally for narrow mobile screens, not merely a desktop footer stacked vertically.

Use the existing brand fonts and design tokens if available. Do not introduce a new font without a clear reason.

---

# 2. Required mobile footer structure

Reorganize the footer into the following sequence.

## Section A — Brand introduction

At the top of the footer:
- Display the existing KINTO STUDIO wordmark.
- Preserve its elegant typography and proportions.
- Add the tagline: "Your trusted shopping destination."
- Keep the brand introduction concise.
- Use a subtle divider to separate it from the newsletter.

Do not add an invented company address, registration number, or unsupported brand claim.

## Section B — Newsletter subscription

Heading: **Newsletter Updates** or **Stay Connected**

Supporting text:
"Get updates on new arrivals, exclusive offers and more."

Include:
- Email input with a clear placeholder: "Enter your email address".
- A prominent Subscribe button.
- A right-arrow icon as a restrained visual detail.
- Proper input labels and accessible form semantics.
- Email-format validation.
- Loading, success, and error states.
- Duplicate-subscription handling if supported by the backend.
- A clear privacy-policy link near the subscription explanation where appropriate.

### Mobile interaction
- At normal phone widths, use a full-width input and full-width button stacked vertically if that matches the existing design.
- Keep consistent input/button heights, corner radii, and spacing.
- Avoid an excessively tall newsletter block.
- Do not show a fake success message: connect to the real newsletter service/API if available.
- If no backend exists, clearly identify the integration requirement and do not pretend that subscriptions are saved.

## Section C — Social media

Add a compact social section:
- Label: "Follow Kinto Studio" or "Follow Us".
- Display only the social platforms that have verified official URLs configured by the business.
- Use consistent, recognizable icons.
- Provide accessible names and keyboard focus states.
- Open external destinations safely.
- Do not invent social profiles or use dead links.

Keep this section visually quiet and compact. It may sit below the newsletter or share a row with another suitable element when space allows.

## Section D — Expandable navigation groups

Replace the current long, vertically spaced link lists with four clean accordion groups.

### 1. Customer Service
- Contact Us
- Help Center
- Track Order
- Returns & Refunds

### 2. Shopping
- All Categories
- New Arrivals
- Offers
- Featured Brands

### 3. Policies & Legal
- Policies & Help Center
- Terms & Conditions
- Privacy Policy
- Cookie Policy
- Shipping Policy
- Return Policy

### 4. For Sellers
- Become a Seller
- Seller Agreement
- Seller Policies
- Seller Support

### Accordion requirements
- Each group has a clear, semibold heading.
- Use a simple plus/minus or chevron indicator.
- Animate expansion and collapse subtly.
- Keep animation short and smooth.
- Respect `prefers-reduced-motion`.
- Make the entire heading row tappable.
- Use a minimum touch target of approximately 44 × 44 CSS pixels.
- Expose correct expanded/collapsed state to assistive technology.
- Support keyboard operation.
- Avoid nested interactive elements.
- Use one consistent accordion pattern for all groups.
- Ensure expanded content has comfortable link spacing.
- Use a subtle divider between groups.
- Avoid excessive vertical gaps between links.

### Default accordion state
On small mobile screens, keep all groups collapsed by default to make the footer compact. If the existing application has a well-established accordion convention, follow it consistently.

Choose whether multiple groups may remain open based on usability and the existing architecture. Do not unexpectedly close a group while a customer is following a link.

Do not remove any existing useful destination from the supplied footer. If a destination does not exist, identify it for implementation rather than creating a dead link.

## Section E — Shopping preferences

Create a clearly separated, compact preferences area.

Include:
- Language selector.
- Currency selector.
- Cookie Preferences control.

### Language selector
- Use the actual languages supported by the application.
- Display the currently selected language.
- Open an accessible native or custom selector.
- Persist the selection using the existing preference mechanism.
- Do not show languages that are not implemented.

### Currency selector
- Preserve Kinto Studio's existing USD/BDT currency configuration.
- Display the active currency and symbol clearly.
- Use the actual currency conversion and pricing logic already implemented.
- Persist the selection using the application's existing state/storage approach.
- Do not imply that changing the display currency necessarily changes the settlement currency.
- Ensure the selected currency remains consistent with product prices, cart, checkout, and order totals.

### Cookie preferences
- Open the real cookie preference interface.
- Show the current consent state.
- Allow users to update optional cookie preferences as supported by applicable law.
- Ensure the preference actually controls relevant optional tracking scripts.
- Never make the control decorative or non-functional.

## Section F — Payment methods and trust

Add a subtle payment-method row near the bottom.

Potential payment methods include:
- Visa.
- Mastercard.
- bKash.
- Nagad.
- Other payment providers genuinely enabled in checkout.

Important:
- Render only active, verified payment methods.
- Reuse approved brand assets or official logos where available.
- Do not use text labels as a substitute for logos if proper assets already exist.
- Do not imply that a payment method is available unless checkout actually supports it.
- Keep logo sizes and spacing consistent.
- Do not make unsupported security or certification claims.

If payment methods are not appropriate to display on the footer, omit this section rather than showing inaccurate information.

## Section G — Copyright and legal bottom bar

Finish with:
- A subtle divider or slightly differentiated warm-neutral background.
- Dynamic copyright year.
- Text: "© [YEAR] Kinto Studio. All rights reserved."
- Compact links to Privacy, Terms, and Cookies.
- Links must resolve to the actual policy routes.

Keep this area legible and uncluttered. On narrow screens, allow legal links to wrap naturally without overflow.

---

# 3. Back-to-top button

The supplied screenshots show a floating back-to-top button. Improve its behaviour.

Requirements:
- Use a small, refined square or softly rounded button.
- Use a clear upward-arrow icon.
- Show it only after the user has scrolled beyond a sensible threshold.
- Animate its appearance and disappearance subtly.
- On activation, smoothly scroll to the page top.
- Respect reduced-motion preferences.
- Include an accessible label such as "Back to top".
- Ensure it never covers footer links, newsletter controls, selectors, or legal content.
- Respect mobile safe-area insets.
- If a fixed floating control cannot be positioned safely, place it in a non-obstructive footer location instead.

---

# 4. Mobile layout and responsive behaviour

Design specifically for narrow mobile viewports.

Test at minimum:
- 320 px width.
- 360 px width.
- 375 px width.
- 390 px width.
- 414 px width.
- 430 px width.
- Common tablet widths.

Requirements:
- No horizontal scrolling or overflow.
- No clipped text or icons.
- No overlapping controls.
- No excessively large vertical gaps.
- No tiny tap targets.
- No fixed-width desktop columns carried over to mobile.
- Use responsive side padding consistent with the rest of the mobile application.
- Keep content aligned to a consistent left edge.
- Use fluid sizing where appropriate.
- Ensure long labels wrap naturally.
- Ensure selectors and input fields fit the viewport.
- Support safe-area insets on devices with display cutouts and gesture navigation.
- Avoid layout shifts when accordion content opens.
- Ensure the footer remains usable at browser zoom and larger text settings.

Do not simply shrink the desktop footer. Use a deliberately mobile-first information hierarchy.

---

# 5. Suggested visual specifications

Treat these as starting points and align them with the existing design tokens.

| Element | Suggested treatment |
|---|---|
| Background | Warm ivory / off-white |
| Main text | Near black |
| Secondary text | Warm medium grey |
| Dividers | Subtle warm grey |
| Wordmark | Existing Kinto Studio brand typography |
| Section headings | 16–18 px, semibold |
| Link text | 14–16 px |
| Supporting text | 13–15 px |
| Main side padding | 20–24 px |
| Accordion row height | At least 52 px |
| Input height | Approximately 52–56 px |
| Subscribe button height | Approximately 52–56 px |
| Control radius | Consistent, restrained rounded corners |
| Section spacing | Consistent and purposeful |

Do not blindly apply these values if they conflict with the existing design system. Use visual judgment and preserve established tokens.

---

# 6. Functional requirements

Every visible control must work.

- Newsletter form submits to the real configured service.
- Email validation provides understandable feedback.
- Social icons open verified official destinations.
- Accordion groups expand and collapse.
- Every footer link opens its correct route.
- Language selection changes the actual application language where supported.
- Currency selection updates the actual currency display consistently.
- Cookie Preferences opens the real consent-management interface.
- Back-to-top scrolls to the page top.
- Copyright year updates automatically.
- Payment logos reflect enabled checkout methods.
- Focus and active states are visible.
- No placeholder `href="#"` links.
- No inert buttons.
- No fake interactions or success messages.
- Avoid full-page reloads for interactions where the existing architecture supports client-side navigation.

Use the application's existing routing and state management. Avoid duplicating global preference logic inside the footer.

---

# 7. Accessibility and performance

- Use semantic footer and navigation landmarks.
- Use correctly structured headings.
- Provide meaningful accessible labels.
- Ensure keyboard navigation works.
- Maintain visible focus indicators.
- Use adequate colour contrast.
- Use accessible accordion state attributes.
- Ensure form errors are announced to screen readers.
- Do not communicate status through colour alone.
- Respect reduced-motion settings.
- Avoid unnecessary animation libraries.
- Avoid large images and unnecessary network requests.
- Prevent content shift during expansion.
- Keep the footer lightweight and performant.

---

# 8. Implementation constraints

Before implementation:

1. Inspect the current mobile footer and its components.
2. Identify the existing framework and styling approach.
3. Find the actual footer routes and link destinations.
4. Inspect existing language and currency selectors.
5. Identify the newsletter backend or integration.
6. Identify the cookie-consent system.
7. Verify the actual social links and payment methods.
8. Preserve desktop footer behaviour and styling.

Do not rebuild or alter the desktop footer unless a shared component change is necessary. Scope changes carefully to mobile breakpoints.

Avoid:
- Duplicating footer markup unnecessarily.
- Breaking desktop layouts.
- Replacing existing working routes.
- Introducing a second language/currency preference system.
- Hardcoding values already available from configuration.
- Inventing official social profiles or payment integrations.
- Adding decorative elements that do not improve usability.

---

# 9. Quality assurance

After implementation, test:

### Visual
- Compare the mobile result with the supplied screenshots.
- Verify typography, spacing, alignment, hierarchy, and visual consistency.
- Confirm the footer looks intentionally designed at all specified widths.

### Interaction
- Test all four accordion groups.
- Test newsletter validation and submission.
- Test social destinations.
- Test all footer navigation links.
- Test language and currency selection.
- Test cookie preferences.
- Test back-to-top behaviour.

### Regression
- Confirm the desktop footer remains unchanged.
- Confirm global navigation still works.
- Confirm product, cart, checkout, account, and seller pages are unaffected.
- Confirm no shared component has broken other layouts.

### Accessibility
- Test keyboard-only interaction.
- Check screen-reader labels and accordion states.
- Check colour contrast and focus visibility.
- Check larger text and reduced-motion behaviour.

Fix all implementation defects before reporting completion.

---

# 10. Expected result

Deliver a refined, compact, premium mobile footer with this information hierarchy:

1. Kinto Studio brand and tagline.
2. Newsletter subscription.
3. Social media links.
4. Four expandable navigation groups.
5. Language, currency, and cookie preferences.
6. Verified payment-method logos, if applicable.
7. Copyright and compact legal links.
8. A non-obstructive back-to-top control.

The finished result should retain the warm minimalist identity shown in the supplied screenshots while feeling significantly more polished, organized, responsive, and convenient to use.

At completion, report:
- Components modified or created.
- Responsive breakpoints tested.
- Functional integrations verified.
- Routes and links verified.
- Accessibility checks performed.
- Any missing backend integrations or business information.
- Confirmation that desktop behaviour was preserved.

**Final quality standard:** A premium, mobile-first footer that feels native to Kinto Studio—not a compressed desktop footer, not a generic template, and not merely a static mockup.

# Kinto Studio --- Premium UX/UI, Layout, Content Architecture & Motion Redesign Brief

## Role and mission

Act as a senior product designer, UX architect, visual design director,
motion designer, accessibility specialist, and senior front-end
engineer. You are improving **Kinto Studio**, a Bangladesh-focused
multi-category e-commerce marketplace.

Your task is to perform a complete, evidence-led audit and refinement of
the existing website, using the current implementation as the starting
point. Deliver a cohesive, production-quality experience that feels like
a carefully art-directed premium commerce product---not a generic
template, an AI-generated dashboard, or a collection of disconnected
components.

This is a **refinement and structural redesign**, not permission to
discard the product, rewrite business rules, invent features, or replace
working functionality. First understand the current codebase, routes,
components, data model, and responsive behavior. Then improve them
systematically.

The supplied mobile screen recording is the visual reference for the
problems to address. It shows, among other areas:

-   Home page and global navigation
-   Navigation drawer and department links
-   Sign-in and customer/seller account registration
-   Customer account overview
-   Personal information
-   Address book and add-address form
-   Order history, wishlist, payment methods, returns, support, and
    account security
-   Legal Center and long-form policy pages
-   Footer and bottom-of-page content

The recording is a mobile view. Treat mobile as a first-class
experience, while also making desktop and tablet layouts intentional and
polished.

------------------------------------------------------------------------

# 1. Non-negotiable design goals

1.  **Professional, premium, calm, and trustworthy.** The interface
    should feel like a mature commerce brand with a consistent design
    language.
2.  **Human-written content.** Remove robotic, placeholder-like, overly
    generic, repetitive, or awkward UI wording. Avoid text that sounds
    like code, configuration, or an AI-generated template.
3.  **Strong hierarchy.** A user should immediately understand where
    they are, what the page is for, what matters most, and what to do
    next.
4.  **Organized bottom content.** Footer, secondary links, policy links,
    newsletter, support information, legal navigation, and copyright
    must have a deliberate structure. They must not look like an
    unformatted list appended to the end.
5.  **Purposeful motion.** Transitions should explain state changes and
    navigation. No random animation, excessive movement, or animation
    for decoration alone.
6.  **Responsive by design.** Do not simply shrink desktop layouts.
    Recompose the information architecture for mobile.
7.  **Accessibility and usability.** Keyboard access, visible focus,
    readable contrast, proper labels, touch targets, reduced-motion
    support, and semantic structure are required.
8.  **Preserve working functionality.** Existing authentication, account
    roles, forms, validation, address handling, legal-document
    switching, links, cart, wishlist, order and support flows must
    continue to work.
9.  **Consistent implementation.** Shared elements must use shared
    components, design tokens, and predictable responsive rules.
10. **No fake premium effects.** Avoid excessive glassmorphism,
    gradients, giant rounded cards, glowing borders, unnecessary
    shadows, decorative pills, and oversized typography. Premium design
    comes from proportion, typography, spacing, restraint, alignment,
    content quality, and interaction detail.

## Desired design direction

Use a refined editorial-commerce aesthetic:

-   Warm white or very light neutral page surfaces.
-   Near-black or deep charcoal for primary text and important actions.
-   Restrained warm accent color, used consistently for emphasis and
    interaction.
-   Soft neutral borders and subtle surface separation.
-   Elegant serif typography for selected editorial headings, paired
    with a highly legible sans-serif for interface text.
-   A disciplined type scale and line-height system.
-   Moderate corner radii; use a small number of consistent radius
    tokens.
-   Subtle shadows only where elevation communicates hierarchy.
-   High-quality product and lifestyle imagery with consistent aspect
    ratios and intentional cropping.
-   Comfortable whitespace without wasting the mobile viewport.

Do not force a luxury-fashion aesthetic onto every utility screen.
Account, checkout, forms, support, and legal pages must remain practical
and highly legible.

------------------------------------------------------------------------

# 2. Begin with a full audit before editing

Do not immediately start changing CSS. Inspect the entire project first.

### 2.1 Codebase and behavior inventory

Identify:

-   Framework, build tooling, routing, styling approach, and component
    conventions.
-   Global header, announcement bar, navigation drawer, footer, account
    shell, forms, tabs, cards, buttons, dropdowns, alerts, and
    empty-state components.
-   All routes and page templates visible in the recording.
-   Existing responsive breakpoints and mobile-specific rules.
-   Existing animation libraries or CSS transitions.
-   Form validation, authentication state, account role logic, and data
    persistence.
-   Legal document data structure and document-switching behavior.
-   Shared layout wrappers and duplicated markup.
-   Any inconsistent or conflicting CSS selectors.
-   Any components with fixed heights, hard-coded widths, overflow
    clipping, or fragile positioning.

Create a short internal implementation map before editing. Do not remove
or replace a working feature merely because its current UI is
unattractive.

### 2.2 Visual audit checklist

Review every relevant page at mobile, tablet, and desktop sizes. Record:

-   What is visually dominant and whether that is appropriate.
-   Whether the page title and supporting description are easy to find.
-   Whether sections follow a logical reading order.
-   Whether cards, forms, and navigation align consistently.
-   Whether content is unnecessarily repeated.
-   Whether horizontal scrolling is obvious and usable.
-   Whether sticky elements cover content or occupy too much space.
-   Whether empty states explain what happened and what the user can do.
-   Whether footer content is grouped and readable.
-   Whether animations feel intentional and complete.
-   Whether any dropdown, modal, drawer, toast, or sticky element
    behaves incorrectly.

Do not confuse orange touch indicators or screen-recording overlays with
website UI. Diagnose the actual interface beneath them.

------------------------------------------------------------------------

# 3. Establish a real design system

Create or consolidate design tokens instead of adding isolated CSS
values page by page.

### 3.1 Color tokens

Define semantic tokens, not arbitrary colors scattered throughout the
project:

-   `--color-page`
-   `--color-surface`
-   `--color-surface-muted`
-   `--color-text-primary`
-   `--color-text-secondary`
-   `--color-text-muted`
-   `--color-border`
-   `--color-border-strong`
-   `--color-brand`
-   `--color-brand-hover`
-   `--color-brand-soft`
-   `--color-success`
-   `--color-warning`
-   `--color-danger`
-   `--color-focus`

Use the brand accent sparingly. Primary buttons, active states, links,
and small indicators should share a coherent color logic. Do not make
every card, label, icon, or heading a different accent color.

Check all foreground/background combinations for WCAG AA contrast
wherever practical.

### 3.2 Typography

Build a clear typographic hierarchy:

-   Display/hero heading
-   Page title
-   Section heading
-   Card heading
-   Body text
-   Supporting text
-   Eyebrow/overline
-   Label
-   Metadata
-   Legal document body
-   Button text

Guidelines:

-   Use no more than two complementary type families unless the existing
    brand system requires otherwise.
-   Use a restrained serif for editorial moments, not for every small
    heading or form label.
-   Use a readable sans-serif for forms, navigation, metadata, and dense
    content.
-   Use appropriate Bengali glyph support and test Bengali names,
    addresses, and mixed Bengali-English content.
-   Avoid tiny uppercase labels with excessive letter spacing.
-   Do not use monospace or code-like typography for ordinary interface
    copy.
-   Keep paragraph line length comfortable. On desktop, constrain long
    reading content.
-   Use fluid type only where it improves the layout; avoid oversized
    mobile headings.

### 3.3 Spacing, sizing, and elevation

Define a spacing scale and use it consistently. For example, use a
compact 4/8-point rhythm with named tokens for page gutters, section
gaps, card padding, and form spacing.

Define:

-   Mobile and desktop page gutters.
-   Standard content max-widths.
-   Card padding by size.
-   Form control heights.
-   Button heights and horizontal padding.
-   Border widths.
-   Radius scale.
-   Shadow/elevation scale.
-   Icon sizes.
-   Touch-target minimums.

Do not make every container a card. Use page background, section
spacing, dividers, and typography to create hierarchy. Cards should
represent a meaningful grouping.

### 3.4 Component consistency

Build or refine shared components for:

-   Global header
-   Announcement/promotion strip
-   Desktop navigation
-   Mobile navigation drawer
-   Breadcrumbs
-   Page heading
-   Section heading
-   Account navigation
-   Account summary card
-   Form field and validation message
-   Primary, secondary, tertiary, and destructive buttons
-   Empty state
-   Loading state
-   Error/success feedback
-   Modal/dialog
-   Dropdown/select
-   Footer groups
-   Legal document navigation
-   Back-to-top control

Do not create a separate visual style for the same component on every
page.

------------------------------------------------------------------------

# 4. Global header and navigation redesign

The recording shows a compact header containing a menu icon, Kinto
Studio wordmark, search, language/account controls, and cart. The
announcement strip above it consumes valuable vertical space on mobile.

### 4.1 Announcement strip

-   Make it visually quiet, short, and useful.
-   Use concise, natural copy. Do not let it dominate the page.
-   Ensure text does not clip or become unreadable at narrow widths.
-   Provide a clear close/dismiss control if dismissal is part of the
    existing behavior.
-   Avoid an unnecessarily tall fixed banner.
-   If it is sticky, ensure it does not stack with the header into an
    oversized permanent obstruction.
-   Respect safe areas and browser viewport changes.

### 4.2 Header

-   Establish a clean alignment grid.
-   Keep the brand mark visually distinct and correctly proportioned.
-   Use consistent icon stroke weight and icon dimensions.
-   Make search easy to discover and use.
-   Keep account/language controls compact but understandable.
-   Show a cart count only when meaningful.
-   Avoid crowding the header with several tiny controls.
-   On mobile, prioritize the most important actions and move secondary
    actions into a well-organized menu.
-   On desktop, use the established three-tier marketplace structure
    where appropriate: utility/announcement, main brand-search-actions
    row, and department navigation. Preserve the prominent search and
    category navigation.

### 4.3 Navigation drawer

The drawer in the recording feels like a long, dense list. Reorganize it
into clear groups:

1.  Main destinations: Home, Shop All Products, New Arrivals, Best
    Sellers, Special Offers.
2.  Departments: expandable/collapsible department groups.
3.  Account and shopping tools: account, wishlist, cart, order tracking.
4.  Customer care: shipping, returns, warranty, contact, FAQ.
5.  Preferences: language, currency, theme, where applicable.

Requirements:

-   Use clear group headings and consistent indentation.
-   Show expansion state and active location.
-   Do not display every department and every support link as one
    undifferentiated list.
-   Make the drawer scrollable independently when necessary.
-   Keep the close control visible and easy to tap.
-   Prevent background scrolling while the drawer is open.
-   Close on Escape and appropriate outside interaction.
-   Animate open/close with a restrained slide and fade.
-   Avoid an enormous full-screen overlay of tightly packed text.
-   Preserve all existing routes and links.

------------------------------------------------------------------------

# 5. Account area: fix the information architecture

This is one of the most important parts of the recording. The account
area currently repeats the profile identity and sign-out controls across
screens, uses a horizontally scrolling tab strip with clipped labels,
and then presents a long account-sections list. The result feels
fragmented and makes it difficult to understand where the user is.

Redesign the account area as one coherent account workspace.

### 5.1 Account shell

Create a consistent structure:

-   Breadcrumb: Home / My Account / Current section.
-   A compact account identity block.
-   One clear page title for the current section.
-   A persistent, understandable account navigation system.
-   Main content area.
-   Contextual actions placed beside the relevant title or section.

Do not repeat the same full profile card, email, and sign-out button on
every subpage. Keep identity information in a compact account header or
account sidebar. Place sign-out in a predictable account menu or account
settings area.

### 5.2 Mobile account navigation

The current horizontal tabs are clipped and show partial labels. Fix
this.

Preferred approach:

-   Use a compact, horizontally scrollable navigation row only if all
    labels remain readable and the active item can be brought into view.
-   Use clear short labels with icons only where icons genuinely improve
    recognition.
-   Provide a subtle scroll affordance when more tabs exist.
-   Do not cut labels in half or let a tab overlap the content.
-   Consider a "More" menu or grouped section selector when there are
    too many destinations.
-   Make the active tab visually clear without using an oversized dark
    pill for every item.
-   Keep navigation separate from the content card.
-   Ensure keyboard and screen-reader users can identify the active
    destination.

For desktop, use a stable sidebar or well-structured account navigation
column with the content area beside it. Do not stretch mobile tab
patterns across desktop.

### 5.3 Account overview

The overview currently uses three large statistic cards: total orders,
saved wishlist, and account role. Improve it:

-   Present the most useful account information first.
-   Use compact, aligned summary tiles or a clear summary row.
-   Avoid giant empty cards for values of zero.
-   Make each metric clickable only if the destination is meaningful.
-   Show useful next actions such as "Browse products," "Add a delivery
    address," or "View account details."
-   Add a recent-activity area only if real data exists.
-   Never invent order counts, review data, or account activity.
-   Make the zero-order state helpful rather than visually empty.

### 5.4 Account section directory

The current "Account Sections" list is lengthy and repetitive.
Reorganize it into clear groups:

**Shopping** - Orders - Wishlist - Addresses - Payment methods - Returns

**Account** - Personal information - Account security

**Help** - Customer support

Each row should contain:

-   A concise title.
-   One short explanation.
-   A consistent icon.
-   A clear navigation affordance.
-   A useful status only when real data supports it.

Avoid nested boxes inside boxes. Use a single section container with
well-spaced rows and subtle separators, or a carefully designed list of
grouped cards. Do not repeat the same information in both the overview
and directory without a reason.

------------------------------------------------------------------------

# 6. Individual account pages

Make every page feel like part of the same account workspace, not a
separate mini-website.

## 6.1 Personal information

-   Use a clear title and one-sentence explanation.
-   Group personal details logically.
-   Use consistent field widths and label placement.
-   Show required/optional status clearly.
-   Do not rely on placeholder text as the only field label.
-   Make the save action easy to find.
-   Provide inline validation near the relevant field.
-   Show a clear success confirmation after a successful save.
-   Preserve current values and backend behavior.
-   Do not display editable fields as though they were static text.

## 6.2 Address book

The recording shows an address list and a long add-address form with
country, division, district, city/upazila, area/neighborhood, street,
and postal code.

Improve it as follows:

-   Give the address book a clear title, supporting description, and
    prominent "Add address" action.
-   Present saved addresses as clean, readable address cards.
-   Distinguish default address from other addresses using a small,
    clear label.
-   Place Edit, Set as default, and Remove actions in a consistent
    location.
-   Confirm destructive removal.
-   Do not make users guess which address is active.
-   Keep the form in a dedicated page, modal, or clearly separated panel
    based on the existing architecture.
-   Group location fields logically.
-   Use dependent selects where the underlying data supports them.
-   Make selected values visible and stable.
-   Do not rely on a native select that opens an oversized or visually
    inconsistent overlay if a custom accessible control is already
    available.
-   Ensure dropdown menus are not clipped by parent containers.
-   Use a clear country-specific field order for Bangladesh.
-   Mark Street/House/Road and other genuinely required fields
    correctly.
-   Explain postal-code format where useful.
-   Keep the Save Address action visible and easy to reach.
-   On mobile, avoid unnecessary multi-column fields.
-   Preserve existing address data and validation rules.

## 6.3 Order history

The current empty state is isolated and leaves much of the screen
visually vacant.

-   Use a consistent page heading.
-   If orders exist, display a well-structured order list with order
    number, date, status, total, and a clear action.
-   Use status indicators with restrained semantic colors.
-   Provide order details and tracking actions only where supported.
-   If no orders exist, use a compact empty-state illustration or icon,
    a clear heading, a natural explanation, and one strong "Browse
    products" action.
-   Do not use an oversized blank panel just to center a tiny icon.
-   Do not fabricate sample orders.

## 6.4 Wishlist

-   Use a clear title and item count.
-   If items exist, show a responsive product grid with consistent image
    ratios and product information.
-   Keep remove and product-view actions understandable.
-   If empty, explain how to save items and provide an "Explore
    products" action.
-   Do not repeat the same empty-state design mechanically across every
    page.

## 6.5 Payment methods

-   Explain that payment details are securely handled and tokenized only
    if this accurately reflects the actual payment integration.
-   Show saved methods in a clean list with safe masked details only.
-   Never display full card numbers, PINs, CVVs, passwords, or secrets.
-   If no methods exist, explain that a payment method can be added
    where supported, or that payment can be selected at checkout.
-   Avoid claiming support for a payment provider unless it is actually
    integrated.

## 6.6 Returns and refunds

-   Present return eligibility and policy access clearly.
-   If eligible delivered orders exist, show them with the next
    available action.
-   If none exist, explain why the list is empty and link to the return
    policy.
-   Avoid ambiguous status labels.
-   Distinguish policy information from an actual return request.

## 6.7 Customer support

The current support page contains several separate action cards. Improve
the hierarchy:

-   Start with a concise support introduction.
-   Put the most frequently needed action first, such as tracking an
    order, if supported.
-   Group help topics into a small number of clear categories.
-   Use consistent card/row styling.
-   Include realistic response-time language only if the business can
    meet it.
-   Make contact methods actionable.
-   Avoid making every option look equally important.
-   Keep Help & FAQ, grievance/complaint, warranty, and order support
    easy to distinguish.

## 6.8 Account security

-   Use a clear security-focused heading.
-   Group password, sessions, and security options if implemented.
-   Make sensitive actions explicit.
-   Require confirmation for destructive or high-impact actions.
-   Never show passwords or sensitive tokens.
-   Do not invent two-factor authentication or device-management
    functionality if it does not exist.

------------------------------------------------------------------------

# 7. Authentication and registration redesign

The recording shows sign-in and customer/seller registration forms.
These pages are functional-looking but need stronger visual hierarchy,
clearer validation, and better mobile keyboard behavior.

### 7.1 Sign-in

-   Make the title and short supporting text clear.
-   Use a focused form width on desktop and full-width layout with
    proper gutters on mobile.
-   Keep email and password fields consistent.
-   Include a visible password show/hide control with an accessible
    label.
-   Place "Forgot password?" near the password field.
-   Make the primary action prominent.
-   Keep create-account navigation secondary.
-   Avoid excessive vertical gaps.
-   Do not show irrelevant marketing content inside the form.
-   Preserve authentication and error handling.

### 7.2 Registration role selector

Customer Account and Seller Studio should be presented as two clear
choices, not tiny tabs that look like incidental controls.

-   Explain the difference briefly and accurately.
-   Make the selected state obvious.
-   Keep the form fields appropriate to the selected role.
-   Preserve all existing role-specific fields and backend behavior.
-   Avoid resetting entered data unexpectedly when switching roles.

### 7.3 Form fields and validation

-   Use persistent labels above fields.
-   Use consistent field height, radius, border, and spacing.
-   Use appropriate input types and autocomplete attributes.
-   Use correct keyboard types for email, phone, and numeric fields.
-   Validate Bangladesh phone numbers using the actual supported format.
-   Explain the expected format before or near the field when necessary.
-   Do not show a red error before the user has had a reasonable
    opportunity to enter data.
-   Show errors beside the relevant field, not only in a large global
    alert.
-   Preserve values after validation failure.
-   Do not show duplicate errors in several locations.
-   Provide a clear success state after submission.
-   Ensure the mobile keyboard does not hide the active field or primary
    action.
-   Use a sticky action area only if it does not obscure content or the
    keyboard.
-   Ensure checkbox labels are fully clickable and terms/privacy links
    remain accessible.

### 7.4 Browser autofill

The recording shows browser/autofill suggestions covering fields and
buttons. Design the form so it remains usable with autofill:

-   Use semantic labels and correct autocomplete values.
-   Avoid absolute positioning that assumes a fixed keyboard height.
-   Allow the page to scroll to the focused field.
-   Ensure suggestion popups do not break the layout.
-   Keep enough bottom padding for mobile browser controls.
-   Test on a real mobile viewport, not only desktop responsive
    emulation.

------------------------------------------------------------------------

# 8. Legal Center and long-form policy pages

The legal pages are particularly important for trust. In the recording,
the document selector and legal navigation feel cumbersome, while the
legal text is dense and visually undifferentiated.

Do not rewrite legal terms or make legal claims as part of a visual
redesign. Preserve the actual approved policy text and its meaning. Flag
unclear, incomplete, contradictory, or potentially unsupported legal
language for human/legal review instead of silently changing it.

### 8.1 Legal Center information architecture

Create a clear structure:

-   Legal Center title.
-   Short explanation of what the center contains.
-   Effective date and last-updated date where available.
-   Document navigation.
-   Selected document title and metadata.
-   Document content.
-   Related policies or document navigation at the end.

Group the documents into understandable categories, for example:

**Commerce & Logistics** - Payment & Billing Policy - Warranty &
Authenticity Policy

**Marketplace Governance** - Marketplace & Buyer-Seller Platform Terms -
Seller Terms & Partner Agreement - Prohibited & Restricted Items Policy

**Safety & Rights** - Product Safety & Regulatory Disclaimers -
Acceptable Use & Community Content Policy - Intellectual Property &
related policies, where present

Use the exact actual document inventory from the project. Do not invent
missing documents or rename legal instruments in a way that changes
their scope.

### 8.2 Document navigation

The current selector is difficult to use on mobile and can produce a
large, visually intrusive selection overlay.

-   Replace it with a clean, accessible document-navigation pattern.
-   On desktop, consider a left-side document index with the active
    document highlighted and the content on the right.
-   On mobile, use a compact document selector or a dedicated
    collapsible document index.
-   Keep document titles readable and avoid a long, cramped
    native-looking list.
-   Show the active document clearly.
-   Preserve deep links or document selection state if the current
    application supports them.
-   Make it possible to switch documents without losing the user's place
    unnecessarily.
-   Do not let the selector cover the document content or become
    visually dominant.
-   Ensure the control works with keyboard and screen readers.

### 8.3 Legal document typography and layout

-   Constrain reading width.
-   Use a comfortable body font size and line height.
-   Make section headings visibly distinct.
-   Use consistent numbered section styles.
-   Use paragraph spacing rather than excessive blank lines.
-   Format lists, tables, definitions, and subclauses properly.
-   Avoid tiny gray text.
-   Avoid placing all legal content in one giant beige box.
-   Use a subtle document metadata panel if useful.
-   Keep print styles clean and ensure print actions print the selected
    document rather than the entire website.
-   Make "All Policies" or return-to-index navigation clear and
    consistent.

The legal center should feel like a carefully typeset document library,
not a form with a long text field beneath it.

------------------------------------------------------------------------

# 9. Footer and bottom-of-page content --- critical redesign

The footer is one of the weakest areas in the recording. It appears as a
dense two-column block of links with little visual hierarchy, small
text, inconsistent spacing, and a large amount of content presented at
once. This makes the end of the website feel unfinished.

Redesign the entire bottom section as a deliberate information
architecture.

### 9.1 Footer structure

Use a clear hierarchy in this order:

**A. Newsletter / brand invitation** - A concise heading. - One short,
natural sentence explaining the benefit. - Email input and subscribe
action. - Clear success/error feedback. - Do not promise a discount or
frequency unless the business actually offers it.

**B. Main footer navigation** Organize links into distinct groups.
Suggested groups:

1.  **Shop**
    -   Shop All
    -   Electronics
    -   Fashion
    -   Home & Kitchen
    -   Beauty & Care
    -   Groceries
    -   Sports & Travel
    -   Books & Office
    -   Auto & Tools
    -   Baby & Toys
    -   Health & Pets
2.  **Customer Care**
    -   Track Order
    -   My Account
    -   Shipping & Delivery
    -   Returns & Refunds
    -   Warranty Policy
    -   Contact & Support
    -   Help & FAQ
3.  **About Kinto Studio**
    -   About
    -   Featured Brands
    -   New Arrivals
    -   Special Offers
    -   Journal, if active
4.  **Policies & Legal**
    -   Legal Center
    -   Terms & Conditions
    -   Privacy Policy
    -   Cancellation Policy
    -   Payment Policy
    -   Cookie Policy
    -   Marketplace Terms
    -   Seller Terms

Use the real route inventory. Do not add links that do not exist. If
some links are duplicates or point to the same destination, consolidate
them carefully.

**C. Trust and contact information** - Show verified contact channels
only. - Show business identity and location only when the correct
details are available. - Payment and delivery information should be
accurate. - Do not use fake certification badges, invented trust marks,
or unverified claims.

**D. Footer bottom bar** - Copyright. - Language selector. - Currency
selector. - Cookie preferences or privacy controls if implemented. - Any
required company/legal details.

### 9.2 Mobile footer

Do not squeeze four desktop columns into two tiny columns.

Use a mobile-first layout:

-   Brand/newsletter area first.
-   Footer groups as accessible accordion sections or clearly separated
    stacked groups.
-   Each accordion must expose its expanded/collapsed state.
-   Use large enough touch targets.
-   Keep link spacing generous.
-   Avoid long, dense columns of tiny links.
-   Keep the legal group discoverable without forcing users to scroll
    through an enormous undifferentiated list.
-   Use a compact but readable bottom bar.
-   Ensure no horizontal overflow.

### 9.3 Desktop footer

-   Use a deliberate grid with aligned column starts.
-   Give each group a consistent width and heading style.
-   Use enough vertical spacing to separate groups.
-   Keep link text readable and hover states subtle.
-   Avoid excessive empty space or an unbalanced final column.
-   Use a restrained divider between navigation and the bottom bar.

### 9.4 Back-to-top control

The recording shows a floating back-to-top button. Refine it:

-   Show it only after the user has scrolled a meaningful distance.
-   Keep it away from important fixed controls and mobile browser edges.
-   Use a subtle appearance transition.
-   Provide an accessible label.
-   Use smooth scrolling unless reduced motion is enabled.
-   Ensure it does not cover content or form controls.

------------------------------------------------------------------------

# 10. Content design: make the website sound human

The interface must not look or read like generated code, configuration
text, or generic AI copy.

Review every visible string, including:

-   Page headings
-   Eyebrows and labels
-   Helper text
-   Empty states
-   Button labels
-   Form errors
-   Toasts
-   Navigation links
-   Footer descriptions
-   Legal metadata
-   Account explanations
-   Newsletter copy

### Writing rules

-   Prefer clear, natural, concise language.
-   Use sentence case for most UI labels.
-   Avoid unnecessary title case.
-   Avoid awkward phrases such as "Marketplace Member" when a simpler
    "My account" or account identity heading is clearer.
-   Avoid repeating the brand name in every sentence.
-   Avoid generic filler such as "Discover amazing experiences" unless
    it communicates a real benefit.
-   Avoid robotic status copy and unnecessary technical terms.
-   Avoid long descriptions in navigation rows.
-   Use consistent terminology: do not alternate between "orders,"
    "order history," and "purchase records" for the same feature without
    a reason.
-   Use clear action verbs: "Save address," "Update profile," "View
    order," "Browse products."
-   Keep error messages specific and helpful.
-   Use natural Bengali content where the user-facing language is
    Bengali. Do not mix languages randomly within a single label.
-   Preserve legal wording unless explicitly approved for editorial
    revision.

Do not add placeholder content, fake testimonials, fake customer counts,
invented ratings, fake reviews, or unsupported claims.

------------------------------------------------------------------------

# 11. Motion design and transitions

Create a coherent motion system. Motion should make the interface feel
responsive, polished, and understandable.

The current experience needs a more deliberate transition language. Do
not simply add animations to every element.

### 11.1 Motion principles

-   Motion communicates cause and effect.
-   Keep most interface transitions quick and subtle.
-   Use consistent easing curves.
-   Avoid bounce, elastic overshoot, spinning icons, constant pulsing,
    and dramatic page transitions.
-   Avoid animating large blocks of text line by line.
-   Do not animate content in a way that delays access to it.
-   Avoid layout shifts during animation.
-   Respect `prefers-reduced-motion`.
-   Do not make essential information available only after an animation.

### 11.2 Suggested timing system

Use these as starting points and tune them to the existing stack:

  Interaction                     Suggested duration
  ----------------------------- --------------------
  Hover/focus color change               120--180 ms
  Button press feedback                   90--140 ms
  Small icon/state transition            140--200 ms
  Dropdown/menu open                     180--240 ms
  Drawer open/close                      220--300 ms
  Modal/dialog                           180--240 ms
  Tab/content switch                     160--220 ms
  Toast enter/exit                       180--240 ms
  Accordion expansion                    180--260 ms
  Page-level transition                  180--260 ms

Use restrained easing such as a standard ease-out for entering and
ease-in for exiting. Define shared easing tokens instead of using
unrelated values everywhere.

### 11.3 Header and drawer motion

-   Drawer enters from the correct edge.
-   Background scrim fades in smoothly.
-   Drawer content should not jump or reflow unpredictably.
-   Accordion groups expand with a restrained height/opacity transition.
-   Icons may rotate slightly to indicate expansion.
-   Avoid staggered animations that make the menu slow to use.

### 11.4 Buttons and controls

-   Provide a subtle hover/focus state.
-   Provide a tactile pressed state, such as a very small scale or tonal
    change.
-   Do not use large bouncing effects.
-   Loading states should preserve button width and prevent duplicate
    submissions.
-   Disabled states must be clearly distinguishable.
-   Focus rings must remain visible.

### 11.5 Cards and lists

-   Use subtle hover elevation or border emphasis on desktop only where
    the item is interactive.
-   Avoid lifting every static card.
-   Keep mobile touch interactions immediate.
-   Avoid animating entire account pages when only a small section
    changes.

### 11.6 Tabs and document switching

-   Use a subtle active indicator transition.
-   Do not animate tab labels across large distances.
-   Keep the selected state synchronized with the displayed content.
-   Prevent content height jumps where feasible.
-   Do not delay document readability.

### 11.7 Forms and validation

-   Focus border transitions should be quick.
-   Error messages may fade/slide in slightly but must not cause
    confusing layout jumps.
-   Success feedback should be clear and brief.
-   Do not shake the entire form for ordinary validation errors.
-   Never animate a password or sensitive field value.

### 11.8 Toasts and feedback

-   Position toasts where they do not cover important controls.
-   Use clear semantic styling.
-   Allow enough reading time.
-   Dismiss safely.
-   Do not show multiple duplicate notifications for one action.

### 11.9 Scroll behavior

-   Avoid scroll-jacking and forced scroll animations.
-   Use smooth scrolling only for intentional navigation actions.
-   Sticky elements must not cover page headings or anchor targets.
-   Use suitable scroll offsets for sticky headers.
-   Avoid scroll-triggered animations that repeatedly replay while
    scrolling up and down.

### 11.10 Reduced motion

When `prefers-reduced-motion: reduce` is active:

-   Disable nonessential movement and parallax.
-   Replace large translations with immediate state changes or short
    fades.
-   Preserve all state feedback and functionality.
-   Avoid smooth scrolling where it would be uncomfortable.

------------------------------------------------------------------------

# 12. Responsive behavior and layout integrity

Test the complete experience at representative viewport widths,
including:

-   320 px
-   360 px
-   375 px
-   390 px
-   430 px
-   768 px
-   1024 px
-   1280 px
-   1440 px and wider

Requirements:

-   No horizontal page overflow.
-   No clipped navigation labels.
-   No overlapping icons or controls.
-   No hidden form fields.
-   No fixed-width cards wider than the viewport.
-   No text that collides with buttons.
-   No footer columns squeezed into unreadable widths.
-   No sticky elements hiding content.
-   No modals larger than the available viewport.
-   No dropdown menus clipped by overflow containers.
-   No content hidden behind the mobile keyboard or browser UI.
-   Use appropriate safe-area padding where required.
-   Use fluid layouts and sensible max-widths.
-   Recompose complex desktop layouts for mobile instead of shrinking
    them.

Use real device testing where possible. Browser responsive emulation is
necessary but not sufficient.

------------------------------------------------------------------------

# 13. Accessibility and interaction quality

Implement and test:

-   Semantic landmarks: header, navigation, main, footer.
-   Correct heading order.
-   Labels associated with form controls.
-   Accessible names for icon-only buttons.
-   Keyboard navigation through menus, dialogs, tabs, and forms.
-   Visible focus states.
-   Escape-to-close behavior for dialogs and drawers.
-   Focus trapping and focus restoration for modal dialogs.
-   Correct `aria-expanded`, `aria-current`, and dialog semantics where
    appropriate.
-   Sufficient color contrast.
-   Minimum touch target around 44 × 44 CSS pixels where feasible.
-   Reduced-motion support.
-   Error messages associated with the relevant field.
-   Screen-reader announcements for important asynchronous success/error
    states.
-   No reliance on color alone to communicate status.

Do not add ARIA attributes unnecessarily. Prefer native semantic HTML
and correct behavior.

------------------------------------------------------------------------

# 14. Performance and implementation quality

The redesign must not make the website slower.

-   Reuse existing dependencies where possible.
-   Do not add a large animation library for a few simple transitions.
-   Avoid unnecessary JavaScript for hover effects.
-   Use CSS transitions for simple state changes.
-   Lazy-load below-the-fold imagery where appropriate.
-   Set image dimensions or aspect ratios to prevent layout shifts.
-   Optimize image sizes and formats.
-   Avoid expensive scroll listeners and continuous animation loops.
-   Avoid unnecessary rerenders.
-   Keep the initial mobile experience fast.
-   Avoid loading large decorative assets that do not improve usability.
-   Remove obsolete CSS only after confirming it is unused.
-   Do not create duplicate components for the same shared pattern.
-   Keep code maintainable and use clear naming.

Do not change backend APIs, authentication contracts, data schemas,
payment behavior, or route names unless absolutely necessary and
explicitly justified. If a technical change is required, document it and
preserve backward compatibility where possible.

------------------------------------------------------------------------

# 15. Specific visual problems to eliminate

Use this as a targeted acceptance checklist against the supplied
recording.

-   [ ] Announcement strip is not disproportionately tall.
-   [ ] Header controls are aligned and not cramped.
-   [ ] Navigation drawer is grouped rather than a dense unstructured
    list.
-   [ ] Main account identity is not repeated excessively.
-   [ ] Account tabs do not clip or show partial labels.
-   [ ] The active account section is immediately recognizable.
-   [ ] Account overview cards are proportionate and useful.
-   [ ] Account sections are grouped logically.
-   [ ] Empty states are intentional and include a useful next action.
-   [ ] Profile form has consistent field widths and spacing.
-   [ ] Registration role choices are clear.
-   [ ] Validation errors appear beside the relevant fields.
-   [ ] Autofill and mobile keyboard do not break form usability.
-   [ ] Address form is logically grouped and mobile-friendly.
-   [ ] Address cards clearly distinguish default and non-default
    addresses.
-   [ ] Legal document navigation is readable and usable on mobile.
-   [ ] Legal content has a professional reading layout.
-   [ ] Footer has a deliberate hierarchy and clear groupings.
-   [ ] Footer is not a tiny two-column wall of links on mobile.
-   [ ] Newsletter and footer calls to action are visually balanced.
-   [ ] Back-to-top does not cover important content.
-   [ ] Motion is consistent, restrained, and purposeful.
-   [ ] No element jumps, flashes, overlaps, or gets clipped during
    transitions.
-   [ ] No unsupported claims, fake content, or invented trust badges
    have been introduced.
-   [ ] All existing routes and actions continue to work.

------------------------------------------------------------------------

# 16. Implementation workflow --- follow in order

## Phase 1: Understand

1.  Inspect the full repository and identify the framework and entry
    points.
2.  Map all relevant routes and shared components.
3.  Identify existing data, state, validation, and navigation behavior.
4.  Identify CSS conflicts and fragile layout assumptions.
5.  Record the current design tokens and reusable patterns.
6.  Create a concise audit of the main issues before implementation.

## Phase 2: Establish the foundation

1.  Create a consistent design-token layer.
2.  Standardize typography, spacing, colors, borders, radii, and
    shadows.
3.  Standardize buttons, fields, cards, headings, icons, and feedback.
4.  Ensure Bengali and English text render correctly.
5.  Establish responsive page containers and breakpoints.

## Phase 3: Fix global navigation

1.  Refine announcement strip.
2.  Refine global header.
3.  Reorganize mobile drawer.
4.  Refine desktop department navigation.
5.  Test sticky behavior, scrolling, and keyboard interaction.

## Phase 4: Rebuild the account experience

1.  Create a consistent account shell.
2.  Fix mobile account navigation.
3.  Create a stable desktop account layout.
4.  Improve overview and account-section grouping.
5.  Refine every account page listed in this brief.
6.  Improve empty, loading, success, and error states.

## Phase 5: Improve authentication and forms

1.  Refine sign-in.
2.  Refine customer/seller role selection.
3.  Improve form hierarchy and labels.
4.  Improve validation and error placement.
5.  Test autofill and keyboard behavior.
6.  Preserve all existing account flows.

## Phase 6: Refine Legal Center

1.  Organize document navigation.
2.  Improve mobile document selection.
3.  Improve legal reading typography and width.
4.  Refine document metadata and print layout.
5.  Preserve legal text and actual document inventory.

## Phase 7: Rebuild the footer

1.  Group all existing links.
2.  Create newsletter/brand area.
3.  Create responsive footer navigation.
4.  Create trust/contact area using verified information only.
5.  Create footer bottom bar.
6.  Refine back-to-top behavior.

## Phase 8: Add motion

1.  Define timing and easing tokens.
2.  Implement drawer, dropdown, accordion, dialog, tab, button, and
    toast transitions.
3.  Add only useful interactive feedback.
4.  Implement reduced-motion behavior.
5.  Check for layout shifts and animation conflicts.

## Phase 9: Validate

1.  Test every relevant page at the viewport widths listed above.
2.  Test all navigation links and account actions.
3.  Test valid, invalid, empty, and duplicate form submissions where
    applicable.
4.  Test address add/edit/remove/default behavior.
5.  Test legal document switching and printing.
6.  Test keyboard-only navigation.
7.  Test reduced-motion mode.
8.  Check console errors and network failures.
9.  Check horizontal overflow and sticky overlap.
10. Compare the final mobile screens against the recording and verify
    that each identified issue is resolved.

------------------------------------------------------------------------

# 17. Definition of done

The work is not complete merely because the pages look different.

The redesign is complete only when:

-   The visual language is consistent across the entire website.
-   Mobile account navigation is understandable and never clips labels.
-   Account content has a clear hierarchy and avoids unnecessary
    repetition.
-   Forms are calm, readable, and usable with mobile autofill and
    keyboards.
-   Legal pages are easy to navigate and comfortable to read.
-   Footer content is properly grouped, responsive, and readable.
-   Animations are subtle, consistent, purposeful, and accessible.
-   All existing business functionality remains intact.
-   There are no obvious responsive defects at the tested widths.
-   No unsupported business, payment, security, or legal claims have
    been added.
-   The result feels deliberately designed and professionally finished.

## Final deliverables

After implementation, provide:

1.  A concise summary of the major UX and visual improvements.
2.  A list of components, routes, and files changed.
3.  Any functionality that could not be preserved and the reason.
4.  Any legal/content issues that need human review.
5.  A responsive testing checklist with the viewports actually tested.
6.  Any remaining known limitations.

Do not claim that a viewport, browser, device, or interaction was tested
unless it was actually tested.

------------------------------------------------------------------------

# 18. Final instruction to the coding agent

**Do not perform a superficial reskin. Do not just change colors, add
shadows, increase border radii, or animate existing elements.**

Think like a senior designer responsible for a real marketplace that
customers will trust with their personal details, delivery addresses,
orders, and payments.

Study the current implementation. Preserve what works. Fix the
information architecture. Improve the content hierarchy. Give the bottom
of the website the same design attention as the top. Make every page
feel related. Use motion to clarify interactions, not to decorate them.

The final result should be elegant without being empty, premium without
being flashy, detailed without being cluttered, and modern without
looking like a generic AI-generated template.

**Prioritize usability, clarity, consistency, trust, and craftsmanship
over visual effects.**

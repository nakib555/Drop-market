# Master Prompt: Implement a Complete E-commerce Policies & Legal Pages System

## Role

Act as a senior e-commerce product architect, UX writer, privacy-conscious systems designer, and full-stack implementation engineer. Audit the existing e-commerce project and implement a complete, professional, maintainable Policies & Legal Information system suitable for a multi-category online marketplace.

Do not merely create placeholder pages. Build a coherent policy centre, write clear customer-facing draft policy content, connect policies to relevant user journeys, and ensure that every policy is discoverable and usable on desktop, tablet, and mobile.

> **Important legal safeguard:** Treat generated policy text as a well-structured business draft, not a legal opinion. Do not invent company registration details, addresses, legal entity names, contact information, processing purposes, retention periods, delivery promises, warranty coverage, refund deadlines, or statutory rights. Use clearly marked configuration placeholders where verified business facts are missing. Flag jurisdiction-specific clauses for review by a qualified Bangladesh lawyer before publication. Do not claim legal compliance merely because pages exist.

---

# 1. Project-wide objectives

1. Inspect the existing codebase, routes, components, design system, data models, authentication, checkout, order management, payment integrations, seller functionality, and existing policy content before changing anything.
2. Preserve the existing brand identity, navigation structure, responsive behaviour, and established architecture. Avoid unnecessary rewrites.
3. Create one central **Policies & Help** area with individual, indexable policy pages.
4. Make policy content consistent across the website, checkout, account area, order details, seller onboarding, emails, and support flows.
5. Make all policy links functional. No dead links, empty pages, fake buttons, or unfinished placeholder copy should remain.
6. Make the experience accessible, readable, searchable where appropriate, and easy for administrators to update.
7. Support the marketplace's multi-category product catalogue and Bangladesh checkout context. Where the platform supports multiple currencies or countries, make policy scope and regional differences explicit.
8. Do not hard-code legal or operational promises into UI components. Store configurable policy values centrally.

---

# 2. Standard policies and legal documents to include

Create the following policy pages. Use the descriptions as drafting requirements, not permission to invent business facts.

## A. Customer-facing core policies

### 1. Terms & Conditions / Terms of Service
Explain:
- Who operates the website and how customers can contact the operator.
- Eligibility and account responsibilities.
- Guest browsing and guest checkout, if supported.
- Account security and accurate information requirements.
- Permitted and prohibited use of the platform.
- Product listings, descriptions, images, pricing, availability, and listing errors.
- Order submission, order acceptance, cancellation, and order-status communications.
- Payment methods, payment authorization, failed payments, and payment disputes.
- Delivery, returns, refunds, warranties, and other policies by reference.
- Marketplace role: whether the platform sells directly, hosts third-party sellers, or both.
- Seller responsibilities and the platform's role in seller transactions.
- Intellectual property and user-submitted content.
- Reviews, ratings, moderation, and prohibited review manipulation.
- Suspension, termination, and account closure.
- Disclaimers, limitation of liability, indemnity, force majeure, and dispute resolution, subject to applicable law.
- Changes to terms and effective date.
- Governing law and jurisdiction, only after legal verification.

### 2. Privacy Policy
Explain in plain language:
- What personal data is collected and the source of the data.
- Data collected during browsing, guest checkout, account registration, purchases, support, reviews, and seller interactions.
- Device, log, cookie, analytics, and security information, where actually used.
- Why each category of data is processed.
- Whether data is required or optional and what happens if it is not provided.
- Who receives data: payment providers, delivery partners, sellers, hosting, analytics, support, fraud-prevention, and other processors, only where applicable.
- Whether data is shared with sellers and what sellers can see.
- International transfers, if they occur.
- Retention criteria and deletion practices.
- Security safeguards, without promising absolute security.
- User privacy choices and rights under applicable law.
- How to submit a privacy request or complaint.
- Children's privacy and age-related restrictions, if relevant.
- Policy changes and effective date.

Do not claim that the site never shares data if order fulfilment requires sharing relevant information with sellers, couriers, or payment providers. Do not claim encryption, certifications, or security controls unless verified.

### 3. Cookie Policy
Explain:
- Essential cookies and similar technologies.
- Preference, analytics, and advertising cookies, only if used.
- Purpose, provider, duration, and category for each technology where known.
- How users can manage optional cookies.
- The effect of disabling essential cookies.
- How cookie preferences can be changed later.

If optional tracking is used, implement a consent interface appropriate to the applicable law. Do not treat continued browsing as consent unless legally reviewed and valid for the relevant jurisdiction.

### 4. Shipping & Delivery Policy
Explain:
- Countries, regions, and addresses served.
- Delivery methods and available service levels.
- Estimated processing and delivery times, clearly distinguished.
- Shipping fees, free-shipping thresholds, remote-area surcharges, and taxes where applicable.
- Order tracking and delivery notifications.
- Address accuracy and failed delivery attempts.
- Partial shipments, split orders, pre-orders, and backorders, if supported.
- Delays caused by weather, public holidays, customs, courier disruption, or other events.
- Lost, damaged, delayed, or incorrectly delivered parcels.
- International shipping, customs duties, and import taxes, if applicable.
- How customers can contact support about delivery.

Do not publish specific delivery times or fees until operations confirms them. Label estimates as estimates, not guarantees.

### 5. Returns, Refunds & Exchanges Policy
Explain:
- Which products are returnable and which are excluded, with lawful and clear reasons.
- Return eligibility and condition requirements.
- Applicable return request window, based on verified operational policy and legal review.
- How to initiate a return and obtain instructions or an authorization number, if used.
- Packaging, proof of purchase, pickup, and return-shipping responsibility.
- Damaged, defective, wrong, incomplete, or not-as-described products.
- Change-of-mind returns, where offered.
- Refund methods, processing stages, and estimated timeframes.
- Original payment method versus store credit.
- Partial refunds, promotional discounts, bundles, gifts, and shipping-fee treatment.
- Exchange availability and out-of-stock alternatives.
- Return inspection and reasons a return may be rejected.
- How to escalate a disputed return.

Do not use a blanket “no refunds” statement. Preserve all mandatory consumer rights. Do not promise an exact refund timeline until payment-provider and operations workflows have been verified.

### 6. Cancellation Policy
Explain:
- Whether customers can cancel before seller confirmation, dispatch, shipment, or fulfilment.
- How to request cancellation for guest and signed-in orders.
- What happens when an order has already shipped.
- Seller-fulfilled versus platform-fulfilled cancellation differences.
- Payment reversal/refund handling.
- Items that cannot be cancelled once customized, prepared, or dispatched, if applicable and lawful.
- What happens when a seller cancels or cannot fulfil an order.

### 7. Payment Policy
Explain:
- Accepted payment methods, based on active integrations.
- Currency display and settlement currency.
- Any currency conversion and exchange-rate disclosures.
- Cash on delivery availability and limitations, if supported.
- Card, mobile financial service, bank transfer, and wallet flows, only where active.
- Payment authorization, capture, pending, failed, duplicate, and reversed transactions.
- Receipts and invoices.
- Refund routing and payment-provider processing.
- Payment security and fraud checks.
- What to do if money is deducted but the order is not confirmed.

For a Bangladesh-facing checkout, configure only payment methods that are genuinely enabled (for example, bKash, Nagad, cards, bank channels, or cash on delivery). Never display a payment logo or method as available merely because it is common in the market.

### 8. Warranty & Product Authenticity Policy
Explain:
- Which product categories or individual products carry a warranty.
- Manufacturer warranty versus seller warranty versus platform guarantee.
- Warranty duration and start date, only when verified.
- What is covered and excluded.
- Required proof of purchase and claim procedure.
- Repair, replacement, or refund remedies, subject to law and the actual warranty.
- Authenticity claims and how suspected counterfeit or misrepresented products are investigated.
- Product-specific exceptions.

Do not imply that every product has a warranty or authenticity guarantee unless the business can substantiate it.

### 9. Accessibility Statement
Explain the site's accessibility commitment, known limitations, and a contact route for reporting barriers. Do not claim conformance to a standard without an actual audit.

### 10. Contact, Complaints & Dispute Resolution
Provide verified support channels, operating hours, expected response targets if confirmed, complaint escalation steps, and any legally required consumer complaint route. Do not invent contact details or promise response times that the team cannot meet.

## B. Marketplace and seller policies (if third-party sellers are enabled)

### 11. Seller / Marketplace Policy
Explain:
- Seller eligibility, verification, onboarding, and account requirements.
- Listing quality, accurate descriptions, images, pricing, stock, and availability.
- Product safety, legality, authenticity, and restricted-item rules.
- Order acceptance, fulfilment, dispatch, tracking, and delivery responsibilities.
- Returns, refunds, cancellations, warranties, and customer support responsibilities.
- Seller fees, commissions, settlements, reserves, chargebacks, and payout timing, only from verified commercial terms.
- Seller performance standards and service-level expectations.
- Customer data access and permitted use.
- Prohibited conduct, review manipulation, counterfeit goods, and off-platform transactions.
- Complaints, investigations, suspension, termination, and appeals.
- How platform policies interact with seller-specific policies and mandatory consumer rights.

### 12. Seller Terms & Conditions
Create a separate agreement for sellers covering the commercial relationship, seller representations, listing licence, fulfilment obligations, payment settlement, fees, taxes, records, indemnity, liability, termination, and dispute handling. Require legal review before seller acceptance.

### 13. Prohibited & Restricted Products Policy
Define prohibited and restricted product categories based on applicable laws, platform risk rules, and payment-provider requirements. Include a reporting and enforcement process. Do not create a list that conflicts with local law or current payment-provider rules; require legal/compliance review.

### 14. Product Reviews & User-Generated Content Policy
Explain:
- Review eligibility and moderation.
- Authenticity and anti-manipulation rules.
- Prohibited content, harassment, personal information, spam, and conflicts of interest.
- Reporting, moderation, removal, and appeal processes.
- Whether incentives are offered and how they are disclosed.
- Licence and permitted use of submitted content, subject to law.

## C. Optional policies depending on actual features

Add these only if the product supports the relevant feature:
- Loyalty / Rewards Program Terms.
- Gift Card Terms.
- Promotional Offers, Coupons & Discount Terms.
- Subscription / Auto-renewal Terms.
- Pre-order & Backorder Policy.
- Installment / Buy Now Pay Later Terms.
- Digital Products & Downloads Policy.
- Product Rental Policy.
- Trade-in Policy.
- International Orders & Customs Policy.
- Price Match Policy.
- Accessibility and assistive technology details.
- Affiliate / Influencer Disclosure Policy.

Do not publish irrelevant pages just to make the policy centre look larger.

---

# 3. Legal and regional review requirements

1. Identify the actual operating country, legal entity, seller model, customer markets, and payment/delivery providers from verified project configuration or ask the administrator.
2. For Bangladesh-facing operations, flag the relevant current laws, rules, directives, consumer-protection requirements, digital-commerce obligations, payment-provider requirements, tax disclosures, and complaint procedures for qualified local legal review.
3. Verify the current legal position from authoritative government or regulator sources before presenting any clause as legally required.
4. Distinguish clearly between:
   - mandatory legal rights;
   - the platform's voluntary commercial policy;
   - seller-specific terms;
   - operational estimates or service targets.
5. Where law grants customers stronger rights than a platform policy, the law prevails.
6. Do not copy another marketplace's policies. Draft original, business-specific text.
7. Maintain a legal review checklist and record the reviewer, review date, jurisdiction, and approval status. Do not fabricate approvals.

---

# 4. UX, navigation, and page design

## Policy Centre
Create a polished, easy-to-find **Policies & Help** landing page containing:
- A concise introduction.
- Search field for policy topics.
- Clearly grouped policy categories (Shopping, Payments, Orders & Delivery, Returns & Warranty, Privacy & Legal, Seller Information).
- Descriptive links to each active policy.
- “Last updated” and effective-date information.
- Contact/support link.
- Mobile-friendly cards or a clean list layout.

## Individual policy pages
Each page should include:
- Clear title and short summary.
- Effective date and last-updated date.
- Table of contents for long policies.
- Properly structured headings and short paragraphs.
- Lists and tables where they improve comprehension.
- Related policy links.
- Contact or complaint route where relevant.
- Print-friendly layout.
- Accessible focus states and semantic HTML.
- A clear indication when a policy is a draft awaiting approval; never expose internal draft warnings to customers in production.

## Visual quality
- Follow the current brand design system.
- Use restrained, professional styling and consistent spacing.
- Avoid giant walls of text, decorative clutter, excessive gradients, or unnecessary animation.
- Ensure readable typography, contrast, and line length.
- Fully support small mobile screens, tablets, laptops, and wide desktop displays.
- Prevent horizontal overflow, clipped text, overlapping sticky elements, and broken tables.
- Respect reduced-motion preferences.

---

# 5. Functional integration across the store

Implement and test the following:

## Global navigation and footer
- Add a discoverable “Policies & Help” or “Legal” footer group.
- Include the relevant core policy links in the footer.
- Ensure every link resolves to the correct route.
- Do not overload the main shopping navigation with legal links.

## Registration and sign-in
- Link Terms and Privacy Policy beside the relevant consent statement.
- Use an explicit, unselected checkbox when affirmative consent is legally required.
- Do not bundle marketing consent with acceptance of essential terms.
- Do not force account creation merely to read policies.

## Guest checkout
- Preserve guest browsing and guest shopping functionality.
- Show the relevant terms and privacy links at checkout.
- If a customer must affirmatively accept terms, record the acceptance appropriately.
- Do not make guest users accept marketing communications as a condition of purchase.

## Checkout
- Display shipping, return, cancellation, and payment information at the point where it materially affects the purchase.
- Show delivery estimates and fees before order placement.
- Make the order total and currency clear.
- Ensure the policy shown at checkout matches the policy page and the actual fulfilment rules.
- Do not use a generic checkbox to waive statutory consumer rights.

## Product pages
- Show product-specific warranty, seller, return eligibility, delivery, and authenticity information only when verified for that product.
- Link to the relevant full policy.
- If sellers have different terms, clearly disclose which terms apply before purchase.

## Account and order pages
- Provide relevant links from order details, return requests, cancellation flows, and support pages.
- Explain the next step when a return, refund, or cancellation is unavailable.
- Do not make policy pages inaccessible to guest customers.

## Email and notifications
- Where appropriate, include links to the applicable policies in order confirmation, shipping, cancellation, refund, and seller emails.
- Keep email policy references consistent with the version accepted at order time.

---

# 6. Policy content management and versioning

Build a maintainable policy content system instead of scattering text across components.

Requirements:
- Store policy content in the project's established CMS/database/configuration architecture.
- Each policy should have a stable slug, title, category, content, status, effective date, last-updated date, jurisdiction/scope, and version identifier.
- Support draft, review, scheduled, and published states if the existing admin architecture allows it.
- Only approved/published policies should be visible to customers.
- Provide an admin editing workflow with preview and validation.
- Maintain a version history.
- Preserve the exact version accepted by a customer at the time of an order or registration, where legally and operationally appropriate.
- Record acceptance timestamp, policy version, relevant user/order reference, and source context. Minimize personal data and follow retention requirements.
- Do not silently rewrite a previously accepted version.
- Provide a clear process for notifying users of material changes when required.
- Sanitize rendered rich text and prevent script injection.
- Ensure policy content can be translated without mixing languages or losing legal meaning.

If a full CMS is outside the project's scope, use a structured content configuration with a clear migration path.

---

# 7. Privacy, security, and data-minimization requirements

- Collect only the data required for the stated purpose.
- Restrict policy administration to authorized roles.
- Protect customer and seller data with existing access-control patterns.
- Do not expose order details, customer addresses, payment references, or seller information on public policy pages.
- Never store raw card data or payment credentials in the policy system.
- Do not log sensitive personal data in analytics or error logs.
- Make privacy request handling clear and operationally possible.
- Align cookie controls with the actual tracking scripts installed.
- Do not load optional tracking before the required consent state where consent is required.
- Ensure cookie preference controls genuinely change the behaviour of relevant scripts.

---

# 8. Content accuracy and configuration

Create a central configuration or admin checklist for facts that must be confirmed before publication:

- Legal business name.
- Trading name and registration details, if applicable.
- Business address and country.
- Customer support email, phone, and contact form.
- Support operating hours.
- Countries and regions served.
- Shipping providers and service levels.
- Actual shipping prices and free-shipping conditions.
- Actual payment methods and providers.
- Supported currencies and conversion rules.
- Return request window and product exclusions.
- Refund processing workflow and estimated timing.
- Cancellation cut-off points.
- Warranty arrangements by category or seller.
- Marketplace versus first-party seller model.
- Seller commission, fees, settlement, and payout terms.
- Analytics, advertising, cookie, and marketing tools actually installed.
- Data processors and international transfers.
- Data retention schedule.
- Complaint escalation and dispute-resolution process.
- Governing law and jurisdiction.
- Effective date and policy owner.

Use explicit placeholders such as `[CONFIRM BUSINESS LEGAL NAME]` in administrator-only drafts. Never let unresolved placeholders reach production.

---

# 9. Search engine, accessibility, and technical quality

- Give every policy page a unique title and meta description.
- Use canonical URLs and sensible internal links.
- Make public policy pages crawlable unless there is a specific security reason not to.
- Use semantic landmarks, headings in logical order, descriptive links, keyboard navigation, and visible focus.
- Ensure screen readers can understand tables, forms, and consent controls.
- Meet the project's accessibility target; audit rather than merely claim conformance.
- Avoid layout shift and unnecessary client-side rendering for static policy content.
- Validate all routes, links, translations, and structured content.
- Keep page performance consistent with the rest of the site.

---

# 10. Required testing and acceptance criteria

Test on mobile, tablet, laptop, and large desktop viewports.

### Content tests
- Every required policy page exists or is explicitly marked not applicable.
- No invented company facts, payment methods, delivery promises, refund periods, or legal claims.
- No unresolved placeholders on published pages.
- Effective dates and version labels are consistent.
- Policy language is clear and internally consistent.

### Functional tests
- Footer and policy-centre links work.
- Search/filter works if implemented.
- Table of contents anchors work.
- Checkout policy links work for guest and signed-in users.
- Consent controls behave correctly.
- Cookie preferences persist and affect optional scripts.
- Admin draft/review/publish permissions work.
- Version history and acceptance records work where implemented.
- Return/cancellation links lead to the correct workflow.
- No dead ends or broken routes.

### Responsive and accessibility tests
- No horizontal overflow.
- No overlapping navigation, modals, banners, or sticky elements.
- Text remains readable at narrow widths and zoomed layouts.
- Keyboard-only navigation works.
- Focus is visible and logical.
- Screen-reader labels are meaningful.
- Reduced-motion settings are respected.

### Security tests
- Rich-text sanitization prevents script injection.
- Unauthorized users cannot edit or publish policies.
- Public pages do not reveal private customer or seller data.
- Consent cannot be forged through client-only state.
- Acceptance records are validated server-side where applicable.

### Regression tests
- Existing product browsing, search, cart, guest checkout, account checkout, payment, order management, seller tools, and responsive navigation continue working.
- Do not break existing design or business logic while adding policies.

---

# 11. Required deliverables

Complete the work and report:

1. A list of all policy pages created.
2. A list of pages intentionally marked not applicable and why.
3. Routes and navigation locations added.
4. Checkout, account, product, order, and seller integrations completed.
5. Data model/configuration changes.
6. Admin editing and versioning capabilities.
7. Tests run and their results.
8. Any unresolved business facts that require owner input.
9. Any clauses requiring Bangladesh-specific legal review.
10. Any known limitations or follow-up tasks.

Do not claim completion if pages are only mockups or if links and workflows are not functional.

---

# 12. Execution instructions

Work in this order:

1. Audit the existing application and summarize its current architecture.
2. Identify which features are actually supported: guest checkout, first-party sales, third-party sellers, payment methods, delivery, returns, warranties, cookies, analytics, subscriptions, loyalty, and international orders.
3. Build a policy applicability matrix: Required / Applicable / Not applicable / Needs business confirmation / Needs legal review.
4. Identify missing business facts. Use safe placeholders in unpublished drafts rather than guessing.
5. Implement the policy centre and individual pages using the existing architecture.
6. Connect policies to the relevant customer and seller journeys.
7. Implement content management/versioning to the extent supported by the current stack.
8. Run responsive, functional, accessibility, security, and regression tests.
9. Fix all defects caused by the implementation.
10. Provide the final implementation report and a concise owner/legal-review checklist.

**Quality bar:** The result should feel like a mature, trustworthy, premium e-commerce marketplace. Policies must be easy to find, understandable, consistent with actual operations, technically functional, and reviewed before publication. Accuracy and customer trust take priority over making the policy section appear complete.

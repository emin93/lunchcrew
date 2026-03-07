# Monetization Experiments Backlog (v1)

Practical experiments to validate willingness-to-pay before full billing integration.

## 1) In-app Pro Card + Waitlist Capture
- **Hypothesis:** Active crews will express purchase intent when shown concrete Pro positioning.
- **Implementation:** Show persistent "LunchCrew Pro" card in app with email + optional note waitlist form.
- **Success criteria:**
  - >=20% of active crews click upgrade CTA (`upgrade_cta_clicked`)
  - >=30% CTA-to-waitlist conversion (`waitlist_joined`)
- **Effort:** Low (1–2 days)
- **Status:** Implemented

## 2) Pricing Copy A/B (Value-first vs Price-first)
- **Hypothesis:** Value-led messaging increases intent more than direct price anchoring.
- **Implementation:** Alternate card copy between feature outcomes and explicit tier teaser.
- **Success criteria:** +15% relative lift in `upgrade_cta_clicked` from winning variant.
- **Effort:** Low (1 day)
- **Dependencies:** Simple variant assignment and event property tagging.

## 3) Persona-targeted Prompt Timing
- **Hypothesis:** Prompting organizers after repeated poll creation converts better than always-on placement.
- **Implementation:** Trigger modal/banner after user creates or manages 3+ polls in a week.
- **Success criteria:** >=25% lift in waitlist conversion vs control.
- **Effort:** Medium (2–3 days)
- **Dependencies:** Organizer behavior detection in analytics.

## 4) Concierge Pilot Offer
- **Hypothesis:** Teams will pay for workflow outcomes even before fully automated billing.
- **Implementation:** Offer limited pilot seats with manual invoicing / early adopter agreement.
- **Success criteria:**
  - 5+ pilot commitments
  - >=40% convert to paid after pilot period
- **Effort:** Medium (ops + product, 1 week)
- **Dependencies:** Founder/operator availability for onboarding.

## 5) Sponsored Slot Feasibility Test (Optional)
- **Hypothesis:** Clearly labeled sponsored suggestions can generate non-subscription revenue without harming trust.
- **Implementation:** Add one sponsored restaurant slot in suggestion list for selected locales.
- **Success criteria:**
  - Sponsored click-through >=3%
  - No negative movement in vote completion rate
- **Effort:** Medium (3–5 days)
- **Dependencies:** Partner sourcing and compliance labeling.

## 6) Team Size Price Sensitivity Survey
- **Hypothesis:** Price tolerance differs significantly by team size and lunch frequency.
- **Implementation:** Add optional survey fields in waitlist follow-up (team size, weekly lunch count, budget range).
- **Success criteria:** At least 50 responses with clear willingness-to-pay bands.
- **Effort:** Low (1–2 days)
- **Dependencies:** Waitlist email outreach.

---

## Operating Notes
- Prioritize experiments that improve decision quality quickly (intent + conversion signals).
- Avoid payment-provider lock-in until intent thresholds are met.
- Keep all tests reversible and non-disruptive to core lunch voting flows.

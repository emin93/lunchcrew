# LunchCrew Business Plan (Monetization v1)

## 1) Target ICP and Personas

### ICP (ideal customer profile)
Small-to-mid teams (10–250 employees) that coordinate in-office lunches at least 2x/week and currently use informal chat threads for decisions.

### Primary personas
- **Team lead / office manager**
  - Pain: coordination overhead and repeated back-and-forth.
  - Buyer motivation: save team time and reduce decision friction.
- **Operations / people team coordinator**
  - Pain: wants lightweight tools with low admin burden.
  - Buyer motivation: improve in-office experience without complex procurement.
- **Frequent organizer (power user)**
  - Pain: same person repeatedly runs lunch votes manually.
  - Buyer motivation: automation, consistency, and visibility.

## 2) Pricing Options and Recommended Starting Tiers

## Option A (recommended launch)
- **Free**: core polling and invite flow for small crews.
- **Pro Team — $19/month per crew**
  - Recurring lunch templates
  - Priority recommendation tuning
  - Basic analytics (participation trends)
- **Business — $79/month per workspace**
  - Multi-crew management
  - Policy controls / admin settings
  - CSV export and priority support

Why this option: simple packaging, easy self-serve motion, and clear step-up value from daily usage.

## Option B (usage-based)
- Base platform fee + active-member usage fee.
- Better for larger orgs later, but more sales friction now.

Recommendation: launch with **Option A** for fastest validation.

## 3) Monetization Strategy

## Core: subscription
- Convert engaged free crews to Pro after repeated weekly usage.
- Trigger upgrade prompts from product behavior (e.g., recurring organizer, high vote volume).

## Secondary: affiliate/sponsored (optional)
- Partner with local lunch vendors / delivery providers.
- Revenue model: referral fee per completed order from tracked outbound clicks.
- Guardrail: sponsorship slots must be clearly labeled and never bias vote fairness.

## Packaging strategy
- Keep free tier generous enough for adoption.
- Gate workflow acceleration (automation + reporting), not basic collaboration.

## 4) 30/60/90 Day Go-to-Market Plan

## Day 0–30: Validate willingness-to-pay
- Ship in-app Pro waitlist and pricing intent tracking.
- Recruit 10–15 active crews from existing users.
- Run interviews on desired paid features and acceptable price points.
- KPI target: at least 20% of active crews click upgrade CTA.

## Day 31–60: Pilot paid value
- Release 1–2 Pro features with strongest demand (likely recurring templates + simple analytics).
- Offer manual concierge onboarding for first pilot customers.
- KPI target: 5+ pilot crews agreeing to paid trial terms.

## Day 61–90: Convert and standardize
- Launch self-serve Pro checkout (if pilot metrics validate).
- Publish pricing page and in-app upgrade flow.
- Start lightweight outbound to office managers / team leads.
- KPI target: first 10 paying crews and month-1 retention >70%.

## 5) Metrics and Decision Thresholds

## Leading indicators
- **Upgrade CTA click rate** = crews with `upgrade_cta_clicked` / active crews.
  - Threshold: continue Pro build if >=20% over 2 weeks.
- **Waitlist conversion** = `waitlist_joined` / `upgrade_cta_clicked`.
  - Threshold: strong signal at >=30%.
- **Activation depth** = crews with >=3 voting sessions/week.
  - Threshold: paid motion viable if >=25% of active crews hit this.

## Business outcomes
- **Pilot-to-paid conversion**
  - Threshold: >=40% after trial period.
- **Gross monthly churn (crew-level)**
  - Threshold: intervene if >8% in first 3 months.
- **ARPA (average revenue per active paying crew)**
  - Target: >=$25 blended by end of first paid quarter.

## Decision rules
- If CTA <20% and interviews show weak pain, delay billing build and improve core engagement first.
- If CTA >=20% but waitlist <15%, revisit pricing/copy before deeper feature investment.
- If pilot conversion >=40% with stable retention, proceed to full self-serve subscription launch.

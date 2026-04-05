# TradeReach™ Pricing & Territory System v2.0 — Deployment Checklist

## Step 1: Database Migration (Supabase)
Run `supabase/pricing-territory-v2.sql` in the Supabase SQL editor.

**Verify after running:**
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'contractors' ORDER BY ordinal_position;
SELECT * FROM founding_member_counts;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('zip_claims','zip_capacity','credit_transactions','account_manager_assignments','cancellation_retention');
```

## Step 2: Create Stripe Prices

Create these products and prices in the Stripe dashboard (or via API):

| Product | Price ID Env Var | Amount | Billing |
|---------|-----------------|--------|---------|
| Pro Monthly | STRIPE_PRO_PRICE_ID | $497/mo | monthly |
| Pro Annual | STRIPE_PRO_ANNUAL_PRICE_ID | $4,970/yr | yearly |
| Pro Founding Monthly | STRIPE_PRO_FOUNDING_PRICE_ID | $397/mo | monthly |
| Pro Founding Annual | STRIPE_PRO_ANNUAL_FOUNDING_PRICE_ID | $3,970/yr | yearly |
| Elite Monthly | STRIPE_ELITE_PRICE_ID | $897/mo | monthly |
| Elite Annual | STRIPE_ELITE_ANNUAL_PRICE_ID | $8,970/yr | yearly |
| Elite Founding Monthly | STRIPE_ELITE_FOUNDING_PRICE_ID | $697/mo | monthly |
| Elite Founding Annual | STRIPE_ELITE_ANNUAL_FOUNDING_PRICE_ID | $6,970/yr | yearly |
| **Elite Plus Monthly** | **STRIPE_ELITE_PLUS_PRICE_ID** | **$1,497/mo** | **monthly** |
| **Elite Plus Annual** | **STRIPE_ELITE_PLUS_ANNUAL_PRICE_ID** | **$14,970/yr** | **yearly** |

**Note:** Elite Plus has NO trial period. All others have 7-day trial.

## Step 3: Update Environment Variables

Add these new env vars to Vercel (and .env.local):

```env
# New Stripe prices (Elite Plus)
STRIPE_ELITE_PLUS_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_ELITE_PLUS_ANNUAL_PRICE_ID=price_xxxxxxxxxxxxx

# Admin secret for admin API routes
ADMIN_SECRET=your-strong-secret-here
```

Existing vars that remain unchanged:
- STRIPE_PRO_PRICE_ID, STRIPE_PRO_ANNUAL_PRICE_ID
- STRIPE_ELITE_PRICE_ID, STRIPE_ELITE_ANNUAL_PRICE_ID
- STRIPE_PRO_FOUNDING_PRICE_ID, STRIPE_ELITE_FOUNDING_PRICE_ID
- All Supabase, Resend, Twilio vars

## Step 4: Deploy to Vercel

Push to main branch. Vercel auto-deploys.

**New cron jobs added (vercel.json updated):**
- `/api/cron/monthly-credits` — 1st of each month at midnight
- `/api/cron/credit-warnings` — daily at 2pm UTC
- `/api/cron/zip-capacity` — daily at 7am UTC
- `/api/cron/pause-resume` — daily at 8am UTC
- `/api/cron/account-manager-reviews` — 1st of each month at 9am UTC

## Step 5: Verify Deployment

### Test each scenario:

**PPL claims lead:**
- Contractor with plan_type='pay_per_lead' tries to claim
- Should see payment modal for $45
- After payment, lead marked claimed

**Pro claims within credit limit:**
- Pro contractor with lead_credits_remaining > 0
- Claims lead → credit decremented → credit_transactions log entry created

**Pro reaches credit limit (overage):**
- Pro contractor with lead_credits_remaining = 0
- Claims lead → sees overage modal: "Claiming this lead will charge $38"
- Confirms → Stripe payment intent created → lead claimed

**Credit rollover:**
- Pro with 8 unused credits at month end
- Monthly cron runs → 8 carried to next month → 15 new granted → balance = 23 (under 30 cap)
- Pro with 20 unused credits at month end
- Monthly cron runs → 20 + 15 = 35 → capped at 30
- credit_transactions logs both monthly_grant and rollover

**Elite claims ZIP exclusively:**
- Elite contractor adds ZIP with no existing contractors
- ZIP status = AVAILABLE_EXCLUSIVELY → claim_type = 'exclusive'
- zip_claims record inserted
- contractor.exclusive_zips updated

**Elite Plus overrides Elite:**
- Elite has exclusive claim on ZIP
- Elite Plus tries to add → status = ELITE_EXCLUSIVE_LOCKED → canAdd = true for Elite Plus
- Elite Plus claims → claim_type = 'super_exclusive'
- Elite contractor notified by email about territory change

**Elite tries to claim Elite Plus ZIP:**
- Elite Plus has super_exclusive claim
- Elite tries to add → status = SUPER_EXCLUSIVE_LOCKED → canAdd = false → blocked

**Pro at capacity limit:**
- ZIP has 3 Pro contractors (max_pro = 3)
- New Pro contractor tries to add
- Status = PRO_CAPACITY_REACHED → shown warning but can still add with confirmation
- Elite can still add regardless of Pro capacity

**Subscription pause:**
- Pro contractor goes to settings → Pause
- Stripe subscription paused
- pause_subscription_until set to 30 days out
- subscription_status = 'paused'
- Contractor sees pause banner in dashboard
- Cannot claim leads while paused
- ZIP claims remain active
- After 30 days, cron auto-resumes

**Plan upgrade Pro → Elite:**
- Preview shows ZIP-by-ZIP breakdown
- Credits convert 1:1 (capped at Elite max 60)
- ZIP claims updated to exclusive/priority
- Stripe subscription updated

**Plan upgrade Elite → Elite Plus:**
- ZIP claims upgrade to super_exclusive
- Account manager assigned (round-robin)
- Welcome email from account manager sent

**Founding member:**
- When founding_member_counts.filled_spots < max_spots → show founding price
- On signup with founding price → founding_member = true, founding_member_locked_price set
- filled_spots incremented
- Gold badge shown in dashboard
- If contractor cancels and resubscribes → no founding member rate (normal price)

**Cancellation flow:**
- Contractor clicks Cancel
- Survey shown (required)
- Retention offer shown based on reason:
  - "not_enough_leads" → 5 bonus credits offer
  - "taking_a_break" → pause option
  - "too_expensive" → downgrade suggestion
- If they confirm cancel: must type "CANCEL"
- Stripe subscription cancelled at period end
- 30-day win-back email scheduled
- 90-day win-back email scheduled

**Lead routing 4-tier:**
- New lead comes in for ZIP that has Elite Plus + Elite + Pro + PPL contractors
- Only Elite Plus notified (30-min window)
- After 30 min unclaimed → Elite notified (15-min window)
- After 15 min unclaimed → Pro with longest wait since last claim gets 5-min head start
- After 5 min → all remaining Pro + all PPL notified simultaneously
- After 24 hours unclaimed → lead expired

**Elite Plus account manager:**
- Elite Plus signs up → account manager assigned from team_members with role='account_manager'
- Introduction email sent from account manager
- Monthly cron generates performance report
- Report sent to contractor and account manager
- Alert sent to manager if no contact in 7 days
- Alert sent to manager if satisfaction score < 3.5

## Step 6: Stripe Webhook Events to Verify

Ensure webhook handles these events (all already coded):
- customer.subscription.created
- customer.subscription.updated (includes pause/resume detection)
- customer.subscription.deleted
- invoice.payment_succeeded (credit grant on renewal)
- invoice.payment_failed
- payment_intent.succeeded (lead claim + credit transaction log)

## All New Files Created

### Backend
- `supabase/pricing-territory-v2.sql` — DB migration
- `src/types/index.ts` — Updated types (elite_plus added)
- `src/lib/pricing.ts` — Updated pricing constants (v2)
- `src/lib/config.ts` — Updated plan config (elite_plus added)
- `src/lib/stripe/checkout.ts` — Updated (elite_plus, pause/resume)
- `src/lib/utils/zip-status.ts` — NEW: ZIP territory status engine
- `src/lib/utils/zip-claims.ts` — NEW: ZIP claim recording
- `src/lib/utils/notify-contractors.ts` — REWRITTEN: 4-tier routing
- `src/app/api/leads/claim/route.ts` — REWRITTEN: credit system
- `src/app/api/webhooks/stripe/route.ts` — UPDATED: elite_plus + credits
- `src/app/api/contractors/zip/route.ts` — NEW: ZIP add/remove/check
- `src/app/api/contractors/pause/route.ts` — NEW: pause/resume
- `src/app/api/contractors/upgrade/route.ts` — NEW: upgrade preview + execute
- `src/app/api/contractors/cancel/route.ts` — NEW: cancellation retention
- `src/app/api/cron/monthly-credits/route.ts` — NEW: monthly credit grant
- `src/app/api/cron/credit-warnings/route.ts` — NEW: low credit + unused alerts
- `src/app/api/cron/zip-capacity/route.ts` — NEW: ZIP saturation monitoring
- `src/app/api/cron/pause-resume/route.ts` — NEW: auto-resume + win-back
- `src/app/api/cron/account-manager-reviews/route.ts` — NEW: Elite Plus reports
- `src/app/api/admin/founding-members/route.ts` — NEW: admin founding counts
- `src/lib/resend/emails/system-emails.ts` — NEW: 10 new email templates
- `src/lib/resend/emails/index.ts` — UPDATED: new exports

### UI
- `src/components/marketing/PricingSection.tsx` — REWRITTEN: 4 tiers + comparison
- `src/app/(dashboard)/onboarding/page.tsx` — UPDATED: 4 tiers + ZIP status
- `src/components/dashboard/PlanStatusBanner.tsx` — UPDATED: credit display
- `src/components/dashboard/AccountManagerCard.tsx` — NEW: Elite Plus manager card
- `src/components/dashboard/OverageConfirmModal.tsx` — NEW: overage confirmation
- `src/app/admin/zip-health/page.tsx` — NEW: ZIP health dashboard
- `src/app/admin/page.tsx` — UPDATED: new stats cards
- `vercel.json` — UPDATED: 5 new cron schedules

## Edge Cases Handled

| Scenario | How handled |
|----------|------------|
| Two contractors claim same lead simultaneously | Atomic UPDATE with `.eq('status', 'available')` guard — only one wins |
| Pro at credit limit clicks Claim | Returns requires_payment response, client shows overage modal |
| Contractor cancels and resubscribes | founding_member rate NOT restored (webhook doesn't re-set founding flag) |
| Elite Plus ZIP override notification | Sends email to all existing contractors in that ZIP |
| Paused contractor tries to claim | 403 with "Your subscription is paused until X" message |
| Elite Plus with no account managers assigned | Silent fail (logged), no crash |
| Credit rollover exceeds max | Capped at plan max (Pro:30, Elite:60, Elite Plus:120) |
| ZIP status check fails | Returns canAdd:false with generic error — safe default |
| Cron fires twice in same minute | Idempotent checks prevent duplicate credit grants |
| Founding spots reach max | founding_member_counts.filled_spots >= max_spots → founding price hidden from UI |
| Pro capacity reached | Warning shown but add still allowed with confirmation |
| Super exclusive overrides Elite exclusive | Allowed — Elite notified of change by email |
| Monthly credits cron on paused contractor | Skipped — paused contractors don't get credit grants |
| Upgrade Pro→Elite with 25 credits | All 25 carried forward (under Elite 60 cap) |
| Downgrade Elite→Pro with 50 credits | Reduced to 30 (Pro rollover cap), 20 credits logged as reduction |
| Win-back email duplicate prevention | win_back_email_30_sent / win_back_email_90_sent flags prevent resending |
| Low credit warning duplicate | Checks notifications table for same-day warning before sending |

## Scale Considerations

**At 10 contractors:** All queries fast, single-row responses, no performance concerns.

**At 10,000 contractors:**
- ZIP status queries use indexed `zip_claims(zip, niche, is_active)` — fast
- Monthly credit cron processes in chunks (could add pagination if >10k contractors)
- Notification queue cron runs every 5 min — designed for high volume
- ZIP capacity table has composite primary key (zip, niche) — O(1) lookups
- credit_transactions has index on (contractor_id, created_at) — fast audit queries
- All writes use admin client (bypasses RLS for performance)
- Consider adding Redis caching for ZIP status at 10k+ contractors

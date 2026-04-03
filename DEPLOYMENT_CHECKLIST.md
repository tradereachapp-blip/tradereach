# TradeReach — Deployment Checklist

## Before Going Live — Complete Every Item

---

### 1. Supabase Setup

- [ ] Create a new Supabase project at supabase.com
- [ ] Run `/supabase/schema.sql` in the Supabase SQL editor
- [ ] Verify all 5 tables exist: `leads`, `contractors`, `lead_claims`, `notifications`, `errors`
- [ ] Verify RLS is enabled on all tables (check Auth > Policies in Supabase dashboard)
- [ ] Test RLS by logging in as a test contractor and confirming they cannot see other contractors' data
- [ ] Copy your project URL and anon key from Settings > API
- [ ] Copy your service role key from Settings > API (keep secret — never expose client-side)

---

### 2. Stripe Setup

- [ ] Create a Stripe account at stripe.com
- [ ] In **Test Mode** first:
  - [ ] Create product: "TradeReach Pro" — $297/month recurring, with 7-day trial
  - [ ] Create product: "TradeReach Elite" — $597/month recurring, with 7-day trial
  - [ ] Note the Price IDs (e.g., `price_xxx`) for both products
- [ ] Set up Stripe webhook endpoint:
  - URL: `https://your-domain.com/api/webhooks/stripe`
  - Events to listen to:
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`
    - `payment_intent.succeeded`
  - Copy the signing secret (`whsec_xxx`)
- [ ] Set up Stripe Customer Portal in Stripe Dashboard > Billing > Customer Portal
  - Enable: cancel subscriptions, update payment method, view invoice history
- [ ] Add publishable key, secret key, webhook secret, and price IDs to `.env.local`

---

### 3. Resend (Email) Setup

- [ ] Create account at resend.com
- [ ] Add and verify your sending domain (e.g., `tradereach.com`)
  - Add DNS records as specified by Resend
  - Wait for verification (usually 1–24 hours)
- [ ] Create API key with send permission
- [ ] Set `RESEND_FROM_EMAIL` to a verified address (e.g., `noreply@tradereach.com`)
- [ ] Set `ADMIN_EMAIL` to your admin alert email address
- [ ] Test by triggering a lead submission and confirming admin email is received

---

### 4. Twilio (SMS) Setup

- [ ] Create account at twilio.com
- [ ] Purchase a local phone number with SMS capability
- [ ] Copy Account SID and Auth Token from the Twilio console
- [ ] Set `TWILIO_PHONE_NUMBER` in E.164 format (e.g., `+15551234567`)
- [ ] Test SMS by submitting a lead and checking that contractor SMS is sent
- [ ] For production volume: apply for A2P 10DLC registration (required in US)

---

### 5. Vercel Deployment

- [ ] Push code to a GitHub/GitLab/Bitbucket repository
- [ ] Import project in Vercel
- [ ] Set Framework Preset to **Next.js**
- [ ] Add all environment variables from `.env.example` in Vercel Project Settings > Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRO_PRICE_ID`
  - `STRIPE_ELITE_PRICE_ID`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - `ADMIN_EMAIL`
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
  - `NEXT_PUBLIC_APP_URL` (your production domain, e.g., `https://tradereach.com`)
  - `ADMIN_PASSWORD` (strong random string)
  - `CRON_SECRET` (strong random string)
- [ ] Deploy and verify build succeeds
- [ ] Set your custom domain in Vercel and configure DNS

---

### 6. Vercel Cron Job

- [ ] Confirm `vercel.json` is in your project root with cron config
- [ ] In Vercel Dashboard > Project > Settings > Cron Jobs, verify the daily cleanup job is listed
- [ ] The cron job runs daily at 6am UTC — verify it's triggered
- [ ] Check that the Authorization header includes `CRON_SECRET` (Vercel sends this automatically)

---

### 7. Post-Deployment Verification

Run through every user flow manually:

**Homeowner Flow:**
- [ ] Submit a lead on the homepage
- [ ] Confirm duplicate detection works (submit same phone again)
- [ ] Confirm admin receives alert email
- [ ] Confirm homeowner receives SMS confirmation (if Twilio configured)

**Contractor Signup:**
- [ ] Sign up with a new email
- [ ] Verify email verification flow works
- [ ] Complete all 5 onboarding steps
- [ ] Test Pay Per Lead signup (no checkout)
- [ ] Test Pro signup (Stripe checkout with test card `4242 4242 4242 4242`)
- [ ] Test Elite signup (Stripe checkout)
- [ ] Confirm webhook updates contractor plan in Supabase

**Lead Claiming:**
- [ ] Log in as contractor and view available leads
- [ ] Test Elite claim (free, immediate)
- [ ] Test Pro claim under cap (free)
- [ ] Test Pro claim over cap (requires $25 payment)
- [ ] Test Pay Per Lead claim (requires $45 payment)
- [ ] Confirm full contact info revealed after claiming
- [ ] Test CSV export of claimed leads
- [ ] Test click-to-call button on mobile

**Admin Panel:**
- [ ] Access `/admin?admin_key=YOUR_PASSWORD`
- [ ] Verify all metrics are correct
- [ ] Invalidate a test lead
- [ ] Adjust a contractor's plan manually

**Stripe Webhooks:**
- [ ] Use Stripe CLI to replay webhook events in production
- [ ] Confirm `payment_intent.succeeded` correctly claims lead in DB
- [ ] Confirm `invoice.payment_failed` sets status to `past_due`
- [ ] Confirm `customer.subscription.deleted` sets status to `canceled`

---

### 8. Go-Live Checklist

- [ ] Switch Stripe from Test Mode to Live Mode (update all Stripe env vars)
- [ ] Confirm Stripe webhook is registered with live URL in Live Mode
- [ ] Create real Stripe products in Live Mode and update price IDs
- [ ] Set up Google Analytics or your preferred analytics
- [ ] Review and test all email templates with real email addresses
- [ ] Set a strong, unique `ADMIN_PASSWORD`
- [ ] Set a strong, unique `CRON_SECRET`
- [ ] Consider adding rate limiting to the `/api/leads/submit` endpoint
- [ ] Add Stripe.js Payment Element to replace the ClaimLeadModal placeholder
  - Install: `npm install @stripe/stripe-js @stripe/react-stripe-js`
  - Mount the Payment Element in `ClaimLeadModal.tsx`

---

### 9. Stripe Payment Element Integration (Required for Production)

The `ClaimLeadModal.tsx` has a placeholder for the Stripe Payment Element.
To complete this:

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

Then in `ClaimLeadModal.tsx`, replace the placeholder with:

```tsx
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Wrap the payment form in <Elements stripe={stripePromise} options={{ clientSecret }}>
// Use useStripe() and confirmPayment() to complete the payment
```

---

### 10. Optional Production Hardening

- [ ] Add rate limiting on `/api/leads/submit` (e.g., via Vercel Edge middleware or Upstash)
- [ ] Add Cloudflare WAF in front of Vercel for DDoS protection
- [ ] Set up Sentry for error monitoring
- [ ] Configure Supabase database backups (enabled by default on paid plans)
- [ ] Set up uptime monitoring (e.g., Better Uptime, Checkly)
- [ ] Add Google reCAPTCHA v3 to the lead form

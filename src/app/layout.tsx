import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'TradeReach — Home Service Leads for Contractors',
    template: '%s | TradeReach',
  },
  description: 'Connect with homeowners who need roofing, HVAC, and plumbing services. Real leads. Verified homeowners. Close more jobs.',
  keywords: ['home service leads', 'roofing leads', 'HVAC leads', 'plumbing leads', 'contractor leads'],
  openGraph: {
    title: 'TradeReach — Home Service Leads',
    description: 'Stop chasing cold leads. Start closing warm ones.',
    type: 'website',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TradeReach',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'theme-color': '#030712',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-950 text-gray-900 antialiased">
        {children}

        {/*
          Scroll-reveal + quiz trigger — tiny inline script, no bundle cost.
          Uses IntersectionObserver (native, zero-dependency, GPU-accelerated).
        */}
        <Script id="tradereach-interactions" strategy="afterInteractive">{`
          (function() {
            // ── Scroll Reveal ──────────────────────────────────────────────
            var io = new IntersectionObserver(function(entries) {
              entries.forEach(function(e) {
                if (e.isIntersecting) {
                  e.target.classList.add('in-view');
                  io.unobserve(e.target);
                }
              });
            }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

            function observeAll() {
              document.querySelectorAll('.reveal-up:not(.in-view)').forEach(function(el) {
                io.observe(el);
              });
            }
            observeAll();

            // Re-run on soft navigations (Next.js router)
            var origPush = history.pushState;
            history.pushState = function() {
              origPush.apply(history, arguments);
              setTimeout(observeAll, 100);
            };

            // ── Quiz Trigger — open popup on CTA click ─────────────────────
            document.addEventListener('click', function(e) {
              var target = e.target;
              while (target && target !== document) {
                if (target.getAttribute && target.getAttribute('data-quiz-trigger') === 'true') {
                  e.preventDefault();
                  var evt = new CustomEvent('open-quiz', { bubbles: true });
                  document.dispatchEvent(evt);
                  return;
                }
                target = target.parentElement;
              }
            }, { passive: false });

            // ── Haptic feedback for supported devices ──────────────────────
            document.addEventListener('click', function(e) {
              var target = e.target;
              while (target && target !== document) {
                if (
                  target.classList &&
                  (target.classList.contains('cta-btn') || target.classList.contains('premium-card'))
                ) {
                  if (navigator.vibrate) navigator.vibrate(8);
                  return;
                }
                target = target.parentElement;
              }
            }, { passive: true });
          })();
        `}</Script>
      </body>
    </html>
  )
}

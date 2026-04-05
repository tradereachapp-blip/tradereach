// New email templates for pricing/territory v2
// Send via sendEmail() from index.ts

export const emailTemplates = {
  monthlyCreditsGranted: (contractor: any, creditAmount: number, newBalance: number, rolloverMax: number) => ({
    subject: `${creditAmount} Free Credits Added to Your TradeReach Account`,
    html: `<h2>Monthly Credits Granted</h2><p>Hi ${contractor.company_name},</p><p>Your monthly grant of ${creditAmount} credits has been added. Your new balance is ${newBalance}/${rolloverMax} credits.</p><p>Credits reset monthly and unused credits roll over (capped at ${rolloverMax}). Use them wisely!</p>`,
  }),

  lowCreditWarning: (contractor: any, creditsUsed: number, monthlyGrant: number) => ({
    subject: `Warning: You\'ve Used ${Math.round((creditsUsed / monthlyGrant) * 100)}% of Your Monthly Credits`,
    html: `<h2>Low Credit Alert</h2><p>Hi ${contractor.company_name},</p><p>You\'ve used ${creditsUsed} out of ${monthlyGrant} credits this month. Claiming more leads will trigger overage charges at $${38} per lead.</p>`,
  }),

  unusedCreditsNotification: (contractor: any, creditsRemaining: number) => ({
    subject: `You Have ${creditsRemaining} Unused Credits`,
    html: `<h2>Unused Credits</h2><p>Hi ${contractor.company_name},</p><p>You have ${creditsRemaining} unused credits this month. Credits expire at month-end, so log in and claim leads now!</p>`,
  }),

  cancellationEmail: (contractor: any) => ({
    subject: 'We\'ll Miss You. Your Subscription Has Been Cancelled.',
    html: `<h2>Subscription Cancelled</h2><p>Hi ${contractor.company_name},</p><p>Your subscription will be cancelled at the end of your billing period. Your territory will be released and available to other contractors.</p>`,
  }),

  winBackEmail: (contractor: any, daysSinceCancellation: number) => ({
    subject: daysSinceCancellation === 30 ? 'Come Back to TradeReach' : 'One Last Chance: 90 Days to Resubscribe',
    html: `<h2>${daysSinceCancellation === 30 ? 'We Miss You!' : 'Last Chance!'}</h2><p>Hi ${contractor.company_name},</p><p>${daysSinceCancellation === 30 ? 'It\'s been 30 days since you cancelled. Leads in your area are piling up. Come back and claim them!' : 'It\'s been 90 days. Your territory has been reassigned, but we\'d love to have you back!'}</p>`,
  }),

  accountManagerWelcome: (contractor: any, managerName: string) => ({
    subject: `Welcome to Elite Plus, ${contractor.company_name}! Meet Your Account Manager`,
    html: `<h2>Elite Plus Welcome</h2><p>Hi ${contractor.company_name},</p><p>Welcome to Elite Plus! ${managerName} is your dedicated account manager and will be reaching out shortly to set up your monthly performance reviews and support your growth.</p>`,
  }),

  accountManagerReview: (contractor: any, claimsThisMonth: number, creditsUsed: number) => ({
    subject: `Monthly Performance Review: ${claimsThisMonth} Leads Claimed`,
    html: `<h2>Your Monthly Report</h2><p>Hi ${contractor.company_name},</p><p>This month you claimed ${claimsThisMonth} leads and used ${creditsUsed} credits. Keep up the great work!</p>`,
  }),

  upgradeConfirmation: (contractor: any, newPlan: string, creditsAfterUpgrade: number) => ({
    subject: `Upgrade Confirmed: Welcome to ${newPlan}!`,
    html: `<h2>Plan Upgrade Confirmed</h2><p>Hi ${contractor.company_name},</p><p>Your upgrade to ${newPlan} is confirmed. Your credits have been adjusted to ${creditsAfterUpgrade}. Enjoy your new features!</p>`,
  }),

  zipTerritoryChange: (contractor: any, changedZips: string[], newStatus: string) => ({
    subject: 'Your Territory Has Changed',
    html: `<h2>Territory Update</h2><p>Hi ${contractor.company_name},</p><p>Your status in ZIPs ${changedZips.join(', ')} has changed to ${newStatus}. You may need to review your settings.</p>`,
  }),
}

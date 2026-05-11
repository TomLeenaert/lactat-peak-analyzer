// Common disposable / temporary email domains. Not exhaustive but catches the
// vast majority of throwaway services used for fake signups.
export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  'mailinator.com', 'mailinator.net', 'mailinator.org',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempmailo.com',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'sharklasers.com',
  '10minutemail.com', '10minutemail.net', '20minutemail.com',
  'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'throwawaymail.com', 'getnada.com', 'nada.email', 'inboxbear.com',
  'maildrop.cc', 'fakeinbox.com', 'trashmail.com', 'trashmail.de',
  'dispostable.com', 'mailnesia.com', 'mintemail.com',
  'mohmal.com', 'emailondeck.com', 'mytrashmail.com',
  'discard.email', 'discardmail.com', 'spam4.me',
  'spambox.us', 'tempr.email', 'tempmailaddress.com', 'tmpmail.org', 'tmpmail.net',
  'mailcatch.com', 'mvrht.net', 'mailnull.com', 'fakemail.net',
  'emltmp.com', 'getairmail.com', 'mailbox.org', 'inbox.lv',
  'tutamail.com', 'cock.li', 'opayq.com',
  'okook.com', // appeared in bounce — invalid domain
]);

export const isDisposableEmail = (email: string): boolean => {
  const domain = email.toLowerCase().trim().split('@')[1];
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
};

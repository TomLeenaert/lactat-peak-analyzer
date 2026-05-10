import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Per-tab session id so we can distinguish unique visitors loosely
const getSid = () => {
  try {
    let sid = sessionStorage.getItem('mlt_sid');
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem('mlt_sid', sid);
    }
    return sid;
  } catch {
    return null;
  }
};

const PageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Skip admin route to avoid self-counting
    if (location.pathname.startsWith('/admin')) return;
    const sid = getSid();
    (supabase.rpc as any)('log_event', {
      _event_type: 'page_view',
      _metadata: {
        path: location.pathname,
        sid,
        ref: typeof document !== 'undefined' ? document.referrer || null : null,
      },
    }).then(() => {}, () => {});
  }, [location.pathname]);

  return null;
};

export default PageViewTracker;

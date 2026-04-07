import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { usePersonalization } from '../context/PersonalizationContext';
import { appRoutes } from '../lib/routes';

const isTrackedPublicPath = (pathname: string) =>
  pathname !== appRoutes.login && !pathname.startsWith(appRoutes.admin);

const PersonalizationRouteTracker: React.FC = () => {
  const location = useLocation();
  const { locale } = useLocale();
  const { trackEvent } = usePersonalization();

  useEffect(() => {
    if (!isTrackedPublicPath(location.pathname)) {
      return;
    }

    const route = `${location.pathname}${location.search}`;
    void trackEvent(
      {
        entityType: 'page',
        action: 'view',
        locale,
        route
      },
      {
        dedupeKey: `page:${route}`,
        dedupeTtlMs: 1200
      }
    );
  }, [locale, location.pathname, location.search, trackEvent]);

  return null;
};

export default PersonalizationRouteTracker;

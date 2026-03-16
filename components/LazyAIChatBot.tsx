import React, { Suspense, lazy, useEffect, useState } from 'react';

const AIChatBot = lazy(() => import('./AIChatBot'));

const LazyAIChatBot: React.FC = () => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [openRequestId, setOpenRequestId] = useState(0);

  useEffect(() => {
    const handleToggle = () => {
      setShouldLoad(true);
      setOpenRequestId((current) => current + 1);
    };

    window.addEventListener('toggle-foodmax-chat', handleToggle);
    return () => window.removeEventListener('toggle-foodmax-chat', handleToggle);
  }, []);

  if (!shouldLoad) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AIChatBot openRequestId={openRequestId} />
    </Suspense>
  );
};

export default LazyAIChatBot;

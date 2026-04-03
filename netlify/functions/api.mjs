import serverless from 'serverless-http';

import { createApp } from '../../server/index.mjs';

let cachedHandlerPromise;

const getHandler = async () => {
  if (!cachedHandlerPromise) {
    cachedHandlerPromise = createApp({
      serveStatic: false,
      enableLocalUploads: false
    }).then((app) =>
      serverless(app, {
        provider: 'aws'
      })
    );
  }

  return cachedHandlerPromise;
};

export const handler = async (event, context) => {
  const runtimeHandler = await getHandler();
  return runtimeHandler(event, context);
};

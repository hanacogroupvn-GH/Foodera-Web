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
  try {
    const runtimeHandler = await getHandler();
    return await runtimeHandler(event, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Netlify function bootstrap failed.';
    console.error('Netlify API handler failed.', error);
    return {
      statusCode: 500,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store'
      },
      body: JSON.stringify({
        error: message
      })
    };
  }
};

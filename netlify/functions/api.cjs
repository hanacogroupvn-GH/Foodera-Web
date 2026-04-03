const path = require('node:path');
const { pathToFileURL } = require('node:url');

const serverless = require('serverless-http');

let cachedHandlerPromise;

const getHandler = async () => {
  if (!cachedHandlerPromise) {
    cachedHandlerPromise = (async () => {
      const entryUrl = pathToFileURL(path.join(__dirname, '../../server/index.mjs')).href;
      const { createApp } = await import(entryUrl);
      const app = await createApp({
        serveStatic: false,
        enableLocalUploads: false
      });

      return serverless(app, {
        provider: 'aws'
      });
    })();
  }

  return cachedHandlerPromise;
};

exports.handler = async (event, context) => {
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

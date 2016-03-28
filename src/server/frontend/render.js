import 'babel-polyfill';
import Helmet from 'react-helmet';
import Html from './Html.react';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import config from '../config';
import configureStore from '../../common/configureStore';
import createRoutes from '../../browser/createRoutes';
import loadMessages from '../intl/loadMessages';
import serialize from 'serialize-javascript';
import { Provider } from 'react-redux';
import { createMemoryHistory, match, RouterContext } from 'react-router';
import { routerMiddleware, syncHistoryWithStore } from 'react-router-redux';

const messages = loadMessages();

const getAppHtml = (store, renderProps) =>
  ReactDOMServer.renderToString(
    <Provider store={store}>
      <RouterContext {...renderProps} />
    </Provider>
  );

const intlPolyfillFeatures = config.locales
  .map(locale => `Intl.~locale.${locale}`)
  .join();

const getScriptHtml = (state, headers, hostname, appJsFilename) =>
  // https://github.com/yahoo/serialize-javascript#user-content-automatic-escaping-of-html-characters
  // https://github.com/andyearnshaw/Intl.js/#intljs-and-ft-polyfill-service
  `
    <script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=${
      intlPolyfillFeatures
    }"></script>
    <script>
      window.__INITIAL_STATE__ = ${serialize(state)};
    </script>
    <script src="${appJsFilename}"></script>
  `;

const renderPage = (store, renderProps, req) => {
  const state = store.getState();
  if (process.env.IS_SERVERLESS) {
    // No server routing for server-less apps.
    delete state.routing;
  }
  const { headers, hostname } = req;
  const appHtml = getAppHtml(store, renderProps);
  const helmet = Helmet.rewind();
  const {
    styles: { app: appCssFilename },
    javascript: { app: appJsFilename }
  } = webpackIsomorphicTools.assets();
  const scriptHtml = getScriptHtml(state, headers, hostname, appJsFilename);
  if (!config.isProduction) {
    webpackIsomorphicTools.refresh();
  }
  const docHtml = ReactDOMServer.renderToStaticMarkup(
    <Html
      appCssFilename={appCssFilename}
      bodyHtml={`<div id="app">${appHtml}</div>${scriptHtml}`}
      googleAnalyticsId={config.googleAnalyticsId}
      helmet={helmet}
      isProduction={config.isProduction}
    />
  );
  return `<!DOCTYPE html>${docHtml}`;
};

export default function render(req, res, next) {
  const currentLocale = process.env.IS_SERVERLESS
    ? config.defaultLocale
    : req.acceptsLanguages(config.locales) || config.defaultLocale;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const initialState = {
    config: {
      appName: config.appName,
      firebaseUrl: config.firebaseUrl
    },
    intl: {
      currentLocale,
      locales: config.locales,
      messages
    },
    device: {
      host: `${protocol}://${req.headers.host}`
    }
  };
  const memoryHistory = createMemoryHistory(req.originalUrl);
  const store = configureStore({
    initialState,
    platformMiddleware: [routerMiddleware(memoryHistory)]
  });
  const history = syncHistoryWithStore(memoryHistory, store);
  // Fetch and dispatch current user here because routes may need it.
  const routes = createRoutes(store.getState);
  const location = req.url;

  match({ history, routes, location }, async (error, redirectLocation, renderProps) => {
    if (redirectLocation) {
      res.redirect(301, redirectLocation.pathname + redirectLocation.search);
      return;
    }

    if (error) {
      next(error);
      return;
    }

    try {
      const html = renderPage(store, renderProps, req);
      // renderProps are always defined with * route.
      // https://github.com/rackt/react-router/blob/master/docs/guides/advanced/ServerRendering.md
      const status = renderProps.routes.some(route => route.path === '*')
        ? 404
        : 200;
      res.status(status).send(html);
    } catch (e) {
      next(e);
    }
  });
}

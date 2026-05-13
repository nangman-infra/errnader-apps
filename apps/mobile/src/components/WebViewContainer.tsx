import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import type { WebViewErrorEvent, WebViewHttpErrorEvent } from 'react-native-webview/lib/WebViewTypes';
import { WEB_APP_DEV_URL, WEB_APP_PROD_URL } from '@errander/shared';
import { useWebViewBridge } from '../hooks/useWebViewBridge';
import { useAppStore } from '../stores/appStore';

function getDevWebAppUrl() {
  const explicitWebAppUrl = process.env.EXPO_PUBLIC_WEB_APP_DEV_URL?.trim();
  return explicitWebAppUrl || WEB_APP_DEV_URL;
}

const WEB_APP_URL = __DEV__ ? getDevWebAppUrl() : WEB_APP_PROD_URL;
const WEB_DEBUG_PREFIX = '__ERRANDER_WEB_DEBUG__';
const WEB_DEBUG_SCRIPT = `
  (function () {
    var sendDebug = function (payload) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: '${WEB_DEBUG_PREFIX}',
          payload: payload
        }));
      } catch (error) {}
    };

    window.addEventListener('error', function (event) {
      sendDebug({
        kind: 'js-error',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno
      });
    });

    window.addEventListener('unhandledrejection', function (event) {
      var reason = event.reason && event.reason.message ? event.reason.message : String(event.reason);
      sendDebug({
        kind: 'promise-rejection',
        message: reason
      });
    });

    var originalConsoleError = console.error;
    var originalConsoleLog = console.log;
    console.error = function () {
      try {
        sendDebug({
          kind: 'console-error',
          message: Array.prototype.map.call(arguments, function (arg) {
            return typeof arg === 'string' ? arg : JSON.stringify(arg);
          }).join(' ')
        });
      } catch (error) {}
      return originalConsoleError.apply(console, arguments);
    };

    console.log = function () {
      try {
        sendDebug({
          kind: 'console-log',
          message: Array.prototype.map.call(arguments, function (arg) {
            return typeof arg === 'string' ? arg : JSON.stringify(arg);
          }).join(' ')
        });
      } catch (error) {}
      return originalConsoleLog.apply(console, arguments);
    };

    window.addEventListener('load', function () {
      sendDebug({
        kind: 'window-load',
        href: window.location.href,
        styleSheetCount: document.styleSheets ? document.styleSheets.length : 0
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('link[rel="stylesheet"]'), function (node) {
      node.addEventListener('load', function () {
        sendDebug({
          kind: 'css-load',
          href: node.href
        });
      });
      node.addEventListener('error', function () {
        sendDebug({
          kind: 'css-error',
          href: node.href
        });
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('script[src]'), function (node) {
      node.addEventListener('load', function () {
        sendDebug({
          kind: 'script-load',
          href: node.src
        });
      });
      node.addEventListener('error', function () {
        sendDebug({
          kind: 'script-error',
          href: node.src
        });
      });
    });

    window.__ERRANDER_SEND_WEB_DEBUG__ = sendDebug;
  })();
  true;
`;

const WEB_STATUS_SCRIPT = `
  (function () {
    var sendStatus = function (kind) {
      var root = document.getElementById('root');
      var main = document.querySelector('main');
      var title = document.querySelector('h1');
      var input = document.querySelector('input');
      var button = document.querySelector('button[type="submit"]');
      var links = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]')).map(function (node) {
        return node.href;
      });
      var scripts = Array.prototype.slice.call(document.querySelectorAll('script[src]')).map(function (node) {
        return node.src;
      });
      var describeStyle = function (element) {
        if (!element) return null;
        var style = window.getComputedStyle(element);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          borderRadius: style.borderRadius,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          minHeight: style.minHeight,
          paddingTop: style.paddingTop,
          display: style.display
        };
      };
      var payload = {
        kind: kind,
        href: window.location.href,
        readyState: document.readyState,
        styleSheetCount: document.styleSheets ? document.styleSheets.length : 0,
        scriptCount: scripts.length,
        rootChildCount: root ? root.childElementCount : -1,
        title: document.title,
        cssLinks: links,
        scriptSrcs: scripts,
        mainStyle: describeStyle(main),
        titleStyle: describeStyle(title),
        inputStyle: describeStyle(input),
        buttonStyle: describeStyle(button)
      };
      if (window.__ERRANDER_SEND_WEB_DEBUG__) {
        window.__ERRANDER_SEND_WEB_DEBUG__(payload);
      }
    };
    sendStatus('dom-status');
    window.setTimeout(function () { sendStatus('dom-status-500ms'); }, 500);
    window.setTimeout(function () { sendStatus('dom-status-1500ms'); }, 1500);
  })();
  true;
`;

export function WebViewContainer() {
  const webViewRef = useRef<WebView>(null);
  const { handleMessage } = useWebViewBridge(webViewRef);
  const setWebViewReady = useAppStore((s) => s.setWebViewReady);
  const [nativeDebugInfo, setNativeDebugInfo] = useState<string>(() => `native mounted\nurl: ${WEB_APP_URL}`);
  const webViewSource = useMemo(() => ({ uri: WEB_APP_URL }), []);

  useEffect(() => {
    const mountedMessage = `native mounted\nurl: ${WEB_APP_URL}`;
    console.warn('[WebView native mount]', mountedMessage);
    setNativeDebugInfo(mountedMessage);
  }, []);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 5000);

    async function probeWebAppUrl() {
      try {
        console.warn('[WebView native probe start]', WEB_APP_URL);
        const response = await fetch(WEB_APP_URL, {
          method: 'GET',
          signal: abortController.signal,
        });
        const html = await response.text();
        const preview = html.replace(/\s+/g, ' ').slice(0, 120);
        const assetMatches = Array.from(
          html.matchAll(/<(?:script|link)[^>]+(?:src|href)=["']([^"'#?]+)["']/gi),
          (match) => match[1],
        );
        const assetUrls = assetMatches.map((assetPath) => new URL(assetPath, WEB_APP_URL).toString());
        const assetProbeResults = await Promise.all(
          assetUrls.slice(0, 4).map(async (assetUrl) => {
            try {
              const assetResponse = await fetch(assetUrl, {
                method: 'GET',
                signal: abortController.signal,
              });
              return `asset: ${assetResponse.status} ${assetUrl}`;
            } catch (assetError) {
              const assetMessage = assetError instanceof Error ? assetError.message : String(assetError);
              return `asset error: ${assetMessage} ${assetUrl}`;
            }
          }),
        );
        const probeMessage = [
          `probe: ${response.status} ${response.ok ? 'ok' : 'not-ok'}`,
          `url: ${WEB_APP_URL}`,
          `content-type: ${response.headers.get('content-type') ?? 'unknown'}`,
          `html: ${preview || '(empty)'}`,
          ...assetProbeResults,
        ].join('\n');
        console.warn('[WebView native probe success]', probeMessage);
        setNativeDebugInfo((currentMessage) => `${currentMessage}\n---\n${probeMessage}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const probeMessage = `probe error: ${message}\nurl: ${WEB_APP_URL}`;
        console.warn('[WebView native probe error]', probeMessage);
        setNativeDebugInfo((currentMessage) => `${currentMessage}\n---\n${probeMessage}`);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    probeWebAppUrl();

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, []);

  function handleLoadError(event: WebViewErrorEvent) {
    setWebViewReady(false);
    console.warn('[WebView load error]', event.nativeEvent);
    const nextMessage = `load error: ${event.nativeEvent.description} (${event.nativeEvent.code})\n${event.nativeEvent.url}`;
    setNativeDebugInfo(nextMessage);
  }

  function handleHttpError(event: WebViewHttpErrorEvent) {
    setWebViewReady(false);
    console.warn('[WebView http error]', event.nativeEvent);
    const nextMessage = `http error: ${event.nativeEvent.statusCode}\n${event.nativeEvent.url}`;
    setNativeDebugInfo(nextMessage);
  }

  function handleWebViewMessage(event: WebViewMessageEvent) {
    try {
      const parsed = JSON.parse(event.nativeEvent.data);
      if (parsed?.type === WEB_DEBUG_PREFIX) {
        const payload = parsed.payload ?? {};
        console.warn('[WebView debug]', payload);
        const nextMessage = [
          payload.kind ? `kind: ${payload.kind}` : null,
          payload.message ? `message: ${payload.message}` : null,
          payload.href ? `href: ${payload.href}` : null,
          payload.readyState ? `readyState: ${payload.readyState}` : null,
          typeof payload.styleSheetCount === 'number' ? `stylesheets: ${payload.styleSheetCount}` : null,
          typeof payload.scriptCount === 'number' ? `scripts: ${payload.scriptCount}` : null,
          typeof payload.rootChildCount === 'number' ? `root children: ${payload.rootChildCount}` : null,
          payload.mainStyle ? `main bg: ${payload.mainStyle.backgroundColor}` : null,
          payload.titleStyle ? `h1 size: ${payload.titleStyle.fontSize}` : null,
          payload.inputStyle ? `input radius: ${payload.inputStyle.borderRadius}` : null,
          payload.buttonStyle ? `button bg: ${payload.buttonStyle.backgroundColor}` : null,
          payload.source ? `source: ${payload.source}:${payload.line}:${payload.column}` : null,
        ].filter(Boolean).join('\n');
        setNativeDebugInfo(nextMessage);
        return;
      }
    } catch {}

    handleMessage(event);
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={webViewSource}
        originWhitelist={['*']}
        style={styles.webView}
        cacheEnabled={!__DEV__}
        textZoom={100}
        onMessage={handleWebViewMessage}
        onLoadStart={() => {
          const nextMessage = `loading: ${WEB_APP_URL}`;
          console.warn('[WebView load start]', WEB_APP_URL);
          setNativeDebugInfo(nextMessage);
        }}
        onLoad={() => {
          setWebViewReady(true);
          const nextMessage = `load success: ${WEB_APP_URL}`;
          console.warn('[WebView load success]', WEB_APP_URL);
          setNativeDebugInfo(nextMessage);
          webViewRef.current?.injectJavaScript(WEB_STATUS_SCRIPT);
        }}
        onLoadProgress={(event) => {
          console.warn('[WebView progress]', event.nativeEvent.progress, event.nativeEvent.url);
        }}
        onError={handleLoadError}
        onHttpError={handleHttpError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        injectedJavaScriptBeforeContentLoaded={WEB_DEBUG_SCRIPT}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

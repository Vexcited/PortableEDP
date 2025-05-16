// @ts-expect-error : not typed
window.navigator.__defineGetter__("platform", () => "Win64"); // Matches the User-Agent.

window.__EDP_APP__ = {
  version: "0.1.0",
  LOGIN_GTK: null,
  LOGIN_COOKIES: [],
};

/// Replicate the way the extension works by sending the same payload
/// to the app, to make sure the app can handle the same payload.
const sendPayloadAsExtension = <T>(payload: T): void => {
  window.postMessage(
    {
      type: "EDPU_MESSAGE",
      payload,
    },
    "*",
  );
};

(async () => {
  /// Prevent running anything if we're in an <iframe>
  if (window.self !== window.top) {
    // @ts-expect-error : not typed
    window.__TAURI_POST_MESSAGE__ = () => {
      return null;
    };

    return;
  }

  while (!window.__TAURI__) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  window.__FETCH__ = window.fetch;
  window.fetch = async (init, options = {}) => {
    const { http } = window.__TAURI__;

    const currentUrl = init instanceof Request ? init.url : init.toString();
    console.log("calling", currentUrl);

    if (!currentUrl.includes("api.ecoledirecte.com")) {
      return window.__FETCH__(init, options);
    }

    const headers = new Headers(options.headers || {});
    headers.set("Origin", "https://www.ecoledirecte.com");

    /// Handle a special case where we have to send the GTK cookie during login.
    if (currentUrl.includes("/v3/login.awp?v=")) {
      headers.set("Cookie", window.__EDP_APP__.LOGIN_COOKIES.join("; "));
      headers.set("X-GTK", window.__EDP_APP__.LOGIN_GTK as string);
    }

    options.headers = headers;
    const response: Response = await http.fetch(init, options);

    /// Handle a special case where we have to catch GTK cookie on first login request.
    if (currentUrl.includes("/v3/login.awp?gtk=1&v=")) {
      const cookies = response.headers.getSetCookie() as string[];

      window.__EDP_APP__.LOGIN_COOKIES = cookies.map((parameters) => {
        return parameters.split(";")[0];
      });

      window.__EDP_APP__.LOGIN_GTK = window.__EDP_APP__.LOGIN_COOKIES.find(
        (cookie) => {
          return cookie.startsWith("GTK=");
        },
      )!.split("=")[1];

      sendPayloadAsExtension({ action: "gtkRulesUpdated" });
    }

    return response;
  };

  document.addEventListener("DOMContentLoaded", async () => {
    /// Make sure we allow the app to understand we have
    /// an extension configured.
    document.documentElement.classList.add("edp-unblock");
  });
})();

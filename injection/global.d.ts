export {};

declare global {
  interface Window {
    __EDP_APP__: {
      version: string;
      LOGIN_GTK: string | null;
      LOGIN_COOKIES: Array<string>;
    };

    __FETCH__: window["fetch"];

    __TAURI__: {
      http: {
        fetch: window["fetch"];
      };
    };
  }
}

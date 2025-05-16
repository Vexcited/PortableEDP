use include_flate::flate;
use tauri::{App, WebviewUrl, WebviewWindowBuilder};
use url::Url;

flate!(pub static INJECTION: str from "./dist/index.js");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_url = Url::parse("https://ecole-directe.plus/login").unwrap();
    let app_url_external = WebviewUrl::External(app_url);
    let injection = INJECTION.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![])
        .setup(move |app: &mut App| {
            WebviewWindowBuilder::new(app, "main", app_url_external)
                .title("Ecole Directe Plus")
                .resizable(true)
                .disable_drag_drop_handler()
                .decorations(true)
                .shadow(true)
                .inner_size(1280.0, 720.0)
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36")
                .initialization_script(
                    format!(
                        r#"
                  if (!window.__EDP_APP_INIT__) {{
                  window.__EDP_APP_INIT__ = true;
                    {injection}
                  }}
                "#
                    )
                    .as_str(),
                )
                .build()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

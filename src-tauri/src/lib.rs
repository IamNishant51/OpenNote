mod commands;
mod db;

use db::Database;
use reqwest::Client;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).ok();
            let db_path = app_dir.join("opennotes.db");
            let database = Database::new(db_path.to_str().unwrap()).expect("Failed to initialize database");
            app.manage(database);
            let client = Client::builder().timeout(std::time::Duration::from_secs(60)).build().unwrap();
            app.manage(client);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_workspaces, commands::get_pages, commands::create_page,
            commands::get_page, commands::update_page, commands::toggle_favorite,
            commands::trash_page, commands::restore_page, commands::get_trashed_pages,
            commands::delete_page_permanently,
            commands::get_database, commands::get_properties, commands::create_property,
            commands::update_property, commands::delete_property, commands::get_items,
            commands::create_item, commands::update_item, commands::delete_item,
            commands::get_item_properties, commands::get_item_properties_batch, commands::update_item_property, commands::get_views,
            commands::get_comments, commands::create_comment, commands::resolve_comment,
            commands::delete_comment, commands::get_page_versions, commands::create_page_version,
            commands::get_templates, commands::create_template, commands::seed_templates,
            commands::search_pages, commands::reindex_search,
            commands::share_page, commands::update_share_permission, commands::remove_share, commands::get_page_shares,
            commands::get_notifications, commands::create_notification, commands::mark_notification_read, commands::mark_all_notifications_read,
            commands::get_document_state, commands::save_document_state,
            commands::proxy_ai_request_stream,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

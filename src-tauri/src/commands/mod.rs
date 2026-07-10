use crate::db::{Database, Page, Workspace, Database_, DBProperty, DBItem, DBItemProperty, DBView, Comment, PageVersion, Template, Share, Notification_};
use tauri::State;
use std::collections::HashMap;

#[tauri::command]
pub fn get_workspaces(db: State<'_, Database>) -> Result<Vec<Workspace>, String> { db.get_workspaces().map_err(|e| e.to_string()) }
#[tauri::command]
pub fn get_pages(db: State<'_, Database>, workspace_id: String) -> Result<Vec<Page>, String> { db.get_pages(&workspace_id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn create_page(db: State<'_, Database>, workspace_id: String, parent_id: Option<String>, title: String, is_database: bool) -> Result<Page, String> { db.create_page(&workspace_id, parent_id.as_deref(), &title, is_database).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn get_page(db: State<'_, Database>, id: String) -> Result<Page, String> { db.get_page_by_id(&id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn update_page(db: State<'_, Database>, id: String, title: String, icon: String, font: String, width: String, is_favorite: bool) -> Result<(), String> { db.update_page(&id, &title, &icon, &font, &width, is_favorite).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn toggle_favorite(db: State<'_, Database>, id: String) -> Result<bool, String> { db.toggle_favorite(&id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn trash_page(db: State<'_, Database>, id: String) -> Result<(), String> { db.trash_page(&id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn restore_page(db: State<'_, Database>, id: String) -> Result<(), String> { db.restore_page(&id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn get_trashed_pages(db: State<'_, Database>, workspace_id: String) -> Result<Vec<Page>, String> { db.get_trashed_pages(&workspace_id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn delete_page_permanently(db: State<'_, Database>, id: String) -> Result<(), String> { db.delete_page_permanently(&id).map_err(|e| e.to_string()) }

// Database commands
#[tauri::command]
pub fn get_database(db: State<'_, Database>, page_id: String) -> Result<Database_, String> { db.get_database(&page_id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn get_properties(db: State<'_, Database>, database_id: String) -> Result<Vec<DBProperty>, String> { db.get_properties(&database_id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn create_property(db: State<'_, Database>, database_id: String, name: String, prop_type: String) -> Result<DBProperty, String> { db.create_property(&database_id, &name, &prop_type).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn update_property(db: State<'_, Database>, id: String, name: String, options: String) -> Result<(), String> { db.update_property(&id, &name, &options).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn delete_property(db: State<'_, Database>, id: String) -> Result<(), String> { db.delete_property(&id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn get_items(db: State<'_, Database>, database_id: String) -> Result<Vec<DBItem>, String> { db.get_items(&database_id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn create_item(db: State<'_, Database>, database_id: String, title: String) -> Result<DBItem, String> { db.create_item(&database_id, &title).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn update_item(db: State<'_, Database>, id: String, title: String) -> Result<(), String> { db.update_item(&id, &title).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn delete_item(db: State<'_, Database>, id: String) -> Result<(), String> { db.delete_item(&id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn get_item_properties(db: State<'_, Database>, item_id: String) -> Result<Vec<DBItemProperty>, String> { db.get_item_properties(&item_id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn get_item_properties_batch(db: State<'_, Database>, item_ids: Vec<String>) -> Result<Vec<DBItemProperty>, String> { db.get_item_properties_batch(&item_ids).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn update_item_property(db: State<'_, Database>, item_id: String, property_id: String, value: String) -> Result<(), String> { db.update_item_property(&item_id, &property_id, &value).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn get_views(db: State<'_, Database>, database_id: String) -> Result<Vec<DBView>, String> { db.get_views(&database_id).map_err(|e| e.to_string()) }

// Comments
#[tauri::command]
pub fn get_comments(db: State<'_, Database>, page_id: String) -> Result<Vec<Comment>, String> { db.get_comments(&page_id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn create_comment(db: State<'_, Database>, page_id: String, parent_id: Option<String>, block_id: String, author: String, content: String) -> Result<Comment, String> { db.create_comment(&page_id, parent_id.as_deref(), &block_id, &author, &content).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn resolve_comment(db: State<'_, Database>, id: String) -> Result<(), String> { db.resolve_comment(&id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn delete_comment(db: State<'_, Database>, id: String) -> Result<(), String> { db.delete_comment(&id).map_err(|e| e.to_string()) }

// Versions
#[tauri::command]
pub fn get_page_versions(db: State<'_, Database>, page_id: String) -> Result<Vec<PageVersion>, String> { db.get_page_versions(&page_id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn create_page_version(db: State<'_, Database>, page_id: String, title: String, snapshot: String) -> Result<PageVersion, String> { db.create_page_version(&page_id, &title, &snapshot).map_err(|e| e.to_string()) }

// Templates
#[tauri::command]
pub fn get_templates(db: State<'_, Database>, workspace_id: String) -> Result<Vec<Template>, String> { db.get_templates(&workspace_id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn create_template(db: State<'_, Database>, workspace_id: String, name: String, icon: String, description: String, category: String, content: String) -> Result<Template, String> { db.create_template(&workspace_id, &name, &icon, &description, &category, &content).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn seed_templates(db: State<'_, Database>, workspace_id: String) -> Result<(), String> { db.seed_templates(&workspace_id).map_err(|e| e.to_string()) }

// Search
#[tauri::command]
pub fn search_pages(db: State<'_, Database>, workspace_id: String, query: String) -> Result<Vec<Page>, String> { db.search_pages(&workspace_id, &query).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn reindex_search(db: State<'_, Database>, workspace_id: String) -> Result<(), String> { db.reindex_search(&workspace_id).map_err(|e| e.to_string()) }

// Collaboration
#[tauri::command]
pub fn share_page(db: State<'_, Database>, page_id: String, user_email: String, permission_level: String) -> Result<Share, String> { db.share_page(&page_id, &user_email, &permission_level).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn update_share_permission(db: State<'_, Database>, id: String, permission_level: String) -> Result<(), String> { db.update_share_permission(&id, &permission_level).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn remove_share(db: State<'_, Database>, id: String) -> Result<(), String> { db.remove_share(&id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn get_page_shares(db: State<'_, Database>, page_id: String) -> Result<Vec<Share>, String> { db.get_page_shares(&page_id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn get_notifications(db: State<'_, Database>, workspace_id: String) -> Result<Vec<Notification_>, String> { db.get_notifications(&workspace_id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn create_notification(db: State<'_, Database>, workspace_id: String, notif_type: String, title: String, message: String, page_id: Option<String>) -> Result<Notification_, String> { db.create_notification(&workspace_id, &notif_type, &title, &message, page_id.as_deref()).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn mark_notification_read(db: State<'_, Database>, id: String) -> Result<(), String> { db.mark_notification_read(&id).map_err(|e| e.to_string()) }
#[tauri::command]
pub fn mark_all_notifications_read(db: State<'_, Database>, workspace_id: String) -> Result<(), String> { db.mark_all_notifications_read(&workspace_id).map_err(|e| e.to_string()) }

#[tauri::command]
pub fn get_document_state(db: State<'_, Database>, page_id: String) -> Result<Option<Vec<u8>>, String> { db.get_document_state(&page_id).map_err(|e| e.to_string()) }

#[tauri::command]
pub fn save_document_state(db: State<'_, Database>, page_id: String, blob: Vec<u8>) -> Result<(), String> { db.save_document_state(&page_id, &blob).map_err(|e| e.to_string()) }

#[derive(serde::Serialize)]
pub struct StreamChunk {
    pub data: String,
    pub done: bool,
}

#[tauri::command]
pub async fn proxy_ai_request_stream(
    client: State<'_, reqwest::Client>,
    url: String,
    method: String,
    headers: HashMap<String, String>,
    body: Option<String>,
    on_event: tauri::ipc::Channel<StreamChunk>,
) -> Result<(), String> {
    let mut req = client.request(
        method.parse().map_err(|e| format!("Invalid HTTP method: {}", e))?,
        &url,
    );
    for (k, v) in &headers {
        let kl = k.to_lowercase();
        if kl != "host" && kl != "origin" {
            req = req.header(k.as_str(), v.as_str());
        }
    }
    if let Some(b) = body {
        req = req.body(b);
    }
    let mut resp = req.send().await.map_err(|e| {
        let msg = e.to_string();
        if msg.contains("dns") || msg.contains("connect") || msg.contains("timed out") || msg.contains("resolve") {
            format!("Cannot reach the AI server (network error). Check your internet connection or API URL. ({})", msg)
        } else {
            format!("Proxy request failed: {}", msg)
        }
    })?;
    
    let status = resp.status();
    if !status.is_success() {
        let error_body = resp.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        let err = format!("AI provider returned error {}: {}", status.as_u16(), error_body);
        on_event.send(StreamChunk { data: format!("__ERROR__{}", err), done: true }).ok();
        return Err(err);
    }
    
    while let Some(chunk) = resp.chunk().await.map_err(|e| format!("Read chunk error: {}", e))? {
        let chunk_str = String::from_utf8(chunk.to_vec()).map_err(|e| format!("UTF-8 error: {}", e))?;
        on_event.send(StreamChunk { data: chunk_str, done: false }).map_err(|e| format!("Channel error: {}", e))?;
    }
    on_event.send(StreamChunk { data: String::new(), done: true }).ok();
    Ok(())
}

#[tauri::command]
pub async fn test_connection(
    client: State<'_, reqwest::Client>,
    url: String,
    api_key: Option<String>,
) -> Result<u16, String> {
    let mut req = client.get(&url);
    if let Some(key) = api_key {
        if !key.is_empty() {
            req = req.header("Authorization", format!("Bearer {}", key));
        }
    }
    let resp = req.send().await.map_err(|e| format!("Connection failed: {}", e))?;
    Ok(resp.status().as_u16())
}

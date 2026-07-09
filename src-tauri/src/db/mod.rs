use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Workspace {
    pub id: String, pub name: String, pub icon: String,
    pub created_at: String, pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Page {
    pub id: String, pub workspace_id: String, pub parent_id: Option<String>,
    pub title: String, pub icon: String, pub cover: String,
    pub cover_position: f64, pub font: String, pub width: String,
    pub is_favorite: bool, pub is_trash: bool,
    pub is_database: bool,
    pub created_at: String, pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Database_ {
    pub id: String, pub page_id: String, pub title: String,
    pub created_at: String, pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DBProperty {
    pub id: String, pub database_id: String, pub name: String,
    pub prop_type: String, pub options: String, pub sort_order: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DBItem {
    pub id: String, pub database_id: String, pub title: String,
    pub sort_order: f64, pub created_at: String, pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DBItemProperty {
    pub id: String, pub item_id: String, pub property_id: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Comment {
    pub id: String, pub page_id: String, pub parent_id: Option<String>,
    pub block_id: String, pub author: String, pub content: String,
    pub resolved: bool, pub created_at: String, pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PageVersion {
    pub id: String, pub page_id: String, pub title: String,
    pub snapshot: String, pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Template {
    pub id: String, pub workspace_id: String, pub name: String,
    pub icon: String, pub description: String, pub category: String,
    pub content: String, pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Share {
    pub id: String, pub page_id: String, pub user_email: String,
    pub permission_level: String, pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Notification_ {
    pub id: String, pub workspace_id: String, pub r#type: String,
    pub title: String, pub message: String, pub page_id: Option<String>,
    pub read: bool, pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DBView {
    pub id: String, pub database_id: String, pub name: String,
    pub view_type: String, pub config: String, pub sort_order: i64,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Database { conn: Mutex::new(conn) };
        db.initialize()?;
        Ok(db)
    }

    fn initialize(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
             CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT 'Untitled', icon TEXT NOT NULL DEFAULT '📄', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));
             CREATE TABLE IF NOT EXISTS pages (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, parent_id TEXT, title TEXT NOT NULL DEFAULT '', icon TEXT NOT NULL DEFAULT '', cover TEXT NOT NULL DEFAULT '', cover_position REAL NOT NULL DEFAULT 0.0, font TEXT NOT NULL DEFAULT 'default', width TEXT NOT NULL DEFAULT 'default', is_favorite INTEGER NOT NULL DEFAULT 0, is_trash INTEGER NOT NULL DEFAULT 0, sort_order REAL NOT NULL DEFAULT 0, is_database INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE, FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE SET NULL);
CREATE TABLE IF NOT EXISTS document_states (page_id TEXT PRIMARY KEY, yjs_blob BLOB, updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE);
              CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(title, content, content='pages', content_rowid='rowid');
              CREATE TABLE IF NOT EXISTS databases (id TEXT PRIMARY KEY, page_id TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE);
              CREATE TABLE IF NOT EXISTS database_properties (id TEXT PRIMARY KEY, database_id TEXT NOT NULL, name TEXT NOT NULL, prop_type TEXT NOT NULL DEFAULT 'text', options TEXT NOT NULL DEFAULT '{}', sort_order INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (database_id) REFERENCES databases(id) ON DELETE CASCADE);
              CREATE TABLE IF NOT EXISTS database_items (id TEXT PRIMARY KEY, database_id TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', sort_order REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (database_id) REFERENCES databases(id) ON DELETE CASCADE);
              CREATE TABLE IF NOT EXISTS database_item_properties (id TEXT PRIMARY KEY, item_id TEXT NOT NULL, property_id TEXT NOT NULL, value TEXT NOT NULL DEFAULT '', FOREIGN KEY (item_id) REFERENCES database_items(id) ON DELETE CASCADE, FOREIGN KEY (property_id) REFERENCES database_properties(id) ON DELETE CASCADE);
              CREATE TABLE IF NOT EXISTS database_views (id TEXT PRIMARY KEY, database_id TEXT NOT NULL, name TEXT NOT NULL, view_type TEXT NOT NULL DEFAULT 'table', config TEXT NOT NULL DEFAULT '{}', sort_order INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (database_id) REFERENCES databases(id) ON DELETE CASCADE);
              CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, page_id TEXT NOT NULL, parent_id TEXT, block_id TEXT, author TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '', resolved INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE);
              CREATE TABLE IF NOT EXISTS page_versions (id TEXT PRIMARY KEY, page_id TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', snapshot TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE);
              CREATE TABLE IF NOT EXISTS templates (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, name TEXT NOT NULL, icon TEXT NOT NULL DEFAULT '📄', description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'general', content TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE);
              CREATE INDEX IF NOT EXISTS idx_pages_workspace ON pages(workspace_id);
              CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id);
              CREATE INDEX IF NOT EXISTS idx_db_props ON database_properties(database_id);
              CREATE INDEX IF NOT EXISTS idx_db_items ON database_items(database_id);
              CREATE INDEX IF NOT EXISTS idx_db_item_props ON database_item_properties(item_id);
              CREATE TABLE IF NOT EXISTS page_shares (id TEXT PRIMARY KEY, page_id TEXT NOT NULL, user_email TEXT NOT NULL, permission_level TEXT NOT NULL DEFAULT 'edit', created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE, UNIQUE(page_id,user_email));
              CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'info', title TEXT NOT NULL, message TEXT NOT NULL, page_id TEXT, read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE);
              CREATE INDEX IF NOT EXISTS idx_shares_page ON page_shares(page_id);
              CREATE INDEX IF NOT EXISTS idx_notifications_workspace ON notifications(workspace_id);
              CREATE INDEX IF NOT EXISTS idx_db_views ON database_views(database_id);"
        )?;
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM workspaces", [], |r| r.get(0))?;
        if count == 0 {
            let wid = uuid::Uuid::new_v4().to_string();
            conn.execute("INSERT INTO workspaces (id, name, icon) VALUES (?1,'My Workspace','📄')", params![wid])?;
            let pid = uuid::Uuid::new_v4().to_string();
            conn.execute("INSERT INTO pages (id, workspace_id, title, icon) VALUES (?1,?2,'Getting Started','👋')", params![pid, wid])?;
        }
        Ok(())
    }

    pub fn get_workspaces(&self) -> Result<Vec<Workspace>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,name,icon,created_at,updated_at FROM workspaces ORDER BY created_at")?;
        stmt.query_map([], |r| Ok(Workspace{id:r.get(0)?,name:r.get(1)?,icon:r.get(2)?,created_at:r.get(3)?,updated_at:r.get(4)?})).unwrap().collect()
    }

    pub fn get_pages(&self, workspace_id: &str) -> Result<Vec<Page>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,workspace_id,parent_id,title,icon,cover,cover_position,font,width,is_favorite,is_trash,is_database,created_at,updated_at FROM pages WHERE workspace_id=?1 AND is_trash=0 ORDER BY sort_order")?;
        stmt.query_map(params![workspace_id], |r|             Ok(Page{id:r.get(0)?,workspace_id:r.get(1)?,parent_id:r.get(2)?,title:r.get(3)?,icon:r.get(4)?,cover:r.get(5)?,cover_position:r.get(6)?,font:r.get(7)?,width:r.get(8)?,is_favorite:r.get::<_,i32>(9)?!=0,is_trash:r.get::<_,i32>(10)?!=0,is_database:r.get::<_,i32>(11)?!=0,created_at:r.get(12)?,updated_at:r.get(13)?})).unwrap().collect()
    }

    pub fn create_page(&self, workspace_id: &str, parent_id: Option<&str>, title: &str, is_database: bool) -> Result<Page> {
        let id = uuid::Uuid::new_v4().to_string();
        {
            let conn = self.conn.lock().unwrap();
            conn.execute("INSERT INTO pages (id,workspace_id,parent_id,title,is_database) VALUES (?1,?2,?3,?4,?5)", params![id,workspace_id,parent_id,title,is_database as i32])?;
            if is_database {
                let db_id = uuid::Uuid::new_v4().to_string();
                conn.execute("INSERT INTO databases (id,page_id,title) VALUES (?1,?2,?3)", params![db_id,id,title])?;
                conn.execute("INSERT INTO database_properties (id,database_id,name,prop_type,sort_order) VALUES (?1,?2,'Name','title',0)", params![uuid::Uuid::new_v4().to_string(),db_id])?;
                conn.execute("INSERT INTO database_properties (id,database_id,name,prop_type,sort_order) VALUES (?1,?2,'Status','select',1)", params![uuid::Uuid::new_v4().to_string(),db_id])?;
                conn.execute("INSERT INTO database_views (id,database_id,name,view_type,sort_order) VALUES (?1,?2,'Table','table',0)", params![uuid::Uuid::new_v4().to_string(),db_id])?;
                conn.execute("INSERT INTO database_views (id,database_id,name,view_type,sort_order) VALUES (?1,?2,'Board','board',1)", params![uuid::Uuid::new_v4().to_string(),db_id])?;
            }
        }
        self.get_page_by_id(&id)
    }

    pub fn get_page_by_id(&self, id: &str) -> Result<Page> {
        let conn = self.conn.lock().unwrap();
        conn.query_row("SELECT id,workspace_id,parent_id,title,icon,cover,cover_position,font,width,is_favorite,is_trash,is_database,created_at,updated_at FROM pages WHERE id=?1", params![id], |r| Ok(Page{id:r.get(0)?,workspace_id:r.get(1)?,parent_id:r.get(2)?,title:r.get(3)?,icon:r.get(4)?,cover:r.get(5)?,cover_position:r.get(6)?,font:r.get(7)?,width:r.get(8)?,is_favorite:r.get::<_,i32>(9)?!=0,is_trash:r.get::<_,i32>(10)?!=0,is_database:r.get::<_,i32>(11)?!=0,created_at:r.get(12)?,updated_at:r.get(13)?}))
    }

    pub fn update_page(&self, id: &str, title: &str, icon: &str, font: &str, width: &str, is_favorite: bool) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE pages SET title=?1,icon=?2,font=?3,width=?4,is_favorite=?5,updated_at=datetime('now') WHERE id=?6", params![title,icon,font,width,is_favorite as i32,id])?;
        Ok(())
    }

    pub fn toggle_favorite(&self, id: &str) -> Result<bool> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE pages SET is_favorite=CASE WHEN is_favorite=0 THEN 1 ELSE 0 END,updated_at=datetime('now') WHERE id=?1", params![id])?;
        conn.query_row("SELECT is_favorite FROM pages WHERE id=?1", params![id], |r| r.get::<_,i32>(0).map(|v| v!=0))
    }

    pub fn trash_page(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE pages SET is_trash=1,updated_at=datetime('now') WHERE id=?1", params![id])?;
        Ok(())
    }

    pub fn restore_page(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap(); conn.execute("UPDATE pages SET is_trash=0,updated_at=datetime('now') WHERE id=?1", params![id])?; Ok(())
    }

    pub fn get_trashed_pages(&self, workspace_id: &str) -> Result<Vec<Page>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,workspace_id,parent_id,title,icon,cover,cover_position,font,width,is_favorite,is_trash,is_database,created_at,updated_at FROM pages WHERE workspace_id=?1 AND is_trash=1 ORDER BY updated_at DESC")?;
        stmt.query_map(params![workspace_id], |r|             Ok(Page{id:r.get(0)?,workspace_id:r.get(1)?,parent_id:r.get(2)?,title:r.get(3)?,icon:r.get(4)?,cover:r.get(5)?,cover_position:r.get(6)?,font:r.get(7)?,width:r.get(8)?,is_favorite:r.get::<_,i32>(9)?!=0,is_trash:r.get::<_,i32>(10)?!=0,is_database:r.get::<_,i32>(11)?!=0,created_at:r.get(12)?,updated_at:r.get(13)?})).unwrap().collect()
    }

    pub fn delete_page_permanently(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM document_states WHERE page_id=?1", params![id])?;
        conn.execute("DELETE FROM pages WHERE id=?1", params![id])?; Ok(())
    }

    pub fn get_document_state(&self, page_id: &str) -> Result<Option<Vec<u8>>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT yjs_blob FROM document_states WHERE page_id=?1")?;
        let mut rows = stmt.query(params![page_id])?;
        if let Some(row) = rows.next()? {
            let blob: Option<Vec<u8>> = row.get(0)?;
            Ok(blob)
        } else {
            Ok(None)
        }
    }

    pub fn save_document_state(&self, page_id: &str, blob: &[u8]) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO document_states (page_id, yjs_blob, updated_at)
             VALUES (?1, ?2, datetime('now'))",
            params![page_id, blob],
        )?;
        Ok(())
    }

    // ---- Database CRUD ----

    pub fn get_database(&self, page_id: &str) -> Result<Database_> {
        let conn = self.conn.lock().unwrap();
        conn.query_row("SELECT id,page_id,title,created_at,updated_at FROM databases WHERE page_id=?1", params![page_id], |r| Ok(Database_{id:r.get(0)?,page_id:r.get(1)?,title:r.get(2)?,created_at:r.get(3)?,updated_at:r.get(4)?}))
    }

    pub fn get_properties(&self, database_id: &str) -> Result<Vec<DBProperty>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,database_id,name,prop_type,options,sort_order FROM database_properties WHERE database_id=?1 ORDER BY sort_order")?;
        stmt.query_map(params![database_id], |r| Ok(DBProperty{id:r.get(0)?,database_id:r.get(1)?,name:r.get(2)?,prop_type:r.get(3)?,options:r.get(4)?,sort_order:r.get(5)?})).unwrap().collect()
    }

    pub fn create_property(&self, database_id: &str, name: &str, prop_type: &str) -> Result<DBProperty> {
        let conn = self.conn.lock().unwrap();
        let id = uuid::Uuid::new_v4().to_string();
        let max_order: i64 = conn.query_row("SELECT COALESCE(MAX(sort_order),-1) FROM database_properties WHERE database_id=?1", params![database_id], |r| r.get(0))?;
        conn.execute("INSERT INTO database_properties (id,database_id,name,prop_type,sort_order) VALUES (?1,?2,?3,?4,?5)", params![id,database_id,name,prop_type,max_order+1])?;
        conn.query_row("SELECT id,database_id,name,prop_type,options,sort_order FROM database_properties WHERE id=?1", params![id], |r| Ok(DBProperty{id:r.get(0)?,database_id:r.get(1)?,name:r.get(2)?,prop_type:r.get(3)?,options:r.get(4)?,sort_order:r.get(5)?}))
    }

    pub fn update_property(&self, id: &str, name: &str, options: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE database_properties SET name=?1,options=?2 WHERE id=?3", params![name,options,id])?; Ok(())
    }

    pub fn delete_property(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM database_item_properties WHERE property_id=?1", params![id])?;
        conn.execute("DELETE FROM database_properties WHERE id=?1", params![id])?; Ok(())
    }

    pub fn get_items(&self, database_id: &str) -> Result<Vec<DBItem>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,database_id,title,sort_order,created_at,updated_at FROM database_items WHERE database_id=?1 ORDER BY sort_order")?;
        stmt.query_map(params![database_id], |r| Ok(DBItem{id:r.get(0)?,database_id:r.get(1)?,title:r.get(2)?,sort_order:r.get(3)?,created_at:r.get(4)?,updated_at:r.get(5)?})).unwrap().collect()
    }

    pub fn create_item(&self, database_id: &str, title: &str) -> Result<DBItem> {
        let conn = self.conn.lock().unwrap();
        let id = uuid::Uuid::new_v4().to_string();
        conn.execute("INSERT INTO database_items (id,database_id,title) VALUES (?1,?2,?3)", params![id,database_id,title])?;

        // Create empty properties for all columns
        let mut prop_stmt = conn.prepare("SELECT id FROM database_properties WHERE database_id=?1")?;
        let prop_ids: Vec<String> = prop_stmt.query_map(params![database_id], |r| r.get::<_,String>(0)).unwrap().filter_map(|r| r.ok()).collect();
        for pid in prop_ids {
            let ipid = uuid::Uuid::new_v4().to_string();
            conn.execute("INSERT INTO database_item_properties (id,item_id,property_id,value) VALUES (?1,?2,?3,'')", params![ipid,id,pid]).ok();
        }

        conn.query_row("SELECT id,database_id,title,sort_order,created_at,updated_at FROM database_items WHERE id=?1", params![id], |r| Ok(DBItem{id:r.get(0)?,database_id:r.get(1)?,title:r.get(2)?,sort_order:r.get(3)?,created_at:r.get(4)?,updated_at:r.get(5)?}))
    }

    pub fn update_item(&self, id: &str, title: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE database_items SET title=?1,updated_at=datetime('now') WHERE id=?2", params![title,id])?; Ok(())
    }

    pub fn delete_item(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM database_item_properties WHERE item_id=?1", params![id])?;
        conn.execute("DELETE FROM database_items WHERE id=?1", params![id])?; Ok(())
    }

    pub fn get_item_properties(&self, item_id: &str) -> Result<Vec<DBItemProperty>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,item_id,property_id,value FROM database_item_properties WHERE item_id=?1")?;
        stmt.query_map(params![item_id], |r| Ok(DBItemProperty{id:r.get(0)?,item_id:r.get(1)?,property_id:r.get(2)?,value:r.get(3)?})).unwrap().collect()
    }

    pub fn get_item_properties_batch(&self, item_ids: &[String]) -> Result<Vec<DBItemProperty>> {
        if item_ids.is_empty() {
            return Ok(vec![]);
        }
        let conn = self.conn.lock().unwrap();
        let placeholders: Vec<String> = item_ids.iter().map(|_| "?".to_string()).collect();
        let sql = format!("SELECT id,item_id,property_id,value FROM database_item_properties WHERE item_id IN ({})", placeholders.join(","));
        let mut stmt = conn.prepare(&sql)?;
        let params: Vec<&dyn rusqlite::types::ToSql> = item_ids.iter().map(|s| s as &dyn rusqlite::types::ToSql).collect();
        stmt.query_map(params.as_slice(), |r| Ok(DBItemProperty{id:r.get(0)?,item_id:r.get(1)?,property_id:r.get(2)?,value:r.get(3)?})).unwrap().collect()
    }

    pub fn update_item_property(&self, item_id: &str, property_id: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let exists: i64 = conn.query_row("SELECT COUNT(*) FROM database_item_properties WHERE item_id=?1 AND property_id=?2", params![item_id,property_id], |r| r.get(0))?;
        if exists > 0 {
            conn.execute("UPDATE database_item_properties SET value=?1 WHERE item_id=?2 AND property_id=?3", params![value,item_id,property_id])?;
        } else {
            let id = uuid::Uuid::new_v4().to_string();
            conn.execute("INSERT INTO database_item_properties (id,item_id,property_id,value) VALUES (?1,?2,?3,?4)", params![id,item_id,property_id,value])?;
        }
        Ok(())
    }

    pub fn get_views(&self, database_id: &str) -> Result<Vec<DBView>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,database_id,name,view_type,config,sort_order FROM database_views WHERE database_id=?1 ORDER BY sort_order")?;
        stmt.query_map(params![database_id], |r| Ok(DBView{id:r.get(0)?,database_id:r.get(1)?,name:r.get(2)?,view_type:r.get(3)?,config:r.get(4)?,sort_order:r.get(5)?})).unwrap().collect()
    }

    // ---- Comments ----

    pub fn get_comments(&self, page_id: &str) -> Result<Vec<Comment>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,page_id,parent_id,block_id,author,content,resolved,created_at,updated_at FROM comments WHERE page_id=?1 ORDER BY created_at")?;
        stmt.query_map(params![page_id], |r| Ok(Comment{id:r.get(0)?,page_id:r.get(1)?,parent_id:r.get(2)?,block_id:r.get(3)?,author:r.get(4)?,content:r.get(5)?,resolved:r.get::<_,i32>(6)?!=0,created_at:r.get(7)?,updated_at:r.get(8)?})).unwrap().collect()
    }

    pub fn create_comment(&self, page_id: &str, parent_id: Option<&str>, block_id: &str, author: &str, content: &str) -> Result<Comment> {
        let conn = self.conn.lock().unwrap();
        let id = uuid::Uuid::new_v4().to_string();
        conn.execute("INSERT INTO comments (id,page_id,parent_id,block_id,author,content) VALUES (?1,?2,?3,?4,?5,?6)", params![id,page_id,parent_id,block_id,author,content])?;
        conn.query_row("SELECT id,page_id,parent_id,block_id,author,content,resolved,created_at,updated_at FROM comments WHERE id=?1", params![id], |r| Ok(Comment{id:r.get(0)?,page_id:r.get(1)?,parent_id:r.get(2)?,block_id:r.get(3)?,author:r.get(4)?,content:r.get(5)?,resolved:r.get::<_,i32>(6)?!=0,created_at:r.get(7)?,updated_at:r.get(8)?}))
    }

    pub fn resolve_comment(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE comments SET resolved=1,updated_at=datetime('now') WHERE id=?1", params![id])?; Ok(())
    }

    pub fn delete_comment(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM comments WHERE id=?1 OR parent_id=?1", params![id])?; Ok(())
    }

    // ---- Versions ----

    pub fn get_page_versions(&self, page_id: &str) -> Result<Vec<PageVersion>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,page_id,title,snapshot,created_at FROM page_versions WHERE page_id=?1 ORDER BY created_at DESC")?;
        stmt.query_map(params![page_id], |r| Ok(PageVersion{id:r.get(0)?,page_id:r.get(1)?,title:r.get(2)?,snapshot:r.get(3)?,created_at:r.get(4)?})).unwrap().collect()
    }

    pub fn create_page_version(&self, page_id: &str, title: &str, snapshot: &str) -> Result<PageVersion> {
        let conn = self.conn.lock().unwrap();
        let id = uuid::Uuid::new_v4().to_string();
        conn.execute("INSERT INTO page_versions (id,page_id,title,snapshot) VALUES (?1,?2,?3,?4)", params![id,page_id,title,snapshot])?;
        conn.query_row("SELECT id,page_id,title,snapshot,created_at FROM page_versions WHERE id=?1", params![id], |r| Ok(PageVersion{id:r.get(0)?,page_id:r.get(1)?,title:r.get(2)?,snapshot:r.get(3)?,created_at:r.get(4)?}))
    }

    // ---- Search ----

    pub fn search_pages(&self, workspace_id: &str, query: &str) -> Result<Vec<Page>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT p.id,p.workspace_id,p.parent_id,p.title,p.icon,p.cover,p.cover_position,p.font,p.width,p.is_favorite,p.is_trash,p.is_database,p.created_at,p.updated_at
             FROM pages p JOIN pages_fts f ON p.rowid = f.rowid
             WHERE pages_fts MATCH ?1 AND p.workspace_id=?2 AND p.is_trash=0
             ORDER BY rank LIMIT 20"
        )?;
        stmt.query_map(params![query, workspace_id], |r| {
            Ok(Page{id:r.get(0)?,workspace_id:r.get(1)?,parent_id:r.get(2)?,title:r.get(3)?,icon:r.get(4)?,cover:r.get(5)?,cover_position:r.get(6)?,font:r.get(7)?,width:r.get(8)?,is_favorite:r.get::<_,i32>(9)?!=0,is_trash:r.get::<_,i32>(10)?!=0,is_database:r.get::<_,i32>(11)?!=0,created_at:r.get(12)?,updated_at:r.get(13)?})
        }).unwrap().collect()
    }

    pub fn reindex_search(&self, workspace_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM pages_fts", [])?;
        let mut stmt = conn.prepare("INSERT INTO pages_fts (rowid, title, content) SELECT rowid, title, '' FROM pages WHERE workspace_id=?1 AND is_trash=0")?;
        stmt.execute(params![workspace_id])?;
        Ok(())
    }

    // ---- Templates ----

    pub fn get_templates(&self, workspace_id: &str) -> Result<Vec<Template>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,workspace_id,name,icon,description,category,content,created_at FROM templates WHERE workspace_id=?1 ORDER BY category,name")?;
        stmt.query_map(params![workspace_id], |r| Ok(Template{id:r.get(0)?,workspace_id:r.get(1)?,name:r.get(2)?,icon:r.get(3)?,description:r.get(4)?,category:r.get(5)?,content:r.get(6)?,created_at:r.get(7)?})).unwrap().collect()
    }

    pub fn create_template(&self, workspace_id: &str, name: &str, icon: &str, description: &str, category: &str, content: &str) -> Result<Template> {
        let conn = self.conn.lock().unwrap();
        let id = uuid::Uuid::new_v4().to_string();
        conn.execute("INSERT INTO templates (id,workspace_id,name,icon,description,category,content) VALUES (?1,?2,?3,?4,?5,?6,?7)", params![id,workspace_id,name,icon,description,category,content])?;
        conn.query_row("SELECT id,workspace_id,name,icon,description,category,content,created_at FROM templates WHERE id=?1", params![id], |r| Ok(Template{id:r.get(0)?,workspace_id:r.get(1)?,name:r.get(2)?,icon:r.get(3)?,description:r.get(4)?,category:r.get(5)?,content:r.get(6)?,created_at:r.get(7)?}))
    }

    // ---- Collaboration (Shares / Notifications) ----

    pub fn share_page(&self, page_id: &str, user_email: &str, permission_level: &str) -> Result<Share> {
        let conn = self.conn.lock().unwrap();
        let id = uuid::Uuid::new_v4().to_string();
        conn.execute("INSERT INTO page_shares (id,page_id,user_email,permission_level) VALUES (?1,?2,?3,?4)", params![id,page_id,user_email,permission_level])?;
        conn.query_row("SELECT id,page_id,user_email,permission_level,created_at FROM page_shares WHERE id=?1", params![id], |r| Ok(
            Share{id:r.get(0)?,page_id:r.get(1)?,user_email:r.get(2)?,permission_level:r.get(3)?,created_at:r.get(4)?}
        ))
    }

    pub fn update_share_permission(&self, id: &str, permission_level: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE page_shares SET permission_level=?1 WHERE id=?2", params![permission_level,id])?;
        Ok(())
    }

    pub fn remove_share(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM page_shares WHERE id=?1", params![id])?;
        Ok(())
    }

    pub fn get_page_shares(&self, page_id: &str) -> Result<Vec<Share>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,page_id,user_email,permission_level,created_at FROM page_shares WHERE page_id=?1 ORDER BY created_at")?;
        stmt.query_map(params![page_id], |r| Ok(
            Share{id:r.get(0)?,page_id:r.get(1)?,user_email:r.get(2)?,permission_level:r.get(3)?,created_at:r.get(4)?}
        )).unwrap().collect()
    }

    pub fn get_notifications(&self, workspace_id: &str) -> Result<Vec<Notification_>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id,workspace_id,type,title,message,page_id,read,created_at FROM notifications WHERE workspace_id=?1 ORDER BY created_at DESC")?;
        stmt.query_map(params![workspace_id], |r| Ok(
            Notification_{id:r.get(0)?,workspace_id:r.get(1)?,r#type:r.get(2)?,title:r.get(3)?,message:r.get(4)?,page_id:r.get(5)?,read:r.get::<_,i32>(6)?!=0,created_at:r.get(7)?}
        )).unwrap().collect()
    }

    pub fn create_notification(&self, workspace_id: &str, notif_type: &str, title: &str, message: &str, page_id: Option<&str>) -> Result<Notification_> {
        let conn = self.conn.lock().unwrap();
        let id = uuid::Uuid::new_v4().to_string();
        conn.execute("INSERT INTO notifications (id,workspace_id,type,title,message,page_id) VALUES (?1,?2,?3,?4,?5,?6)", params![id,workspace_id,notif_type,title,message,page_id])?;
        conn.query_row("SELECT id,workspace_id,type,title,message,page_id,read,created_at FROM notifications WHERE id=?1", params![id], |r| Ok(
            Notification_{id:r.get(0)?,workspace_id:r.get(1)?,r#type:r.get(2)?,title:r.get(3)?,message:r.get(4)?,page_id:r.get(5)?,read:r.get::<_,i32>(6)?!=0,created_at:r.get(7)?}
        ))
    }

    pub fn mark_notification_read(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE notifications SET read=1 WHERE id=?1", params![id])?;
        Ok(())
    }

    pub fn mark_all_notifications_read(&self, workspace_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE notifications SET read=1 WHERE workspace_id=?1 AND read=0", params![workspace_id])?;
        Ok(())
    }

    pub fn seed_templates(&self, workspace_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM templates WHERE workspace_id=?1", params![workspace_id], |r| r.get(0))?;
        if count == 0 {
            let templates = vec![
                ("Meeting Notes", "📝", "Document meeting agenda, notes, and action items", "business", r##"[{"type":"heading","content":"Meeting Notes","props":{"level":1}},{"type":"paragraph","content":"Date: "},{"type":"heading","content":"Attendees","props":{"level":2}},{"type":"paragraph","content":""},{"type":"heading","content":"Agenda","props":{"level":2}},{"type":"bullet_list","children":[{"type":"list_item","content":""}]},{"type":"heading","content":"Notes","props":{"level":2}},{"type":"paragraph","content":""},{"type":"heading","content":"Action Items","props":{"level":2}},{"type":"to_do","content":""}]"##),
                ("Project Plan", "🚀", "Plan and track project milestones and tasks", "business", r##"[{"type":"heading","content":"Project Plan","props":{"level":1}},{"type":"paragraph","content":"Project: "},{"type":"heading","content":"Goals","props":{"level":2}},{"type":"paragraph","content":""},{"type":"heading","content":"Timeline","props":{"level":2}},{"type":"paragraph","content":""},{"type":"heading","content":"Tasks","props":{"level":2}},{"type":"to_do","content":"Task 1"},{"type":"to_do","content":"Task 2"}]"##),
                ("Weekly Review", "📊", "Review your week and plan ahead", "personal", r##"[{"type":"heading","content":"Weekly Review","props":{"level":1}},{"type":"paragraph","content":"Week of: "},{"type":"heading","content":"Wins","props":{"level":2}},{"type":"paragraph","content":""},{"type":"heading","content":"Challenges","props":{"level":2}},{"type":"paragraph","content":""},{"type":"heading","content":"Next Week","props":{"level":2}},{"type":"paragraph","content":""}]"##),
                ("Brain Dump", "🧠", "Capture all your thoughts and ideas", "personal", r##"[{"type":"heading","content":"Brain Dump","props":{"level":1}},{"type":"paragraph","content":"Anything on your mind:"},{"type":"bullet_list","children":[{"type":"list_item","content":""}]}]"##),
            ];
            for (name, icon, desc, cat, content) in templates {
                let id = uuid::Uuid::new_v4().to_string();
                conn.execute("INSERT INTO templates (id,workspace_id,name,icon,description,category,content) VALUES (?1,?2,?3,?4,?5,?6,?7)", params![id,workspace_id,name,icon,desc,cat,content]).ok();
            }
        }
        Ok(())
    }
}

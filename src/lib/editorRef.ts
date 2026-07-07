// Simple module-level ref for the active BlockNote editor.
// Using a module-level variable instead of Zustand prevents components
// that use useWorkspaceStore() from re-rendering when the editor changes.
let _activeEditor: any = null;

export const editorRef = {
  get: () => _activeEditor,
  set: (editor: any) => { _activeEditor = editor; },
};

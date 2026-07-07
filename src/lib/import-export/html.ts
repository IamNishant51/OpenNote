import type { BlockNoteEditor } from "@blocknote/core";

export function importHTML(
  editor: BlockNoteEditor,
  html: string,
): void {
  const blocks = editor.tryParseHTMLToBlocks(html);
  editor.replaceBlocks(editor.document, blocks);
}

export async function exportHTML(
  editor: BlockNoteEditor,
): Promise<string> {
  return editor.blocksToFullHTML(editor.document);
}

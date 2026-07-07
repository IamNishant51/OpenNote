import type { BlockNoteEditor } from "@blocknote/core";

export function importMarkdown(
  editor: BlockNoteEditor,
  markdown: string,
): void {
  const blocks = editor.tryParseMarkdownToBlocks(markdown);
  editor.replaceBlocks(editor.document, blocks);
}

export async function exportMarkdown(
  editor: BlockNoteEditor,
): Promise<string> {
  return editor.blocksToMarkdownLossy(editor.document);
}

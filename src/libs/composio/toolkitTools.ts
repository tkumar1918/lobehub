/**
 * Upper bound on tools fetched per toolkit. Without an explicit limit the SDK returns
 * only the first page (20) of Composio's "important" tools, which leaves out e.g.
 * Google Sheets cell formatting; with one it returns every tool of the toolkit. Users
 * switch off the tools they don't need per connector in Settings > Connectors.
 */
export const COMPOSIO_TOOLKIT_TOOL_LIMIT = 200;

interface RawComposioToolsClient {
  tools: unknown;
}

/** Matches the replacement slug in "DEPRECATED: Use GOOGLESHEETS_BATCH_GET instead". */
const DEPRECATED_REPLACEMENT_PATTERN = /^\s*DEPRECATED:\s*Use\s+([A-Z][\dA-Z_]*)\s+instead\b/;

const isDeprecatedTool = (tool: any): boolean =>
  tool.isDeprecated === true ||
  tool.is_deprecated === true ||
  (Array.isArray(tool.tags) && tool.tags.includes('deprecated'));

/**
 * Lists every raw Composio tool definition of a toolkit.
 *
 * Use when:
 * - Building the tool list a Composio connector syncs into LobeHub
 *
 * Expects:
 * - `client` is a Composio client whose `tools.getRawComposioTools` accepts a
 *   `toolkits` filter with a `limit`
 *
 * Returns:
 * - The toolkit's tools, or an empty list for an unexpected response shape
 */
export const getComposioToolkitTools = async (
  client: RawComposioToolsClient,
  appSlug: string,
): Promise<any[]> => {
  const response = await (client.tools as any).getRawComposioTools({
    limit: COMPOSIO_TOOLKIT_TOOL_LIMIT,
    toolkits: [appSlug],
  });

  const items = response?.items || response || [];
  return Array.isArray(items) ? items : [];
};

/**
 * Lists the slugs of the tools Composio marks as "important" for a toolkit.
 *
 * Use when:
 * - Choosing which newly synced connector tools start enabled; the rest start disabled
 *
 * Expects:
 * - `client` is a Composio client whose `tools.getRawComposioTools` accepts
 *   `important` together with `toolkits` and `limit`
 *
 * Returns:
 * - The important tool slugs, with each deprecated tool swapped for the replacement
 *   its description names, or `undefined` when Composio can't be asked, so callers
 *   fall back to enabling every tool instead of disabling all of them
 */
export const getComposioImportantToolSlugs = async (
  client: RawComposioToolsClient,
  appSlug: string,
): Promise<Set<string> | undefined> => {
  try {
    const response = await (client.tools as any).getRawComposioTools({
      important: true,
      limit: COMPOSIO_TOOLKIT_TOOL_LIMIT,
      toolkits: [appSlug],
    });

    const items = response?.items || response || [];
    if (!Array.isArray(items) || items.length === 0) return undefined;

    const slugs = new Set<string>();
    for (const tool of items) {
      const slug = tool.slug || tool.name;
      if (!slug) continue;

      // Composio keeps some deprecated tools in its important set. Recommend the
      // replacement their description names instead, e.g. "DEPRECATED: Use
      // GOOGLESHEETS_BATCH_GET instead".
      if (isDeprecatedTool(tool)) {
        const replacement = DEPRECATED_REPLACEMENT_PATTERN.exec(tool.description || '')?.[1];
        if (replacement) slugs.add(replacement);
        continue;
      }

      slugs.add(slug);
    }

    return slugs.size > 0 ? slugs : undefined;
  } catch (error) {
    console.warn('[Composio] Failed to fetch important tools:', error);
    return undefined;
  }
};

/**
 * Tools fetched by slug on top of a toolkit's default list, keyed by Composio app slug.
 *
 * `getRawComposioTools({ toolkits })` returns only the first page (20) of Composio's
 * "important" tools, which leaves out e.g. Google Sheets cell formatting.
 */
export const COMPOSIO_EXTRA_TOOL_SLUGS: Record<string, string[]> = {
  GOOGLESHEETS: [
    'GOOGLESHEETS_FORMAT_CELL',
    'GOOGLESHEETS_UPDATE_SHEET_PROPERTIES',
    'GOOGLESHEETS_AUTO_RESIZE_DIMENSIONS',
    'GOOGLESHEETS_SET_BASIC_FILTER',
  ],
};

interface RawComposioToolsClient {
  tools: unknown;
}

const toToolList = (response: any): any[] => {
  const items = response?.items || response || [];
  return Array.isArray(items) ? items : [];
};

/**
 * Lists a toolkit's raw Composio tool definitions, including its configured extra tools.
 *
 * Use when:
 * - Building the tool list a Composio connector exposes to the model
 *
 * Expects:
 * - `client` is a Composio client whose `tools.getRawComposioTools` accepts
 *   either a `toolkits` or a `tools` filter
 *
 * Returns:
 * - The toolkit's default tools followed by any configured extras not already present;
 *   the default tools alone when the extra lookup fails
 */
export const getComposioToolkitTools = async (
  client: RawComposioToolsClient,
  appSlug: string,
): Promise<any[]> => {
  const tools = toToolList(
    await (client.tools as any).getRawComposioTools({ toolkits: [appSlug] }),
  );

  const extraSlugs = (COMPOSIO_EXTRA_TOOL_SLUGS[appSlug.toUpperCase()] ?? []).filter(
    (slug) => !tools.some((tool) => tool?.slug === slug),
  );
  if (extraSlugs.length === 0) return tools;

  try {
    const extras = toToolList(
      await (client.tools as any).getRawComposioTools({ tools: extraSlugs }),
    );
    return [...tools, ...extras];
  } catch {
    // A renamed or retired extra slug must not drop the toolkit's default tools
    return tools;
  }
};

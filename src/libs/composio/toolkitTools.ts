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

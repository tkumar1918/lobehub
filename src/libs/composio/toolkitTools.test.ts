import { describe, expect, it, vi } from 'vitest';

import { COMPOSIO_TOOLKIT_TOOL_LIMIT, getComposioToolkitTools } from './toolkitTools';

const createClient = (result: unknown) => {
  const getRawComposioTools = vi.fn(async () => result);
  return { client: { tools: { getRawComposioTools } }, getRawComposioTools };
};

describe('getComposioToolkitTools', () => {
  /** @example Every tool of the toolkit is requested, not only the default page. */
  it('requests the toolkit with an explicit limit', async () => {
    // ROOT CAUSE:
    //
    // A toolkit-only query returns just the first 20 "important" tools, and
    // GOOGLESHEETS_FORMAT_CELL is not among them, so the model could not bold cells.
    //
    // Before: getRawComposioTools({ toolkits }) without a limit.
    // We fixed this by passing an explicit limit, which returns every tool.
    const { client, getRawComposioTools } = createClient({
      items: [{ slug: 'GOOGLESHEETS_BATCH_GET' }, { slug: 'GOOGLESHEETS_FORMAT_CELL' }],
    });

    const tools = await getComposioToolkitTools(client, 'GOOGLESHEETS');

    expect(getRawComposioTools).toHaveBeenCalledWith({
      limit: COMPOSIO_TOOLKIT_TOOL_LIMIT,
      toolkits: ['GOOGLESHEETS'],
    });
    expect(tools.map((tool) => tool.slug)).toEqual([
      'GOOGLESHEETS_BATCH_GET',
      'GOOGLESHEETS_FORMAT_CELL',
    ]);
  });

  /** @example The SDK may return a bare array instead of a paged object. */
  it('accepts a bare array response', async () => {
    const { client } = createClient([{ slug: 'GMAIL_SEND_EMAIL' }]);

    await expect(getComposioToolkitTools(client, 'GMAIL')).resolves.toEqual([
      { slug: 'GMAIL_SEND_EMAIL' },
    ]);
  });

  /** @example An unexpected response shape yields no tools instead of throwing. */
  it('returns an empty list for an unexpected response shape', async () => {
    const { client } = createClient({ items: 'not-a-list' });

    await expect(getComposioToolkitTools(client, 'GMAIL')).resolves.toEqual([]);
  });
});

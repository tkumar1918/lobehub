import { describe, expect, it, vi } from 'vitest';

import { COMPOSIO_EXTRA_TOOL_SLUGS, getComposioToolkitTools } from './toolkitTools';

const createClient = (impl: (query: any) => Promise<unknown>) => {
  const getRawComposioTools = vi.fn(impl);
  return { client: { tools: { getRawComposioTools } }, getRawComposioTools };
};

describe('getComposioToolkitTools', () => {
  /** @example Sheets formatting tools outside the default page are fetched by slug. */
  it('appends configured extra tools to the toolkit default list', async () => {
    // ROOT CAUSE:
    //
    // A toolkit-only query returns just the first 20 "important" tools, and
    // GOOGLESHEETS_FORMAT_CELL is not among them, so the model could not bold cells.
    //
    // Before: connectors exposed only the default list.
    // We fixed this by fetching configured extra slugs and appending them.
    const { client, getRawComposioTools } = createClient(async (query) =>
      query.toolkits
        ? { items: [{ slug: 'GOOGLESHEETS_BATCH_GET' }] }
        : { items: query.tools.map((slug: string) => ({ slug })) },
    );

    const tools = await getComposioToolkitTools(client, 'GOOGLESHEETS');

    expect(getRawComposioTools).toHaveBeenCalledWith({ toolkits: ['GOOGLESHEETS'] });
    expect(getRawComposioTools).toHaveBeenCalledWith({
      tools: COMPOSIO_EXTRA_TOOL_SLUGS.GOOGLESHEETS,
    });
    expect(tools.map((tool) => tool.slug)).toEqual([
      'GOOGLESHEETS_BATCH_GET',
      ...COMPOSIO_EXTRA_TOOL_SLUGS.GOOGLESHEETS,
    ]);
  });

  /** @example A toolkit without extras keeps the single default query. */
  it('makes no extra request for toolkits without configured extras', async () => {
    const { client, getRawComposioTools } = createClient(async () => [{ slug: 'GMAIL_SEND' }]);

    const tools = await getComposioToolkitTools(client, 'GMAIL');

    expect(getRawComposioTools).toHaveBeenCalledTimes(1);
    expect(tools).toEqual([{ slug: 'GMAIL_SEND' }]);
  });

  /** @example An extra already in the default list is not requested twice. */
  it('skips extras already present in the default list', async () => {
    const [first, ...rest] = COMPOSIO_EXTRA_TOOL_SLUGS.GOOGLESHEETS;
    const { client, getRawComposioTools } = createClient(async (query) =>
      query.toolkits ? { items: [{ slug: first }] } : { items: [] },
    );

    await getComposioToolkitTools(client, 'googlesheets');

    expect(getRawComposioTools).toHaveBeenLastCalledWith({ tools: rest });
  });

  /** @example A failed extra lookup keeps the default tools usable. */
  it('returns the default tools when the extra lookup fails', async () => {
    const { client } = createClient(async (query) => {
      if (query.tools) throw new Error('Tool not found');
      return { items: [{ slug: 'GOOGLESHEETS_BATCH_GET' }] };
    });

    const tools = await getComposioToolkitTools(client, 'GOOGLESHEETS');

    expect(tools).toEqual([{ slug: 'GOOGLESHEETS_BATCH_GET' }]);
  });
});

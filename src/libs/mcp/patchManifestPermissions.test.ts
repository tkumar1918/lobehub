import { describe, expect, it } from 'vitest';

import { ConnectorToolPermission } from '@/database/schemas';

import { patchManifestWithPermissions } from './patchManifestPermissions';

const manifest = (api: Array<Record<string, unknown> & { name: string }>) =>
  ({ api, identifier: 'm' }) as any;

describe('patchManifestWithPermissions', () => {
  it('sets humanIntervention required for needs_approval', () => {
    const out = patchManifestWithPermissions(
      manifest([{ description: 'x', name: 'a' }]),
      new Map([['a', ConnectorToolPermission.needs_approval]]),
    );
    expect(out.api[0].humanIntervention).toBe('required');
  });

  it('leaves disabled tools out so they cost no prompt tokens', () => {
    // ROOT CAUSE:
    //
    // A disabled tool kept its full parameter schema in the prompt and only had its
    // description swapped, so switching tools off in Settings > Connectors saved
    // almost nothing.
    //
    // Before: disabled → blocking description + humanIntervention required.
    // We fixed this by dropping disabled tools from the manifest.
    const out = patchManifestWithPermissions(
      manifest([
        { description: 'x', name: 'a' },
        { description: 'y', name: 'b' },
      ]),
      new Map([['a', ConnectorToolPermission.disabled]]),
    );
    expect(out.api).toEqual([{ description: 'y', name: 'b' }]);
  });

  it('leaves auto tools unchanged', () => {
    const original = { description: 'x', name: 'a' };
    const out = patchManifestWithPermissions(
      manifest([original]),
      new Map([['a', ConnectorToolPermission.auto]]),
    );
    expect(out.api[0]).toEqual(original);
    expect(out.api[0].humanIntervention).toBeUndefined();
  });

  it('leaves tools without a permission entry unchanged', () => {
    const out = patchManifestWithPermissions(
      manifest([{ name: 'a' }]),
      new Map([['b', ConnectorToolPermission.disabled]]),
    );
    expect(out.api[0].humanIntervention).toBeUndefined();
  });
});

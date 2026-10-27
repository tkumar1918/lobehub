import { describe, expect, it } from 'vitest';

import type { ToolStore } from '../../store';
import { connectorSelectors } from './selectors';
import type { ConnectorTool } from './types';

const tool = (toolName: string, metadata?: Record<string, unknown>): ConnectorTool =>
  ({
    crudType: 'read',
    description: null,
    displayName: null,
    id: toolName,
    inputSchema: null,
    metadata,
    permission: 'auto',
    toolName,
    userConnectorId: 'conn-1',
  }) as ConnectorTool;

const storeWith = (tools: ConnectorTool[]) =>
  ({ agentBoundConnectors: [], connectors: [{ id: 'conn-1', tools }] }) as unknown as ToolStore;

describe('connectorSelectors.connectorToolsByImportance', () => {
  /** @example Composio tools split into important and the rest. */
  it('splits tools by metadata.composioImportant', () => {
    const state = storeWith([
      tool('SHEETS_GET', { composioImportant: true }),
      tool('SHEETS_FORMAT_CELL', { composioImportant: false }),
    ]);

    const { importantTools, otherTools } =
      connectorSelectors.connectorToolsByImportance('conn-1')(state);

    expect(importantTools.map((t) => t.toolName)).toEqual(['SHEETS_GET']);
    expect(otherTools.map((t) => t.toolName)).toEqual(['SHEETS_FORMAT_CELL']);
  });

  /** @example Connectors without the flag keep the CRUD grouping. */
  it('returns empty lists when no tool carries the flag', () => {
    const state = storeWith([tool('MCP_TOOL'), tool('OTHER_TOOL', {})]);

    expect(connectorSelectors.connectorToolsByImportance('conn-1')(state)).toEqual({
      importantTools: [],
      otherTools: [],
    });
  });
});

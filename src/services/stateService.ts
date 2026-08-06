import type * as vscode from 'vscode';
import { CURRENT_SCHEMA_VERSION, TOOLBOX_REGISTRY_STATE_KEY } from '../constants';
import { ToolboxDefinition, ToolboxRegistry } from '../types';

function emptyRegistry(): ToolboxRegistry {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    defaultToolboxId: null,
    toolboxes: []
  };
}

/**
 * Owns the extension-wide Toolbox registry stored in `globalState`.
 * Never synchronized through Settings Sync: paths are local to this computer.
 */
export class StateService {
  constructor(private readonly context: vscode.ExtensionContext) {}

  getRegistry(): ToolboxRegistry {
    const stored = this.context.globalState.get<ToolboxRegistry>(TOOLBOX_REGISTRY_STATE_KEY);
    if (!stored) {
      return emptyRegistry();
    }
    return {
      schemaVersion: stored.schemaVersion ?? CURRENT_SCHEMA_VERSION,
      defaultToolboxId: stored.defaultToolboxId ?? null,
      toolboxes: Array.isArray(stored.toolboxes) ? stored.toolboxes : []
    };
  }

  async saveRegistry(registry: ToolboxRegistry): Promise<void> {
    await this.context.globalState.update(TOOLBOX_REGISTRY_STATE_KEY, registry);
  }

  getDefaultToolbox(): ToolboxDefinition | undefined {
    const registry = this.getRegistry();
    if (!registry.defaultToolboxId) {
      return undefined;
    }
    return registry.toolboxes.find(t => t.id === registry.defaultToolboxId);
  }

  getToolbox(id: string): ToolboxDefinition | undefined {
    return this.getRegistry().toolboxes.find(t => t.id === id);
  }

  async addToolbox(toolbox: ToolboxDefinition): Promise<void> {
    const registry = this.getRegistry();
    if (registry.toolboxes.some(t => t.id === toolbox.id)) {
      throw new Error(`A Toolbox with id "${toolbox.id}" is already registered.`);
    }
    registry.toolboxes.push(toolbox);
    await this.saveRegistry(registry);
  }

  async updateToolbox(toolbox: ToolboxDefinition): Promise<void> {
    const registry = this.getRegistry();
    const index = registry.toolboxes.findIndex(t => t.id === toolbox.id);
    if (index === -1) {
      throw new Error(`No registered Toolbox with id "${toolbox.id}".`);
    }
    registry.toolboxes[index] = toolbox;
    await this.saveRegistry(registry);
  }

  async removeToolbox(id: string): Promise<void> {
    const registry = this.getRegistry();
    registry.toolboxes = registry.toolboxes.filter(t => t.id !== id);
    if (registry.defaultToolboxId === id) {
      registry.defaultToolboxId = registry.toolboxes[0]?.id ?? null;
    }
    await this.saveRegistry(registry);
  }

  async setDefaultToolbox(id: string): Promise<void> {
    const registry = this.getRegistry();
    if (!registry.toolboxes.some(t => t.id === id)) {
      throw new Error(`No registered Toolbox with id "${id}".`);
    }
    registry.defaultToolboxId = id;
    await this.saveRegistry(registry);
  }
}

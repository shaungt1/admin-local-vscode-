import assert from 'node:assert/strict';
import { test } from 'node:test';
import { StateService } from '../src/services/stateService';
import { ToolboxDefinition } from '../src/types';

function fakeExtensionContext() {
  const store = new Map<string, unknown>();
  return {
    globalState: {
      get: (key: string, defaultValue?: unknown) => (store.has(key) ? store.get(key) : defaultValue),
      update: async (key: string, value: unknown) => {
        store.set(key, value);
      }
    }
  } as unknown as import('vscode').ExtensionContext;
}

function toolbox(id: string): ToolboxDefinition {
  return { id, name: `Toolbox ${id}`, path: `/toolboxes/${id}`, createdAt: new Date(0).toISOString() };
}

test('getRegistry returns an empty registry when nothing is stored', () => {
  const state = new StateService(fakeExtensionContext());
  const registry = state.getRegistry();
  assert.equal(registry.schemaVersion, 2);
  assert.equal(registry.defaultToolboxId, null);
  assert.deepEqual(registry.toolboxes, []);
});

test('addToolbox stores one Toolbox and getDefaultToolbox is unset until chosen', async () => {
  const state = new StateService(fakeExtensionContext());
  await state.addToolbox(toolbox('a'));
  assert.equal(state.getRegistry().toolboxes.length, 1);
  assert.equal(state.getDefaultToolbox(), undefined);
});

test('setDefaultToolbox and getDefaultToolbox round-trip', async () => {
  const state = new StateService(fakeExtensionContext());
  await state.addToolbox(toolbox('a'));
  await state.addToolbox(toolbox('b'));
  await state.setDefaultToolbox('b');
  assert.equal(state.getDefaultToolbox()?.id, 'b');
});

test('setDefaultToolbox rejects an unregistered id', async () => {
  const state = new StateService(fakeExtensionContext());
  await assert.rejects(() => state.setDefaultToolbox('missing'));
});

test('updateToolbox changes the stored path for multiple Toolboxes independently', async () => {
  const state = new StateService(fakeExtensionContext());
  await state.addToolbox(toolbox('a'));
  await state.addToolbox(toolbox('b'));
  await state.updateToolbox({ ...toolbox('a'), path: '/moved/a' });
  assert.equal(state.getToolbox('a')?.path, '/moved/a');
  assert.equal(state.getToolbox('b')?.path, '/toolboxes/b');
});

test('removeToolbox falls back the default to another registered Toolbox', async () => {
  const state = new StateService(fakeExtensionContext());
  await state.addToolbox(toolbox('a'));
  await state.addToolbox(toolbox('b'));
  await state.setDefaultToolbox('a');
  await state.removeToolbox('a');
  assert.equal(state.getRegistry().defaultToolboxId, 'b');
});

test('removeToolbox clears the default when no Toolboxes remain', async () => {
  const state = new StateService(fakeExtensionContext());
  await state.addToolbox(toolbox('a'));
  await state.setDefaultToolbox('a');
  await state.removeToolbox('a');
  assert.equal(state.getRegistry().defaultToolboxId, null);
});

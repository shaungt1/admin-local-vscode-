import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fs from 'fs';
import * as path from 'path';
import {
  createToolboxLink,
  inspectToolboxLink,
  removeToolboxLinkOnly,
  repairToolboxLink
} from '../src/services/linkService';
import { makeTempDir, removeDir, writeFile } from './helpers';

test('inspectToolboxLink reports missing when nothing occupies the path', async () => {
  const root = await makeTempDir('link-missing');
  try {
    const status = await inspectToolboxLink(path.join(root, 'shared_toolbox'), path.join(root, 'toolbox-target'));
    assert.equal(status, 'missing');
  } finally {
    await removeDir(root);
  }
});

test('createToolboxLink + inspectToolboxLink report valid for a matching link', async () => {
  const root = await makeTempDir('link-valid');
  try {
    const target = path.join(root, 'toolbox-target');
    await fs.promises.mkdir(target, { recursive: true });
    const linkPath = path.join(root, 'project', 'shared_toolbox');

    await createToolboxLink(linkPath, target);
    const status = await inspectToolboxLink(linkPath, target);
    assert.equal(status, 'valid');

    // A file written through the link must be visible at the physical target.
    await writeFile(path.join(linkPath, 'proof.txt'), 'hello');
    const proof = await fs.promises.readFile(path.join(target, 'proof.txt'), 'utf8');
    assert.equal(proof, 'hello');
  } finally {
    await removeDir(root);
  }
});

test('inspectToolboxLink reports wrong-target when the link points elsewhere', async () => {
  const root = await makeTempDir('link-wrong-target');
  try {
    const actualTarget = path.join(root, 'actual-target');
    const otherTarget = path.join(root, 'other-target');
    await fs.promises.mkdir(actualTarget, { recursive: true });
    await fs.promises.mkdir(otherTarget, { recursive: true });

    const linkPath = path.join(root, 'shared_toolbox');
    await createToolboxLink(linkPath, actualTarget);

    const status = await inspectToolboxLink(linkPath, otherTarget);
    assert.equal(status, 'wrong-target');
  } finally {
    await removeDir(root);
  }
});

test('inspectToolboxLink reports occupied-file for a normal file', async () => {
  const root = await makeTempDir('link-occupied-file');
  try {
    const linkPath = path.join(root, 'shared_toolbox');
    await writeFile(linkPath, 'not a link');
    const status = await inspectToolboxLink(linkPath, path.join(root, 'target'));
    assert.equal(status, 'occupied-file');
  } finally {
    await removeDir(root);
  }
});

test('inspectToolboxLink reports occupied-directory for a real directory', async () => {
  const root = await makeTempDir('link-occupied-dir');
  try {
    const linkPath = path.join(root, 'shared_toolbox');
    await fs.promises.mkdir(linkPath, { recursive: true });
    const status = await inspectToolboxLink(linkPath, path.join(root, 'target'));
    assert.equal(status, 'occupied-directory');
  } finally {
    await removeDir(root);
  }
});

test('removeToolboxLinkOnly refuses to remove a real directory', async () => {
  const root = await makeTempDir('link-refuse-remove');
  try {
    const linkPath = path.join(root, 'shared_toolbox');
    await fs.promises.mkdir(linkPath, { recursive: true });
    await assert.rejects(() => removeToolboxLinkOnly(linkPath));
    assert.ok(fs.existsSync(linkPath));
  } finally {
    await removeDir(root);
  }
});

test('repairToolboxLink fixes a broken link', async () => {
  const root = await makeTempDir('link-repair-broken');
  try {
    const target = path.join(root, 'target');
    await fs.promises.mkdir(target, { recursive: true });
    const linkPath = path.join(root, 'shared_toolbox');
    await createToolboxLink(linkPath, target);

    // Break it by removing the target and pointing at a non-existent one instead.
    await removeToolboxLinkOnly(linkPath);
    await createToolboxLink(linkPath, path.join(root, 'ghost-target'));
    const brokenStatus = await inspectToolboxLink(linkPath, target);
    assert.equal(brokenStatus, 'broken');

    const repaired = await repairToolboxLink(linkPath, target);
    assert.equal(repaired, 'valid');
  } finally {
    await removeDir(root);
  }
});

test('repairToolboxLink throws instead of deleting a real occupying directory', async () => {
  const root = await makeTempDir('link-repair-occupied');
  try {
    const target = path.join(root, 'target');
    await fs.promises.mkdir(target, { recursive: true });
    const linkPath = path.join(root, 'shared_toolbox');
    await fs.promises.mkdir(linkPath, { recursive: true });
    await writeFile(path.join(linkPath, 'real-file.txt'), 'keep me');

    await assert.rejects(() => repairToolboxLink(linkPath, target));
    assert.ok(fs.existsSync(path.join(linkPath, 'real-file.txt')));
  } finally {
    await removeDir(root);
  }
});

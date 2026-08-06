import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/** Creates a fresh temp directory for a test and returns its path. Caller must clean up. */
export async function makeTempDir(prefix: string): Promise<string> {
  return fs.promises.mkdtemp(path.join(os.tmpdir(), `admin-local-test-${prefix}-`));
}

export async function removeDir(dir: string): Promise<void> {
  await fs.promises.rm(dir, { recursive: true, force: true });
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, content, 'utf8');
}

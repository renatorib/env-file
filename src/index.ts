import fsp from "node:fs/promises";
import path from "node:path";

export async function readEnvFile(filepath: string) {
  if (!(await access(filepath))) return "";
  return await fsp.readFile(filepath, "utf8");
}

export async function writeEnvFile(filepath: string, content: string) {
  await ensureDir(filepath);
  await fsp.writeFile(filepath, content);
}

export function getEnv(content: string, key: string) {
  return [...content.matchAll(new RegExp(`(?<=\n|^)(${key})=(?<value>.*)(\n|$)`, "g"))][0]?.groups?.value ?? null;
}

export function getEnvs(content: string) {
  const matches = [...content.matchAll(/(?<=\n|^)(?<key>[^#\n]*)=(?<value>.*)(\n|$)/g)];
  return matches.reduce((acc, m) => ({ ...acc, [m.groups!.key]: m.groups!.value }), {} as Record<string, string>);
}

export function setEnv(content: string, key: string, value: string) {
  if (getEnv(content, key) == null) {
    return `${content}${content.endsWith("\n") || content === "" ? "" : "\n"}${key}=${value}`;
  }
  return content.replace(new RegExp(`(?<=\n|^)(${key})=.*(\n|$)`, "g"), (_, $key, $end) => `${$key}=${value}${$end}`);
}

export function setEnvs(content: string, envs: Record<string, string>) {
  for (const [key, value] of Object.entries(envs)) content = setEnv(content, key, value);
  return content;
}

export function deleteEnv(content: string, key: string) {
  return content.replace(new RegExp(`(?<=\n|^)${key}=.*(\n|$)`, "g"), "");
}

export function deleteEnvs(content: string, keys: string[]) {
  for (const key of keys) content = deleteEnv(content, key);
  return content;
}

export async function pipe(filepath: string) {
  let content = await readEnvFile(filepath);
  return {
    get(key: string) {
      return getEnv(content, key);
    },
    set(key: string, value: string) {
      content = setEnv(content, key, value);
      return this;
    },
    delete(key: string) {
      content = deleteEnv(content, key);
      return this;
    },
    async write() {
      return writeEnvFile(filepath, content);
    },
  };
}

async function access(_path: string) {
  // prettier-ignore
  return fsp.access(_path).then(() => true).catch(() => false);
}

async function ensureDir(filepath: string) {
  if (!(await access(path.dirname(filepath)))) {
    await fsp.mkdir(path.dirname(filepath), { recursive: true });
  }
}

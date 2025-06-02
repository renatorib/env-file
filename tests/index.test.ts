import fsp from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { readEnvFile, writeEnvFile, getEnv, getEnvs, setEnv, setEnvs, deleteEnv, deleteEnvs } from "../src";

describe("getEnv", () => {
  test("should return the value of the key", () => {
    const content = "FOO=foo\nBAR=bar\n\nBAZ=baz";
    expect(getEnv(content, "FOO")).toBe("foo");
    expect(getEnv(content, "BAR")).toBe("bar");
    expect(getEnv(content, "BAZ")).toBe("baz");
  });

  test("should return empty string if the key is present but empty", () => {
    const content = "FOO=\nBAZ=\n\nBAR=";
    expect(getEnv(content, "FOO")).toBe("");
    expect(getEnv(content, "BAZ")).toBe("");
    expect(getEnv(content, "BAR")).toBe("");
  });

  test("should return null if the key is not present", () => {
    const content = "FOO=foo\nBAR=bar\n\nBAZ=baz";
    expect(getEnv(content, "QUX")).toBeNull();
    expect(getEnv(content, "OTHER")).toBeNull();
  });

  test("should ignore comments", () => {
    const content = "FOO=foo\n#BAR=bar\n\n# BAZ=baz";
    expect(getEnv(content, "FOO")).toBe("foo");
    expect(getEnv(content, "BAR")).toBeNull();
    expect(getEnv(content, "BAZ")).toBeNull();
  });
});

describe("getEnvs", () => {
  test("should return all the envs", () => {
    const content = "FOO=foo\nBAR=bar\n\nBAZ=baz";
    expect(getEnvs(content)).toEqual({ FOO: "foo", BAR: "bar", BAZ: "baz" });
  });

  test("should ignore comments", () => {
    const content = "FOO=foo\n#BAR=bar\n\n# BAZ=baz";
    expect(getEnvs(content)).toEqual({ FOO: "foo" });
  });
});

describe("setEnv", () => {
  test("should set env and preserve structure", () => {
    const content = "FOO=foo\nBAR=bar\n\n\n\nBAZ=baz\n\n";
    expect(setEnv(content, "FOO", "foo2")).toEqual("FOO=foo2\nBAR=bar\n\n\n\nBAZ=baz\n\n");
    expect(setEnv(content, "BAR", "bar2")).toEqual("FOO=foo\nBAR=bar2\n\n\n\nBAZ=baz\n\n");
    expect(setEnv(content, "BAZ", "baz2")).toEqual("FOO=foo\nBAR=bar\n\n\n\nBAZ=baz2\n\n");
    expect(setEnv(content, "QUX", "qux")).toEqual("FOO=foo\nBAR=bar\n\n\n\nBAZ=baz\n\nQUX=qux");
  });

  test("should not prepend newline if the file is empty", () => {
    expect(setEnv("", "FOO", "foo")).toEqual("FOO=foo");
  });

  test("should ignore comments", () => {
    expect(setEnv("#QUX=qux", "QUX", "qux")).toEqual("#QUX=qux\nQUX=qux");
    expect(setEnv("# QUX=qux", "QUX", "qux")).toEqual("# QUX=qux\nQUX=qux");
    expect(setEnv("# bar env var\nBAR=bar", "BAR", "new")).toEqual("# bar env var\nBAR=new");
    expect(setEnv("# bar env var\n#BAR=bar", "BAR", "new")).toEqual("# bar env var\n#BAR=bar\nBAR=new");
  });

  test("should insert \\n at the end of the file if it's not present", () => {
    expect(setEnv("FOO=foo", "BAR", "bar")).toEqual("FOO=foo\nBAR=bar");
    expect(setEnv("FOO=foo\n", "BAR", "bar")).toEqual("FOO=foo\nBAR=bar");
  });
});

describe("setEnvs", () => {
  test("should return all the envs", () => {
    const content = "FOO=foo\nBAR=bar\n\nBAZ=baz";
    expect(setEnvs(content, { FOO: "foo2" })).toEqual("FOO=foo2\nBAR=bar\n\nBAZ=baz");
    expect(setEnvs(content, { FOO: "" })).toEqual("FOO=\nBAR=bar\n\nBAZ=baz");
    expect(setEnvs(content, { BAZ: "baz2", NEW: "new" })).toEqual("FOO=foo\nBAR=bar\n\nBAZ=baz2\nNEW=new");
  });
});

describe("deleteEnv", () => {
  test("should return all the envs", () => {
    const content = "FOO=foo\nBAR=bar\n\nBAZ=baz";
    expect(deleteEnv(content, "FOO")).toEqual("BAR=bar\n\nBAZ=baz");
    expect(deleteEnv(content, "BAR")).toEqual("FOO=foo\n\nBAZ=baz");
    expect(deleteEnv(content, "BAZ")).toEqual("FOO=foo\nBAR=bar\n\n");
  });

  test("should ignore comments", () => {
    expect(deleteEnv("#FOO=foo", "FOO")).toEqual("#FOO=foo");
    expect(deleteEnv("#FOO=foo\nFOO=foo\n", "FOO")).toEqual("#FOO=foo\n");
  });
});

describe("deleteEnvs", () => {
  test("should return all the envs", () => {
    expect(deleteEnvs("FOO=foo\nBAR=bar\n\nBAZ=baz", ["FOO", "BAR", "BAZ"])).toEqual("\n");
    expect(deleteEnvs("FOO=foo\nBAR=bar\nBAZ=baz", ["FOO", "BAR", "BAZ"])).toEqual("");
  });
});

describe("readEnvFile", () => {
  beforeAll(async () => {
    await fsp.writeFile(".test.env", "FOO=bar");
  });
  afterAll(async () => {
    await fsp.unlink(".test.env");
  });
  test("should return the content of the file", async () => {
    expect(await readEnvFile(".test.env")).toEqual("FOO=bar");
  });
  test("should fallback to empty string if the file does not exist", async () => {
    expect(await readEnvFile(".notexists.env")).toEqual("");
  });
});

describe("readEnvFile", () => {
  beforeAll(() => fsp.writeFile(".env-test.local", "FOO=bar"));

  test("should return the content of the file", async () => {
    expect(await readEnvFile(".env-test.local")).toEqual("FOO=bar");
  });
  test("should fallback to empty string if the file does not exist", async () => {
    expect(await readEnvFile(".env-test-2.local")).toEqual("");
  });

  afterAll(() => fsp.unlink(".env-test.local"));
});

describe("writeEnvFile", () => {
  test("should create the file if it does not exist", async () => {
    await writeEnvFile(".env-test.local", "FOO=bar");
    expect(await fsp.readFile(".env-test.local", "utf-8")).toEqual("FOO=bar");
    await fsp.unlink(".env-test.local");
  });

  test("should override the file if it exists", async () => {
    await fsp.writeFile(".env-test.local", "BAR=baz");
    await writeEnvFile(".env-test.local", "FOO=bar");
    expect(await fsp.readFile(".env-test.local", "utf-8")).toEqual("FOO=bar");
    await fsp.unlink(".env-test.local");
  });
});

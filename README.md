# io-env

Lightweight, zero-dependency library to manipulate env files preserving its structure.

## Installation

```bash
npm install io-env
# yarn add io-env
# pnpm add io-env
```

## Usage

```ts
import { readEnvFile, writeEnvFile, getEnv, setEnv } from "io-env";

let content = await readEnvFile(".env.local");
if (getEnv("APP_SECRET") == null) {
  content = setEnv("APP_SECRET", generateNewSecret());
}
await writeEnvFile(".env.local", content);
```

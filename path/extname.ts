// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { extname as posixExtname } from "./posix/extname.ts";
import { extname as windowsExtname } from "./windows/extname.ts";
/**
 * Return the extension of the path with leading period (".").
 *
 * @example Usage
 * ```ts
 * import { extname } from "@std/path/extname";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(extname("C:\\home\\user\\Documents\\image.png"), ".png");
 * } else {
 *   assertEquals(extname("/home/user/Documents/image.png"), ".png");
 * }
 * ```
 *
 * @param path Path with extension.
 * @returns The file extension. E.g. returns `.ts` for `file.ts`.
 */
export function extname(path: string): string;
/**
 * Return the extension of the path with leading period (".").
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { extname } from "@std/path/extname";
 * import { assertEquals } from "@std/assert";
 *
 * if (Deno.build.os === "windows") {
 *   assertEquals(extname(new URL("file:///C:/home/user/Documents/image.png")), ".png");
 * } else {
 *   assertEquals(extname(new URL("file:///home/user/Documents/image.png")), ".png");
 * }
 * ```
 *
 * @param path Path with extension.
 * @returns The file extension. E.g. returns `.ts` for `file.ts`.
 */
export function extname(path: URL): string;
export function extname(path: string | URL): string {
  // deno-lint-ignore no-explicit-any
  return isWindows ? windowsExtname(path as any) : posixExtname(path as any);
}

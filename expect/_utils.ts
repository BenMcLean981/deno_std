// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright (c) Meta Platforms, Inc. and affiliates. All rights reserved. MIT license.

import type { EqualOptions, EqualOptionUtil } from "./_types.ts";
import type { Tester } from "./_types.ts";
import { equal } from "./_equal.ts";

export function buildEqualOptions(options: EqualOptionUtil): EqualOptions {
  const { customMessage, customTesters = [], strictCheck } = options || {};
  return {
    customTesters,
    msg: customMessage,
    strictCheck,
  };
}

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  if (value == null) {
    return false;
  } else {
    return typeof ((value as Record<string, unknown>).then) === "function";
  }
}

// deno-lint-ignore no-explicit-any
export function hasIterator(object: any) {
  return !!(object != null && object[Symbol.iterator]);
}

export function isA<T>(typeName: string, value: unknown): value is T {
  return Object.prototype.toString.apply(value) === `[object ${typeName}]`;
}

function isObject(a: unknown) {
  return a !== null && typeof a === "object";
}

// deno-lint-ignore no-explicit-any
function entries(obj: any) {
  if (!isObject(obj)) return [];

  return Object.getOwnPropertySymbols(obj)
    .filter((key) => key !== Symbol.iterator)
    .map((key) => [key, obj[key as keyof typeof obj]])
    .concat(Object.entries(obj));
}

// Ported from https://github.com/jestjs/jest/blob/442c7f692e3a92f14a2fb56c1737b26fc663a0ef/packages/expect-utils/src/utils.ts#L173
export function iterableEquality(
  // deno-lint-ignore no-explicit-any
  a: any,
  // deno-lint-ignore no-explicit-any
  b: any,
  customTesters: Tester[] = [],
  aStack: unknown[] = [],
  bStack: unknown[] = [],
): boolean | undefined {
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    Array.isArray(a) ||
    Array.isArray(b) ||
    !hasIterator(a) ||
    !hasIterator(b)
  ) {
    return undefined;
  }
  if (a.constructor !== b.constructor) {
    return false;
  }
  let length = aStack.length;
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    // circular references at same depth are equal
    // circular reference is not equal to non-circular one
    if (aStack[length] === a) {
      return bStack[length] === b;
    }
  }
  aStack.push(a);
  bStack.push(b);

  // deno-lint-ignore no-explicit-any
  const iterableEqualityWithStack = (a: any, b: any) =>
    iterableEquality(
      a,
      b,
      [...filteredCustomTesters],
      [...aStack],
      [...bStack],
    );

  // Replace any instance of iterableEquality with the new
  // iterableEqualityWithStack so we can do circular detection
  const filteredCustomTesters: Tester[] = [
    ...customTesters.filter((t) => t !== iterableEquality),
    iterableEqualityWithStack,
  ];

  if (a.size !== undefined) {
    if (a.size !== b.size) {
      return false;
    } else if (isA<Set<unknown>>("Set", a)) {
      let allFound = true;
      for (const aValue of a) {
        if (!b.has(aValue)) {
          let has = false;
          for (const bValue of b) {
            const isEqual = equal(aValue, bValue, {
              customTesters: filteredCustomTesters,
            });
            if (isEqual === true) {
              has = true;
            }
          }

          if (has === false) {
            allFound = false;
            break;
          }
        }
      }
      // Remove the first value from the stack of traversed values.
      aStack.pop();
      bStack.pop();
      return allFound;
    } else if (isA<Map<unknown, unknown>>("Map", a)) {
      let allFound = true;
      for (const aEntry of a) {
        if (
          !b.has(aEntry[0]) ||
          !equal(aEntry[1], b.get(aEntry[0]), {
            customTesters: filteredCustomTesters,
          })
        ) {
          let has = false;
          for (const bEntry of b) {
            const matchedKey = equal(
              aEntry[0],
              bEntry[0],
              { customTesters: filteredCustomTesters },
            );

            let matchedValue = false;
            if (matchedKey === true) {
              matchedValue = equal(
                aEntry[1],
                bEntry[1],
                { customTesters: filteredCustomTesters },
              );
            }
            if (matchedValue === true) {
              has = true;
            }
          }

          if (has === false) {
            allFound = false;
            break;
          }
        }
      }
      // Remove the first value from the stack of traversed values.
      aStack.pop();
      bStack.pop();
      return allFound;
    }
  }

  const bIterator = b[Symbol.iterator]();

  for (const aValue of a) {
    const nextB = bIterator.next();
    if (
      nextB.done ||
      !equal(aValue, nextB.value, { customTesters: filteredCustomTesters })
    ) {
      return false;
    }
  }
  if (!bIterator.next().done) {
    return false;
  }

  const aEntries = entries(a);
  const bEntries = entries(b);
  if (!equal(aEntries, bEntries)) {
    return false;
  }

  // Remove the first value from the stack of traversed values.
  aStack.pop();
  bStack.pop();
  return true;
}

/**
 * Vitest global setup — runs before every test file.
 *
 * Shims globalThis.jest = vi so that existing test files using
 * jest.fn() / jest.spyOn() / jest.mock() continue to work without
 * any source changes. The vitest vi object is API-compatible with
 * the jest object for all mocking operations used in this codebase.
 *
 * `@testing-library/jest-dom` is intentionally NOT imported here:
 *   - default test environment is "node" (no DOM)
 *   - no test currently uses DOM matchers
 *   - importing it would force jsdom to load and trigger the
 *     jsdom + @asamuzakjp/css-color top-level-await crash on Node 20.
 *
 * If future component tests need DOM matchers, import jest-dom locally
 * in those files together with `// @vitest-environment jsdom`.
 */
import { vi } from "vitest";

Object.assign(globalThis, { jest: vi });

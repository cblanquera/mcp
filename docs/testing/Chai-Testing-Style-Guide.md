# Unit Testing Style Guide With Mocha + Chai + TypeScript

Authoritative guidance for writing **unit tests** with **Mocha + Chai** in a **TypeScript** codebase. Focus on clarity, determinism, and type safety. **Never use `any`; if unavoidable, use `unknown` and narrow.**

## 1. Quick-Start Checklist

The following is a quick checklist to follow when writing tests.

 - Test **behavior**, not internal implementation details.  
 - Keep tests **fast, isolated, deterministic** (no real network/FS/time).  
 - Use **`async/await`** (no `done` callbacks).  
 - Standardize on **Chai `expect`** + **chai-as-promised** + **sinon-chai**.  
 - Create a **sinon sandbox** per test/suite; **restore in `afterEach`**.  
 - Use **fake timers** for time-dependent code; restore after each test.  
 - Prefer **typed factories/builders** over static fixtures.  
 - Catch errors as **`unknown`** and **narrow** before asserting.  
 - TS strictness: enable `strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. 
 - For VSCode: Don't ask to save the file or run tests while VSCode is reporting type errors. Fix the type errors first.
 - Remove unused variables
 - No `.only` in commits; no hidden global state; no order dependence.  

## 2. Best Practices

The following describes the rational of each best practice and provides examples.

### 2.1. Behavior over Implementation

**Rationale:** Asserting *what* the code does (public API, outputs, visible side-effects) keeps tests robust during refactors.

```ts
// ✅ Good: assert observable behavior
it("returns the sum of two numbers", () => {
  expect(add(2, 3)).to.equal(5);
});

// ❌ Bad: asserts internal calls (brittle)
it("calls internal helper function", () => {
  const spy = sinon.spy(math, "internalAdd");
  add(2, 3);
  expect(spy.calledOnce).to.equal(true);
});
```

### 2.2. Async done right

**Rationale:** `async/await` prevents callback bugs and flakiness.

```ts
// ✅ Good: use async/await or promise-returning assertions
it("resolves with correct value", async () => {
  await expect(doAsyncThing()).to.eventually.equal("ok");
});

// ❌ Bad: using done() manually
it("resolves with correct value", (done) => {
  doAsyncThing().then((v) => { expect(v).to.equal("ok"); done(); });
});
```

### 2.3. Isolation & Cleanup

**Rationale:** Prevents cross-test contamination.

```ts
let sandbox: sinon.SinonSandbox;

beforeEach(() => { sandbox = sinon.createSandbox(); });
afterEach(() => { sandbox.restore(); });

// Example: stubbing a dependency
it("logs a warning once", () => {
  const warn = sandbox.stub(logger, "warn");
  doThing();
  expect(warn).to.have.been.calledOnce;
});
```

### 2.4. Type Safety (no `any`)

**Rationale:** Strong types in tests catch regressions early.

```ts
// ✅ Good: catch as unknown, then narrow
it("throws a TypeError", () => {
  try {
    mightThrow();
    expect.fail("should have thrown");
  } catch (err: unknown) {
    if (err instanceof TypeError) {
      expect(err.message).to.match(/invalid/);
    } else {
      throw err; // keep unknowns honest
    }
  }
});

// ❌ Bad: `any` erases type safety
it("throws a TypeError", () => {
  try { mightThrow(); } catch (err: any) {
    expect(err.message).to.match(/invalid/);
  }
});
```

**Tips:**

- Prefer `satisfies` over `as` to validate shapes without losing correctness.
- Create tiny narrowing helpers: `function assertIsFoo(x: unknown): asserts x is Foo { /* ... */ }`.

### 2.5. Fixtures & Factories

**Rationale:** Small, expressive data reduces noise and coupling.

```ts
type User = { id: string; name: string; email: string };

function makeUser(overrides: Partial<User> = {}): User {
  return { id: "u1", name: "Alice", email: "a@example.com", ...overrides };
}

// ✅ Good
it("creates user with default name", () => {
  const user = makeUser();
  expect(user.name).to.equal("Alice");
});

// ❌ Bad: giant static blobs hide intent
const hugeFixture = { /* hundreds of lines */ };
```

### 2.6. Determinism (Time, Randomness, UUIDs)

**Rationale:** Tests must pass the same way every run.

```ts
// ✅ Good: fake the clock
it("expires after 1s", () => {
  const clock = sinon.useFakeTimers();
  const token = new Token();
  clock.tick(1000);
  expect(token.isExpired()).to.equal(true);
  clock.restore();
});
```

> TIP: also stub randomness/UUIDs, silence logs, use temp dirs per test (unique paths).

### 2.7. Boundaries & Test Doubles

**Rationale:** Mock/stub only at boundaries (network/FS/env/process). Test your own logic “for real”.

```ts
// ✅ Good: stub boundary, assert outcome
it("posts data to API", async () => {
  const post = sandbox.stub(http, "post").resolves({ status: 200 });
  const ok = await submit(payload);
  expect(ok).to.equal(true);
  expect(post).to.have.been.calledWithMatch("/api/submit", payload);
});

// ❌ Bad: mock everything inside your module (brittle and tautological)
```

> TIP: Prefer stubs/fakes; avoid strict mocks unless verifying a protocol is essential.

### 2.8. Structure, Naming, Hooks

**Rationale:** Discoverability and independence.

- Titles: `describe("Calculator")` → `it("adds negatives")`.  
- One “behavior theme” per test (multiple related assertions are okay).  
- Use `beforeEach/afterEach` for state; keep `before/after` for once-only expensive setup.

### 2.9. Project Layout & Config

**Rationale:** Consistency speeds dev & CI.

- Choose either **colocation** (`foo.test.ts` beside `foo.ts`) or **mirrored tree** (`tests/foo.test.ts` mirroring `src/foo.ts`).  
- Keep one test file per module/feature for targeted runs.  
- Small timeouts (e.g., 2000ms); stable ordering assumptions are disallowed.

### 2.10. Coverage & CI

**Rationale:** Enforced coverage + fast feedback prevents regressions.

- Use **NYC/Istanbul** with meaningful global & per-file thresholds.  
- Run on each PR across supported Node versions; cache installs/builds.  
- Keep unit tests independent of full builds when possible to enable `--watch` locally.

### 2.11. TS/ESM Setup Notes (no CLI lines)

**Rationale:** Avoid module-system foot-guns.

- If your code is ESM, set `module` & `moduleResolution` to `NodeNext`; include proper **file extensions** in imports.  
- Provide a `tsconfig.test.json` that extends base config and adds:  
  ```json
  {
    "compilerOptions": {
      "types": ["mocha", "chai", "node"],
      "sourceMap": true,
      "strict": true,
      "noImplicitAny": true,
      "noUncheckedIndexedAccess": true,
      "exactOptionalPropertyTypes": true
    }
  }
  ```
- If you use TS path aliases, load mappings in tests (e.g., `tsconfig-paths`) so imports resolve identically.

## 3. Bad Smells Reference Table

The following table briefly describe bad practices and why you should avoid using.

| Smell | Bad Example | Why It’s Harmful | Preferred Approach |
|---|---|---|---|
| Committing `.only` | `it.only("…", …)` | Skips most tests; hides failures. | Forbid via lint; remove `.only` before commit; use targeted file runs locally. |
| Testing internals | Spying on private helpers | Brittle under refactor; not user-visible behavior. | Assert public outputs/side-effects; expose seams via DI if needed. |
| Using `done` | `(done) => asyncWork().then(() => done())` | Races, hangs, double-calls. | Return promises / use `async/await`. |
| Real time / sleeps | `await delay(1000)` | Flaky & slow; depends on timing. | Fake timers; assert on conditions/events. |
| Real network/FS | Hits live API or disk | Nondeterministic, slow, external dependencies. | Stub boundary modules; provide in-memory fakes. |
| Global state leakage | Mutating singletons/env across tests | Order-dependent flakes. | Reset in `afterEach`; inject state; isolate modules. |
| Not restoring stubs | Forgetting `sandbox.restore()` | Side-effects persist to later tests. | Create sandbox per test/suite; always restore in `afterEach`. |
| `any` in tests | `catch (e: any)` | Masks type errors; brittle assertions. | `unknown` + narrow (`instanceof`, predicates). |
| Huge fixtures | 500-line JSON blobs | Obscures intent; fragile when schema changes. | Typed factories/builders; minimal representative data. |
| Over-mocking | Mocking your own logic | Tautological tests; zero confidence. | Mock **only** external boundaries; exercise your code paths. |
| Exact error text | `expect(err.message).to.equal("Foo!")` | Localized/wording changes break tests. | Assert on error type; use `match(/foo/i)` if message is contract. |
| Order dependence | Test B assumes Test A ran | Flaky in parallel or reordering. | Make tests independent; build required state per test. |
| Randomness | Using `Math.random()` in behavior | Nondeterministic failures. | Stub randomness or seed a PRNG with known seed. |
| Port/file collisions | Hard-coded ports/paths | Parallel runs fail sporadically. | Use ephemeral ports, unique temp dirs per test. |

## 4. Appendix — Recommended Packages

- **chai** — assertions (`expect`)  
- **chai-as-promised** — promise/async assertions  
- **sinon** — stubs, spies, fakes, fake timers  
- **sinon-chai** — Chai matchers for sinon (`to.have.been.called…`)  
- **nyc** — coverage (Istanbul)  
- **tsx** *or* **ts-node** — execute TS tests without prebuild  
- **tsconfig-paths** — resolve TS path aliases in tests

## 5. Other Notes

- Prefer **small, named helpers** over repeating setup.  
- Keep assertions **specific but not brittle** (avoid overspecifying).  
- When in doubt, **reduce scope**: one behavior, minimal data, deterministic environment.

```ts
// Tiny example template
describe("Widget", () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => { sandbox = sinon.createSandbox(); });
  afterEach(() => { sandbox.restore(); });

  it("emits 'ready' after init", async () => {
    const clock = sinon.useFakeTimers();
    const widget = new Widget();
    const p = once(widget, "ready"); // helper that returns a promise
    widget.init();
    clock.tick(10);
    await p;
    clock.restore();
  });
});
```

## 6. Common Type Errors & Fixes

The following explains common pitfalls and possible fixes.

### 6.1. “Cannot find name ‘describe/it/expect’”

**Issue:** TS doesn’t know Mocha/Chai globals.  

**Fix:** Install type defs and include them in a test tsconfig.  

**Example:**

```bash
npm i -D @types/mocha @types/chai
```

```json
// tsconfig.test.json
{ "compilerOptions": { "types": ["mocha","chai","node"] } }
```

### 6.2. Wrong Chai import (default vs named)

**Issue:** AI often generates `import expect from "chai"` (no default export), causing TS import errors.  

**Fix:** Use **named** import (ESM) or dynamic import (CJS).  

**Example:**

```ts
// ✅ Correct
import { expect } from "chai";

// ❌ Wrong
import expect from "chai";
```

### 6.3. Chai v5 is ESM-only → type/import mismatch in CJS

**Issue:** Using Chai v5 in a CJS test (e.g., `require("chai")`) triggers `ERR_REQUIRE_ESM` & TS friction.  

**Fix (pick one):** run tests as **ESM**; or use **dynamic import** in CJS; or pin chai@4.  

**Example:**

```ts
// ESM
import { expect } from "chai";

// CJS
const { expect } = await import("chai");
```

### 6.4. `chai-as-promised`: “Property ‘eventually’ does not exist”

**Issue:** Missing plugin types or not registering the plugin.  

**Fix:** Install `@types/chai-as-promised` and `chai.use()` in a shared setup.  

**Example:**

```bash
npm i -D chai-as-promised @types/chai-as-promised
```

```ts
// test/setup.ts
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
export const { expect } = chai;
```

### 6.5. `sinon-chai`: “Property ‘calledOnce’/‘calledWith’ does not exist”

**Issue:** Using sinon-chai matchers without the plugin types.  

**Fix:** Install `sinon-chai` + `@types/sinon-chai`, then `chai.use(sinonChai)` in setup.  

**Example:**

```bash
npm i -D sinon-chai @types/sinon-chai
```

```ts
import chai from "chai";
import sinonChai from "sinon-chai";
chai.use(sinonChai);
```

### 6.6. Global `expect` via `chai/register-expect` not seen by TS

**Issue:** You register a **global** `expect`, but TS can’t see the symbol → “Cannot find name ‘expect’”.  

**Fix:** Prefer importing `expect` from your setup; or add an **ambient declaration** and include it in `typeRoots`/`types`.  

**Example:**

```ts
// typings/global/index.d.ts
declare const expect: Chai.ExpectStatic;

// tsconfig.test.json
{
  "compilerOptions": {
    "typeRoots": ["node_modules/@types", "./typings"],
    "types": ["mocha","chai","node","global"]
  }
}
```

### 6.7. Catching errors as `any` (unsafe) instead of `unknown`

**Issue:** `catch (e: any)` erases type safety; accessing `e.message` can be unsafe.  

**Fix:** Catch as **`unknown`** and narrow with `instanceof Error`.  

**Example:**

```ts
try { mightThrow(); }
catch (e: unknown) {
  if (e instanceof Error) expect(e.message).to.match(/fail/);
  else throw e;
}
```

### 6.8. Stubbing classes unsafely (`as any`) instead of typed stubs

**Issue:** AI may write `(obj as any)` or stub non-existent members → silent type bugs.  

**Fix:** Use `sinon.createStubInstance(Class)` and `SinonStubbedInstance<T>`.  

**Example:**

```ts
import sinon, { SinonStubbedInstance } from "sinon";

class Repo { save(id: string): Promise<void> { return Promise.resolve(); } }

let repo: SinonStubbedInstance<Repo>;
beforeEach(() => { repo = sinon.createStubInstance(Repo); });

repo.save.resolves(); // typed and safe
```

### 6.9. ESM + TS: missing `.js` file extensions in imports

**Issue:** In ESM projects, AI often writes `import { add } from "../src/add";` (no extension). TS may compile but Node ESM resolution (at runtime) expects `.js`, leading to confusion.  

**Fix:** Use `module`/`moduleResolution` = **`NodeNext`** and include **`.js`** extensions in TS source imports.  

**Example:**

```ts
// ✅ ESM TS import
import { add } from "../src/add.js";
```

### 6.10. Tests not using a TS config that includes testing types

**Issue:** A single base `tsconfig.json` doesn’t include `"types": ["mocha","chai"]`; the test runner loads the wrong config, so globals are missing.  

**Fix:** Create **`tsconfig.test.json`** that extends base and adds testing `types`, then ensure your runner uses it.  

**Example:**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["mocha","chai","node"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": ["tests/**/*.ts", "test/setup.ts"]
}
```

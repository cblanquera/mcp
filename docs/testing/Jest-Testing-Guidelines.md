# Unit Testing Best Practices with Jest + TypeScript (and React)

This context file provides best practices for writing unit tests using **Jest** with **TypeScript**, and later, React. It emphasizes **clarity, determinism, and maintainability**.

## 1. Quick-Start Checklist

The following is a quick checklist to follow when writing tests.

 - Mirror source file paths for test files (`src/x/y.ts` → `tests/x/y.test.ts`).  
 - Write tests for behavior, not implementation.  
 - Keep tests independent and deterministic.  
 - Use factories/builders for test data.  
 - Mock only true boundaries (I/O, time, randomness, network).  
 - Reset state after each test.  
 - Use strict TypeScript (never `any`; prefer `unknown` and narrow).  
 - Prefer explicit assertions over snapshots.  
 - Don't ask to save the file or run tests while VSCode is reporting type errors. Fix the type errors first.  
 - Remove unused variables
 - Run tests in parallel; ensure they don’t rely on order.  

## 2. Jest + TypeScript Best Practices

When writing tests in Jest and Typescript please consider the following best practices.

### 2.1. Philosophy

Test **public behavior**, not private implementation. Each test should fail for exactly **one clear reason**.  

### 2.2. Organization

Use descriptive names:  

```ts
// ✅ Good
it("returns null when user is not found", () => { ... });

// ❌ Bad
it("test getUser", () => { ... });
```

### 2.3. Type Safety

Always respect strict TS rules. Use `unknown` if type is uncertain, never `any`.  

```ts
// ✅ Good
function parse(input: unknown): number | null {
  if (typeof input === "string") return parseInt(input);
  return null;
}

// ❌ Bad
function parse(input: any): number | null {
  return parseInt(input);
}
```

### 2.4. Test Data & Fixtures

Use builders/factories to avoid repetition:  

```ts
// ✅ Good
const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "u1",
  name: "Test User",
  email: "test@example.com",
  ...overrides,
});
```

### 2.5. Isolation & State

Use `beforeEach` / `afterEach` for clean setup/teardown. Avoid leaking state across tests.  

```ts
beforeEach(() => jest.resetModules());
afterEach(() => jest.clearAllMocks());
```

### 2.6. Mocking & Spies

Mock external boundaries only:  

```ts
// ✅ Good
jest.spyOn(Math, "random").mockReturnValue(0.42);

// ❌ Bad (mocking internals)
jest.spyOn(myService, "helperFunction").mockReturnValue(...);
```

### 2.7. Asynchrony

Always `await`. Prefer `findBy` queries or `waitFor`, not timeouts.  

```ts
// ✅ Good
await expect(service.doWork()).resolves.toEqual("done");

// ❌ Bad
setTimeout(() => expect(result).toBe("done"), 1000);
```

### 2.8. Error Handling

Assert owned error messages or error shape. Avoid brittle tests tied to third-party error wording.  

## 3. React-Specific Best Practices

When writing tests for ReactJS, please consider the following best practices.

### 3.1. Testing Goals

Test components like a user: **observable DOM and interactions**. Use **React Testing Library (RTL)**, not shallow rendering.  

```tsx
// ✅ Good
render(<LoginForm />);
expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();

// ❌ Bad
const wrapper = shallow(<LoginForm />);
expect(wrapper.find("button").prop("disabled")).toBe(true);
```

### 3.2. Interactions

Use `@testing-library/user-event` for realistic events:  

```tsx
// ✅ Good
await userEvent.type(screen.getByRole("textbox"), "hello");
await userEvent.click(screen.getByRole("button", { name: /go/i }));
```

### 3.3. State & Effects

Test effects via **observable behavior**, not hook internals.  

## 3.4. Bad Smells Table

The following table briefly describe bad practices and why you should avoid using.

| Smell | Why It’s Bad | Better Practice |
|-------|--------------|-----------------|
| Using `any` | Removes type safety | Use `unknown` + narrowing |
| Over-mocking | Mirrors implementation | Mock only boundaries |
| Brittle selectors (`.class > div`) | Breaks on refactor | Use role/label queries |
| Unseeded randomness | Non-deterministic | Mock randomness |
| Large snapshots | Hard to review | Assert explicit expectations |
| Shared mutable fixtures | Coupled tests | Use local builders |

## 4. CI & Coverage

Write tests to make sure they go through every facet of the code. Consider conditionals, switches, loops and varying protected/private method calls in the source code.

- Keep tests fast (<100ms each).  
- Ensure they pass in isolation and in any order.  
- Track mutation score (optional but useful).  

## 5. Common Issues and Fixes

The following explains common pitfalls and possible fixes.

### 5.1. Async Mocks and `mockResolvedValue` Inference (`never` error)

Im proper use of `mockResolvedValue()`.

**Issue**

```ts
const fetchUser = jest.fn();
fetchUser.mockResolvedValue({ id: 'u1' });
// ❌ Argument of type '{ id: string }' is not assignable to parameter of type 'never'.
```

**Why**  

Without explicit typing, `jest.fn()` infers `() => any`. `mockResolvedValue` expects the *awaited* type of a `Promise`, which falls back to `never`.

**Fix**  

Provide an explicit Promise return type using helpers or `jest.MockedFunction`.

**Example**

```ts
// Helper
function mockAsync<T, A extends any[] = []>() {
  return jest.fn<Promise<T>, A>();
}

const fetchUser = mockAsync<{ id: string }>();
fetchUser.mockResolvedValue({ id: 'u1' }); // ✅

const failingOp = mockAsync<void>();
failingOp.mockRejectedValue(new Error("boom")); // ✅
```

### 5.2. Global Test APIs Not Typed

Assert methods not found.

**Issue**

```
Cannot find name 'describe'
Cannot find name 'expect'
```

**Why**  

TypeScript doesn’t automatically include Jest’s global declarations.

**Fix** 

Add Jest to `types` in your tsconfig for tests.

**Example**

```json
{
  "compilerOptions": {
    "types": ["jest", "node"]
  }
}
```

---

### 5.3. jest-dom Matchers Missing

Methods in expressive test syntax not found.

**Issue**
```ts
expect(element).toBeInTheDocument();
// ❌ Property 'toBeInTheDocument' does not exist on type 'Matchers<...>'
```

**Why**  

`@testing-library/jest-dom` extends Jest’s matchers, but TypeScript only sees them if imported in setup.

**Fix**

Import `@testing-library/jest-dom` in a setup file, and include it in Jest config.

**Example**

```ts
// setupTests.ts
import '@testing-library/jest-dom';

// jest.config.js
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"]
};
```

### 5.4. jest.spyOn Target Errors

Spying on the wrong objects.

**Issue**

```ts
jest.spyOn(api, 'getUser');
// ❌ No overload matches this call
```

**Why**  

Spying on the wrong object (e.g., default export vs named export). TypeScript doesn’t see the function on the target object.

**Fix**

Spy on the *module namespace* that owns the function.

**Example**

```ts
import * as api from './api';
jest.spyOn(api, 'getUser').mockResolvedValue({ id: 'u1' }); // ✅
```

### 5.5. Async Assertions Mis-Typed

Testing promises.

**Issue**

```ts
expect(fetchUser()).resolves.toEqual({ id: 'u1' });
// ❌ This expression is not callable
```

**Why**  

Not awaiting a Promise; mixing sync matcher types with async calls.

**Fix**

Use `await expect(...).resolves` or `await` the promise before asserting.

**Example**

```ts
await expect(fetchUser()).resolves.toEqual({ id: 'u1' });

const result = await fetchUser();
expect(result).toEqual({ id: 'u1' });
```

### 5.6. Parameterized Tests Typing (`test.each`)

Weak typed arrays in `test.each()`.

**Issue**

```ts
test.each([
  ['42', 42],
  [42, 'oops'], // ❌ wrong types sneak in
])((input, expected) => { ... });
```

**Why**  

By default, Jest infers rows as `any[]`.

**Fix**

Type the row tuples.

**Example**

```ts
type Row = [input: string, expected: number];

test.each<Row>([
  ['42', 42],
  ['07', 7],
])('parses %s', (input, expected) => {
  expect(parseInt(input)).toBe(expected);
});
```

### 5.7. Path Aliases Mismatch

Importing with aliases in the source code.

**Issue**

```
Cannot find module '@/utils/foo'
```

**Why**  

TypeScript `paths` are not automatically mirrored in Jest.

**Fix**

Add equivalent mapping in Jest’s `moduleNameMapper`.

**Example**

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}

// jest.config.js
module.exports = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
};
```

### 5.7. DOM/Window Globals Missing

Using globals in tests.

**Issue**

```ts
window.matchMedia('(prefers-color-scheme: dark)');
// ❌ Property 'matchMedia' does not exist on type 'Window & typeof globalThis'
```

**Why**  

JSDOM doesn’t provide all browser APIs, or `lib` option in tsconfig is missing DOM types.

**Fix**

Add a shim for missing APIs, and include DOM lib in tsconfig.

**Example**

```ts
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(() => ({
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  })),
});

// tsconfig.json
{
  "compilerOptions": {
    "lib": ["esnext", "dom"]
  }
}
```

### 5.8. Custom Matchers / Extending Expect

Custom expressive methods.

**Issue**

```ts
expect(user).toHaveFoo();
// ❌ Property 'toHaveFoo' does not exist on type 'Matchers<any>'
```

**Why**  

Custom matchers need global type augmentation.

**Fix**

Declare the matcher type in a `.d.ts` file.

**Example**

```ts
// jest.d.ts
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveFoo(): R;
    }
  }
}
```

### 5.9. `mockRejectedValueOnce()` Override Bug

Using `mockRejectedValueOnce()`.

- **Issue:** Calling `.mockRejectedValueOnce()` may not override an existing `mockReturnValue`.
- **Workaround:** Use `.mockImplementation()` or `.mockResolvedValue()` instead.

### 5.10. React: Missing jsdom Environment

Using jsdom while not installed.

**Issue**

```ts
render(<App />);
// ❌ document is not defined
```

**Why**  

Jest default environment is `node`.

**Fix**

Set `testEnvironment: "jsdom"` in Jest config.

**Example**

```js
// jest.config.js
module.exports = {
  testEnvironment: "jsdom"
};
```

### 5.11. React: user-event Without Await

Not awaiting user event.

**Issue**

```ts
userEvent.type(screen.getByRole('textbox'), 'hello');
expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
// ❌ Assertion fails intermittently
```

**Why**  

`user-event` is async; without `await`, UI state may not be updated.

**Fix**

Always `await` user-event interactions.

**Example**

```ts
await userEvent.type(screen.getByRole('textbox'), 'hello');
expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
```

### 5.12. React: Using `getBy*` Instead of `findBy*`

Synchronous `getBy*` versus asyncronous `findBy*`.

**Issue**

```ts
expect(screen.getByText(/loaded/i)).toBeInTheDocument();
// ❌ Throws immediately if element appears later
```

**Why**  

`getBy*` is synchronous. For async UI, prefer `findBy*`.

**Fix**

Use `await screen.findBy*` when waiting for elements.

**Example**

```ts
expect(await screen.findByText(/loaded/i)).toBeInTheDocument();
```

### 5.13. React: Custom Render Wrapper Typing

Adding children in a childless component.

**Issue**

```ts
const renderWithProviders = (ui) =>
  render(<Provider>{ui}</Provider>);
// ❌ TypeScript complains about children
```

**Why**  

Wrapper component not typed with `PropsWithChildren`.

**Fix**

Type wrapper correctly, and preserve RTL’s return type.

**Example**

```ts
const renderWithProviders = (ui: React.ReactElement) => {
  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <Provider>{children}</Provider>
  );
  return render(ui, { wrapper: Wrapper });
};
```

### 5.14. React: act Warnings with Timers

Timers and React not flushing.

**Issue**

```
Warning: An update to Component inside a test was not wrapped in act(...)
```

**Why**  

Fake timers advanced without React being flushed.

**Fix**

Wrap timer advances in `act`, or prefer user-facing waits.

**Example**

```ts
act(() => {
  jest.runOnlyPendingTimers();
});
```

### 5.15. React: Router/Context Mocks

Mocking react.

**Issue**

```ts
jest.mock('react-router-dom', () => ({
  useParams: jest.fn().mockReturnValue({ id: '123' }),
}));
// ❌ Type errors if useParams not mocked with correct type
```

**Why**  

Mock shape doesn’t match hook type.

**Fix**

Use `jest.MockedFunction` to align with original hook.

**Example**

```ts
import { useParams } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

const mockedUseParams = useParams as jest.MockedFunction<typeof useParams>;
mockedUseParams.mockReturnValue({ id: '123' });
```
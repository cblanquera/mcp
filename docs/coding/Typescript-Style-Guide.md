# TypeScript Style Guide

This document defines the coding standards for TypeScript. The guide covers everything from formatting basics to advanced conventions such as overloads, delegation, and error handling.

## 1. Formatting and Syntax

The following describes the fundamental formatting rules that every developer must follow. It covers spacing, indentation, semicolons, quotes, and other low-level details that guarantee code consistency. These rules are non-negotiable and should be enforced through tooling (ESLint, Prettier, or EditorConfig).

### 1.1. Indentation, Spacing, and Line Length

Indentation and spacing make code easier to read. The goal is to keep the visual structure uniform so that code review focuses on logic, not style.

 1. Indentation must be 2 spaces. Tabs are not allowed.  
 2. Soft line length limit is 100 characters. Break lines before reaching it.  
 3. Place spaces after commas, around operators, and around union/intersection pipes.  

**✅ Good**
```ts
function sum(a: number, b: number): number {
  return a + b;
}
```

**❌ Bad**

```ts
function sum(a:number,b:number){return a+b;}
```

#### 1.1.1. Semicolons and Quotes

Always use semicolons and single quotes. This prevents ambiguity in parsing and avoids unnecessary diffs.

**✅ Good**

```ts
const name: string = 'Stackpress';
```

**❌ Bad**

```ts
const name = "Stackpress"
```

#### 1.1.2. Braces and Blank Lines

Opening braces go on the same line (K&R style). Document blocks such as functions, lists, or code must be separated by exactly one blank line.

**✅ Good**

```ts
if (value) {
  doSomething();
}
```

**❌ Bad**

```ts
if (value)
{
    doSomething()
}
```

#### 1.1.3. Empty Lines

Do not use multiple consecutive empty lines. One empty line between document blocks is enough.

> HINT: Remove duplicate blank lines during reviews.

### 1.2. Trailing Commas and Lists

Trailing commas are not allowed in import lists or parameter lists. Bullet and numbered lists in documentation must have at least two items.

 - ✅ Good: `foo(a, b, c)`  
 - ❌ Bad: `foo(a, b, c,)`  
 - ✅ Good: `import { one, two } from './module.js'`  
 - ❌ Bad: `import { one, two, } from './module.js'`

## 2. Imports

Organize imports by node modules like `node:path`, `node:fs`, packages (in `node_modules`) and local imports as well as type imports and actual imports. Consider the following.

```js
//node
import type { IncomingMessage } from 'node:http';
import { resolve } from 'node:path';
import fs from 'node:fs';
//modules
import type { Request } from '@whatwg/fetch';
import { Mailer, send } from 'simple-mailer'; 
import mustache from 'mustache';
//local
import type { User, Auth } from '../types.js';
import { getUser } from './helpers';
import Session from './Session.js';
```

When importing native node modules, prefix the name with `node:`.

```js
//✅ Good
import fs from 'node:fs';

//❌ Bad
import fs from 'fs';
```

## 3. Exports

Export blocks should always end with a semicolon (even if it is a function or class).

```ts
//✅ Good
export const template = 'Hello %s';

//✅ Good
export function getTemplate() {
  return template;
};

//✅ Good
export default class Template {};

//❌ Bad
export const welcome = 'Welcom %s'

//❌ Bad
export function getWelcome() {
  return welcome;
}

//❌ Bad
export class Message {}
```

## 4. Types, Classes, and Methods

The following describes how we declare types, classes, generics, and methods. It ensures that public APIs are explicit, overloads are well documented, and code is logically consistent. Strong typing and consistent modifiers are key to reliability and readability.

### 4.1. Styling Objects Types

Use commas to separate properties in an object type. Do not use semicolons to separate properties in an object type.

```ts
//✅ Good
type User = {
  name: string,
  age: number
};

//❌ Bad
type Post = {
  title: string;
  detail: string;
};

//❌ Bad
type Product = {
  title: string
  price: number
};
```

### 4.2. Types and Interfaces

Use `interface` to describe the public method and properies of a class. Use `interface` if you intend to implement it with a class. Use `type` to describe object properties, functions and variables. When it comes to object types, prefer to use `type` over `interface`.

```ts
//✅ Good
type User = {
  name: string,
  age: number
};

//✅ Good
interface Payments {
  amount: number,
  pay(cc: string): Promise<boolean>
}
class Checkout implements Payments {
  public amount = 0;
  async public pay(cc: string) {
    return true;
  }
}

//❌ Bad
interface Product {
  title: string,
  price: number
}
```

> Don't add semicolon at the end of an `interface` block.

### 4.3. Types and Generics

Generics must default to `unknown` unless otherwise required. Avoid `any`. If unavoidable, isolate it at module boundaries.

 - ✅ Good: `class Router<R = unknown, S = unknown>`  
 - ❌ Bad: `class Router<R = any, S = any>`  

**✅ Good**

```ts
function parse(input: unknown): string | number {
  if (typeof input === 'string' || typeof input === 'number') return input;
  throw new Error('Unsupported');
}
```

**❌ Bad**

```ts
function parse(input: any) { return input; }
```

#### 4.3.1. Type Annotations and Unions

Type annotations must not have a space before the colon and must have one space after. Unions and intersections must include spaces around the `|` and `&`.

**✅ Good**

```ts
let id: string | number;
```

**❌ Bad**

```ts
let id:string|number;
```

#### 4.3.2. Narrowing

Use narrowing with `typeof`, `Array.isArray`, or custom predicates. Never assume unknown input without checks.

**✅ Good**

```ts
function toArray(x: unknown): string[] {
  if (Array.isArray(x)) return x as string[];
  return [String(x)];
}
```

**❌ Bad**

```ts
function toArray(x: any) { return x; }
```

### 4.3.3. Built-In Types

When possible, prefer to use Typescript's built in types.

### 4.3.3.1. Record

Use `Record` to cleanly define an object. It's more readable.

```ts
//✅ Good
type EventMap = Record<string, Function>;

//❌ Bad - Can look confusing for complex objects.
type RouteMap = { [string]: Function };
```

### 4.3.3.2. Omit

Use `Omit` to remove properties that aren't needed from a type. You should use `Omit` if you want the final type to be affected whenever the parent type is changed.

```ts
type User = {
  name: string,
  role?: string,
  password: string,
  token: string,
  secret: string
};

//✅ Good
type Session = Omit<User, 'password' | 'secret'>;

//❌ Bad - Whenever you change the User type definition, you also have to change this.
type LoginCredentials = { name: string, password: string };
```

### 4.3.3.3. Pick

Use `Pick` to cherry pick the properties needed from a type. You should use `Pick` if you want the final type to be affected whenever the parent type is changed.

```ts
type User = {
  name: string,
  role?: string,
  password: string,
  token: string,
  secret: string
};

//✅ Good
type LoginCredentials = Pick<User, 'name' | 'password'>;

//❌ Bad - Whenever you change the User type definition, you also have to change this.
type Session = { name: string, role?: string, token: string };
```

### 4.3.3.4. Partial

Use `Partial` to make everything optional. You should use `Partial` if you want the final type to be affected whenever the parent type is changed.

```ts
type User = { 
  name: string,
  role?: string,
  password: string,
  token: string,
  secret: string
};

//✅ Good
type UserUpdateInputs = Partial<User>;

//❌ Bad - Whenever you change the User type definition, you also have to change this.
type UserInputs = { 
  name?: string,
  role?: string,
  password?: string,
  token?: string,
  secret?: string
};
```

### 4.3.3.5. Required

Use `Required` to make everything required. You should use `Required` if you want the final type to be affected whenever the parent type is changed.

```ts
type User = { 
  name: string,
  role?: string,
  password: string,
  token: string,
  secret: string
};

//✅ Good
type SignupInputs = Required<User>;

//❌ Bad - Whenever you change the User type definition, you also have to change this.
type Profile = { 
  name: string,
  role: string,
  password: string,
  token: string,
  secret: string
};
```

### 4.4. Functions and Class Methods

Don't add argument types if it can naturally be inferred.

```ts
//✅ Good
function increment(value: number, by = 1) {}

//❌ Bad
function decrement(value: number, by: number = 1) {}

//✅ Good
private _increment(value: number, by = 1) {}

//❌ Bad
private _decrement(value: number, by: number = 1) {}
```

Don't add a return type if it can naturally be inferred.

```ts
//✅ Good
function increment(value: number, by = 1) {
  return value + by;
}

//❌ Bad
function decrement(value: number, by = 1): number {
  return value - by;
}

//✅ Good
private _increment(value: number, by = 1) {
  return value + by;
}

//❌ Bad
private _decrement(value: number, by = 1): number {
  return value - by;
}
```

### 4.5. Classes, Members, and Overloads

Classes must use explicit access modifiers (`public`, `protected`, `private`). Internal helpers must be `protected`. `protected` and `private` methods must be prefixed with `_`.

```ts
class User {
  //✅ Good
  protected _setName() {}

  //❌ Bad
  protected setAge() {}

  //✅ Good
  private _saveFile() {}

  //❌ Bad
  private saveDB() {}
}
```

#### 4.5.1. Access Modifiers

Composition fields should be `readonly` if not reassignable. Getters are used to expose internal state instead of public mutable fields.

**✅ Good**

```ts
export default class Router {
  public readonly action: ActionRouter;

  public get routes() {
    return this.action.routes;
  }
};
```

**❌ Bad**

```ts
export default class Router {
  action;
  routes;
};
```

#### 4.5.2. Method Overloads

Public APIs should declare overload signatures, followed by one implementation.

**✅ Good**

```ts
public async resolve(event: string): Promise<void>;
public async resolve(method: Method, path: string): Promise<void>;
public async resolve(a: string, b?: string) {
  if (typeof b === 'string') return this._resolveRoute(a, b);
  return this._resolveEvent(a);
}
```

**❌ Bad**

```ts
public async resolve(a: any, b?: any) { return {}; }
```

## 5. Control Flow, Naming, and Documentation

The following covers delegation rules, naming conventions, and inline documentation. The goal is to make the codebase predictable, self-documenting, and easy for new developers to navigate. Consistent naming and documentation avoid misunderstandings during collaboration.

### 5.1. Delegation and Fluent APIs

Delegate by shape (string → view, paramless fn → import, function with params → action).  
Chainable methods should return `this`.

**✅ Good**

```ts
public on(event: string, action: AnyAction): this {
  if (typeof action === 'string') {
    this.view.on(event, action);
  } else {
    this.action.on(event, action);
  }
  return this;
}
```

**❌ Bad**

```ts
public on(e: any, a: any) {
  (this as any).whatever?.(e, a);
}
```

### 5.2. Naming

The following points briefly cover naming conventions.

 - Classes/Interfaces: `PascalCase`  
 - Functions/variables: `camelCase`  
 - Constants: `UPPER_SNAKE_CASE` only if truly constant  

**✅ Good**

```ts
class ActionRouter {}
const listenerCount = 5;
```

**❌ Bad**

```ts
class action_router {}
const X = 5;
```

### 5.3. Comments

Use JSDoc for all public members. Inline comments must explain **why**, not what.

**✅ Good**

```ts
/** Emits an event to all listeners. */
public async emit(event: string): Promise<void> {
  await this.action.emit(event);
}
```

**❌ Bad**

```ts
// emit event
public async emit(e) { }
```

## 6. Errors, Runtime, and Testing

The following explains how to handle errors, follow runtime conventions, and test code. Clear error handling and strict runtime conventions reduce production bugs. Testing ensures that APIs remain stable over time.

### 6.1. Errors and Results

Throw `Error` (or subclasses) with meaningful messages. Never swallow errors silently. Always return typed results.

**✅ Good**

```ts
if (!supported) {
  throw new Error(`Unsupported method: ${method}`);
}
```

**❌ Bad**

```ts
try { doThing(); } catch { return {}; }
```

### 6.2. Runtime and Testing

Runtime must be strict ESM. Tests must be black-box where possible, with filenames ending in `.test.ts`.

 - Local imports must use `.js` suffix.  
 - Separate `import type` from runtime imports.  
 - Test files import public APIs, not internals.  
 - Async code must be tested with `await`.

## 7. Conclusion

This style guide ensures Stackpress code is consistent, maintainable, and predictable. By following the rules for formatting, types, classes, delegation, naming, and errors, developers can focus on building features rather than fixing style issues.
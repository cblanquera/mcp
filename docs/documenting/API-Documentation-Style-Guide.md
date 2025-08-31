# API Documentation Style Guide

The following guidelines must be used when creating an API document. Before reading this, please see the [Documentation Guidelines](./[Documentation-Guidelines.md)

## 1. Documentation Structure

Use separate markdown files for each major component or class (e.g., `EventEmitter`, `ExpressEmitter`). Ensure each file follows a consistent structure with sections for features, public properties, methods, and examples.

## 2. Method Documentation

Avoid using tables for return values; instead, describe the return type in the method description.

## 3. Parameter Tables

Use tables to list parameters for each method, including type, default value (if applicable), and description.

## 4. Examples

Provide practical examples for each method to illustrate usage. Ensure examples are relevant and demonstrate typical use cases.

## 5. Public vs. Protected/Private

Focus on documenting public properties and methods. Avoid documenting protected or private members unless necessary for understanding public API behavior. Just call public properties, properties in the documentation.

## 6. Type Parameters

Clearly define type parameters for generic classes (e.g., `ItemQueue<I>`, `TaskQueue<A>`). Provide examples that demonstrate how to declare and use these types.

## 7. Feedback Integration

Continuously integrate user feedback to refine documentation. Address specific critiques, such as missing methods or incorrect examples, promptly.

## 8. Consistency and Clarity

Maintain consistency in formatting, terminology, and style across all documentation files. Ensure clarity and accessibility for the target audience, including junior developers.
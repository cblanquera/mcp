# ReactJS Style Guide

This document defines the coding standards for ReactJS. 

## 1. Wrapping

Always wrap components inside parenthesis.

```js
//✅ Good
const AsideMenu = () => (<aside>...</aside>); 
//❌ Bad
const AsideMenu = () => <aside>...</aside>; 
//❌ Bad
const AsideMenu = () => <aside>...</aside>

//✅ Good
function LeftMenu() {
  return (<div>...</div>);
}
//✅ Good
function LeftMenu() {
  return (
    <div>...</div>
  );
}
//❌ Bad
function LeftMenu() {
  return <div>...</div>
}
```

## 2. Spacing

When defining component prop arguments, it's important that it's easily readable. For complex props consider separating the type into a separate type definition. Consider the following.

```js
//✅ Good
function LeftMenu(props: LeftMenuProps) {
  //props
  const { items, active, error } = props;
}
//✅ Okay
function LeftMenu(props: { items: string[] }) {}
//✅ Okay
function LeftMenu({ items }: { items: string[] }) {}
//✅ Okay
function LeftMenu({ items, active, error }: {
  items: string[],
  active: string,
  error?: string
}) {
  //...
}
//❌ Bad
function LeftMenu({
  items,
  active,
  error
}: {
  items: string[],
  active: string,
  error?: string
}) {
  //...
}
```

## 3. Code Organization Outline

Organize your components in the following order.

 1. props
 2. hooks
 3. variables
 4. handlers
 5. effects

```ts
function LeftMenu(props: LeftMenuProps) {
  //1. props
  const { items, error, show, active } = props;
  //2. hooks
  const [ opened, open ] = useState(show);
  const [ selected, select ] = useState(active);
  //3. variables
  const icon = opened ? 'chevron-down': 'chevron-left';
  //4. handlers
  const toggle = () => open(opened => !opened);
  //5. effects
  useEffect(() => {
    error && notify('error', error);
  }, []);
  //6. render
  return (
    <aside>...</aside>
  );
}
```

## 4. Aggregate Hooks

Instead of setting up multiple hooks in a component, consider making a hook wrapper.

```js
function useLeftMenu(config: LeftMenuProps) {
  //1. config
  const { items, error, show, active } = config;
  //2. hooks
  const [ opened, open ] = useState(show);
  const [ selected, select ] = useState(active);
  //3. variables
  const icon = opened ? 'chevron-down': 'chevron-left';
  //4. handlers
  const toggle = () => open(opened => !opened);
  //5. effects
  useEffect(() => {
    error && notify('error', error);
  }, []);
  //6. Return usable variables
  return { opened, icon, toggle };
}

function LeftMenu(props: LeftMenuProps) {
  //1. hooks
  const { opened, icon, toggle } = useLeftMenu(props);
  //2. render
  return (
    <aside>...</aside>
  );
}
```

## 5. File Structure Options

The following points covers acceptable configurations when organizing React component files.

 - Separate general reusable components into their own file in a `components` folder.
 - Separate general reusable hooks into their own file in a `hooks` folder.
 - Components that are not reuable should stay in the same file as the component that uses it.
 - Hooks that are not reusable should stay in the same file as the component that uses it.
 - Keep aggregate hooks in the same file as the component that uses it.
 - Keep contexts and their providers in the same file.
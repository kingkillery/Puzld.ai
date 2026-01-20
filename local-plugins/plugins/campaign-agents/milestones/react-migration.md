---
domain: ui
keywords: [react, migration, solid, vue, angular, component, hooks, jsx, tsx]
confidence: high
---

# React Migration Pattern

## Context
Use when migrating UI components from another framework (Solid.js, Vue, Angular) to React.

## Steps
1. Set up React and TypeScript dependencies in package.json
2. Create shared type definitions that work with both frameworks during transition
3. Migrate leaf components first (no child components)
4. Convert state management (signals → useState, stores → useContext/Redux)
5. Update event handlers (framework-specific → React synthetic events)
6. Migrate parent components after children are complete
7. Update routing (if applicable)
8. Remove old framework dependencies
9. Run full test suite

## Pitfalls
- Don't mix framework state systems - choose one and migrate fully
- Watch for lifecycle differences (onMount vs useEffect)
- React's synthetic events behave differently from native events
- Solid's fine-grained reactivity doesn't map 1:1 to React's reconciliation

## Example
```tsx
// Before (Solid.js)
const [count, setCount] = createSignal(0);
<button onClick={() => setCount(c => c + 1)}>{count()}</button>

// After (React)
const [count, setCount] = useState(0);
<button onClick={() => setCount(c => c + 1)}>{count}</button>
```

## Verification Commands
- `npm run build` - Ensure no TypeScript errors
- `npm test` - Run component tests
- `npm run lint` - Check for React-specific lint rules

This is a SvelteKit library project targeting SvelteKit 2 and Svelte 5. It is written in TypeScript.

## Coding standards and type checking

- Run pnpm lint to quickly check for type errors. Run pnpm check for a more comprehensive type check.
- This is a library project, so all imports of library code need to be in the format "_.js", not "_"
- Always use pnpm to run scripts in package.json
- Always use arrow function syntax for function declarations (const functionName = () => {}) instead of plain function syntax.
- Prefer type declarations over interfaces.
- This is a greenfield project. There is no need to keep deprecated code. If new code will break tests, fix the tests.

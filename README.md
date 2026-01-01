# Standardoc CLI

A command-line tool for extracting and injecting documentation from code comments using `@tags`.

## Installation

```bash
npm install -g standardoc-cli
# or
bun add -g standardoc-cli
```

## Quick Start

1. **Scan your workspace** to extract documentation:
```bash
standardoc scan
```

2. **Transform your markdown files** to inject documentation:
```bash
standardoc transform
```

## Commands

### `init`

Generates a default `.standardoc.json` configuration file with all current comment patterns and transform settings.

```bash
standardoc init
```

### `scan`

Scans your workspace and generates a canonical JSON file with all extracted documentation.

```bash
standardoc scan
standardoc scan --output .docs/doc.json
standardoc scan --include "**/*.ts" --exclude "**/node_modules/**"
```

### `transform`

Transforms markdown files (`.md`, `.mdx`) by injecting documentation using the DSL syntax.

```bash
standardoc transform
```

### `watch`

Watch mode (continuously scan and transform). Not yet implemented.

## Documentation Format

In your code, use `@doc.init` to mark documentable blocks:

```typescript
/**
 * @doc.init myFunction
 * @description Adds two numbers together
 * @param a number First number
 * @param b number Second number
 * @returns number The sum
 */
function myFunction(a: number, b: number): number {
  return a + b;
}
```

## DSL Syntax

In your markdown files, use DSL expressions to inject documentation:

```markdown
## My Function

{{ @doc.myFunction:get('description', 0) }}

### Parameters

{{ @doc.myFunction:each('param', '- **{1}**: {0,1}') }}
```

## Configuration

Create a `.standardoc.json` file to customize comment patterns and transform settings:

```json
{
  "commentPatterns": {
    "ts": {
      "single": ["//"],
      "multi": { "start": "/*", "end": "*/" },
      "docSingle": ["///"],
      "docMulti": { "start": "/**", "end": "*/" }
    }
  },
  "transform": {
    "entry": "./docs-dev",
    "output": "./docs"
  }
}
```

Use `standardoc init` to generate a default configuration file.

## Options

- `-o, --output <path>` - Output path for JSON (default: `.standardoc/doc.json`)
- `--include <pattern>` - Glob patterns to include files (can be repeated)
- `--exclude <pattern>` - Glob patterns to exclude files (can be repeated)
- `-w, --watch` - Watch mode
- `-h, --help` - Show help

## License

MIT


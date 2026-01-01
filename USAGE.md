# Usage Guide

## Basic Workflow

1. **Write documentation in your code** using `@doc` tags (or custom tag from config)
2. **Scan the workspace** to extract documentation
3. **Write markdown files** with DSL expressions
4. **Transform markdown files** to inject documentation

## Writing Documentation

### Basic Example

```typescript
/**
 * @doc calculator Calculator
 * @description A simple calculator class
 */
class Calculator {
  /**
   * @doc calculator_add add
   * @description Adds two numbers
   * @param a number First number
   * @param b number Second number
   * @returns number The sum
   */
  add(a: number, b: number): number {
    return a + b;
  }
}
```

### Tag Format

- `@doc <key> [label]` - Marks a documentable block (default tag, can be customized)
- `@description` - Main description
- `@param <type> <name> <description>` - Function parameter
- `@returns <type> <description>` - Return value
- `@example` - Code example

## DSL Expressions

### Get a field value

```markdown
{{ @doc.calculator:get('description', 0) }}
```

### Get metadata

```markdown
{{ @doc.calculator:meta('path') }}
{{ @doc.calculator:meta('line') }}
```

### Iterate over tags

```markdown
{{ @doc.calculator_add:each('param', '- **{1}** (`{0,1}`): {0,0,1}') }}
```

### Conditional blocks

```markdown
{{ @if doc.calculator:has('example') }}
**Example:**
{{ @doc.calculator:get('example', 0) }}
{{ @end }}
```

## Examples

See the `examples/` directory for complete examples in different languages:
- TypeScript (`.ts`)
- Python (`.py`)
- Rust (`.rs`)
- C++ (`.cpp`)
- Lua (`.lua`)
- JavaScript (`.js`)

## Configuration

### Custom Doc Tag

Customize the tag name used to mark documentable blocks:

```json
{
  "docTag": "standardoc"
}
```

This allows you to use `@standardoc` instead of `@doc`, or any other tag name you prefer (e.g., `"doc.entry"`, `"doc.define"`, `"doc.block"`). The default is `"doc"`.

### Custom Comment Patterns

Create a `.standardoc.json` file to customize comment patterns for any file extension:

```json
{
  "commentPatterns": {
    "custom": {
      "single": ["#"],
      "docSingle": ["##"]
    },
    "ts": {
      "single": ["//"],
      "docSingle": ["///"]
    }
  }
}
```

Custom patterns override default patterns for the same extension.

### Transform Configuration

Configure entry and output directories for markdown transformation:

```json
{
  "transform": {
    "entry": "./docs-dev",
    "output": "./docs"
  }
}
```

When configured, files from `entry` are transformed and copied to `output` without `.generated.md` suffix.

### Ignore Files

Create a `.standardocignore` file to exclude files from scanning (similar to `.gitignore`).


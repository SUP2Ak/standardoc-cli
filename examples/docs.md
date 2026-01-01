# Documentation Standardoc

Ce fichier utilise le DSL Standardoc pour générer la documentation.

## Fonction add ({{ @doc.add:meta('ext') }})

{{ @doc.add:meta('path') }} (ligne {{ @doc.add:meta('line') }})

{{ @doc.add:get('description', 0) }}

### Paramètres

{{ @doc.add:each('param', '- **{1}** (`{0,1}`): {0,0,1}') }}

### Retour

{{ @doc.add:each('returns', '- Type: `{0,1}` - {0,0,1}') }}

### Exemple

{{ @doc.add:get('example', 0) }}

---

## Fonction multiply (Lua)

{{ @doc.multiply:meta('path') }} (ligne {{ @doc.multiply:meta('line') }})

{{ @doc.multiply:get('description', 0) }}

### Paramètres

{{ @doc.multiply:each('param', '- **{1}** (`{0,1}`): {0,0,1}') }}

---

## Classe Vector3 (C++)

{{ @doc.vector3:meta('path') }} (ligne {{ @doc.vector3:meta('line') }})

{{ @doc.vector3:get('description', 0) }}

### Méthode dot

{{ @doc.vector3_dot:get('description', 0) }}

{{ @if doc.vector3_dot:has('example') }}
**Exemple:**
{{ @doc.vector3_dot:get('example', 0) }}
{{ @end }}

---

## Structure Calculator (Rust)

{{ @doc.calculator:meta('path') }} (ligne {{ @doc.calculator:meta('line') }})

{{ @doc.calculator:get('description', 0) }}

### Méthodes disponibles

- `new()` - {{ @doc.calculator_new:get('description', 0) }}
- `add(a, b)` - {{ @doc.calculator_add:get('description', 0) }}
- `subtract(a, b)` - {{ @doc.calculator_subtract:get('description', 0) }}

---

## Classe MathUtils (Python)

{{ @doc.math_utils:meta('path') }} (ligne {{ @doc.math_utils:meta('line') }})

{{ @doc.math_utils:get('description', 0) }}

### Méthodes

#### factorial

{{ @doc.factorial:get('description', 0) }}

**Paramètres:**
{{ @doc.factorial:each('param', '- {1}: {0,1} - {0,0,1}') }}

#### gcd

{{ @doc.gcd:get('description', 0) }}

**Paramètres:**
{{ @doc.gcd:each('param', '- {1}: {0,1} - {0,0,1}') }}

---

## Classe User (TypeScript)

{{ @doc.user:meta('path') }} (ligne {{ @doc.user:meta('line') }})

{{ @doc.user:get('description', 0) }}

### Méthodes

{{ @if doc.user_getName:has('description') }}
- `getName()` - {{ @doc.user_getName:get('description', 0) }}
{{ @end }}
{{ @if doc.user_getEmail:has('description') }}
- `getEmail()` - {{ @doc.user_getEmail:get('description', 0) }}
{{ @end }}
{{ @if doc.user_setName:has('description') }}
- `setName(name)` - {{ @doc.user_setName:get('description', 0) }}
{{ @end }}


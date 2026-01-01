# Documentation Standardoc

Ce fichier utilise le DSL Standardoc pour générer la documentation.

## Fonction add (.lua)

test.lua (ligne 1)

Calculates the sum of two numbers

### Paramètres

- **a** (`number`): First number
- **b** (`number`): Second number

### Retour

- Type: `The sum` - 

### Exemple

```lua
local result = add(2, 3)
print(result)
```

---

## Fonction multiply (Lua)

test.lua (ligne 15)

Multiplies two numbers

### Paramètres

- **x** (`number`): First factor
- **y** (`number`): Second factor

---

## Classe Vector3 (C++)

test.cpp (ligne 1)

Classe représentant un vecteur 3D

### Méthode dot

Calcule le produit scalaire de deux vecteurs

**Exemple:**
```cpp
Vector3 v1(1, 2, 3);
Vector3 v2(4, 5, 6);
float result = Vector3::dot(v1, v2);
```

---

## Structure Calculator (Rust)

test.rs (ligne 1)

Structure to perform mathematical calculations

### Méthodes disponibles

- `new()` - Creates a new Calculator instance
- `add(a, b)` - Adds two integers
- `subtract(a, b)` - Subtracts two numbers

---

## Classe MathUtils (Python)

test.py (ligne 1)

Mathematical utilities

### Méthodes

#### factorial

Calculates the factorial of a number

**Paramètres:**
- n: int - Positive integer

#### gcd

Calculates the greatest common divisor

**Paramètres:**
- a: int - First number
- b: int - Second number

---

## Classe User (TypeScript)

test.ts (ligne 1)

A class representing a user

### Méthodes

- `getName()` - Gets the user's name
- `setName(name)` - Modifies the user's name


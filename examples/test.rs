/// @doc.init calculator Calculator
/// @description Structure pour effectuer des calculs mathématiques
/// @example
/// ```rust
/// let calc = Calculator::new();
/// let result = calc.add(5, 3);
/// ```
pub struct Calculator;

impl Calculator {
    /// @doc.init calculator_new new
    /// @description Crée une nouvelle instance de Calculator
    /// @returns Calculator Une nouvelle instance
    pub fn new() -> Self {
        Calculator
    }
    
    /// @doc.init calculator_add add
    /// @description Additionne deux nombres entiers
    /// @param a i32 Premier nombre
    /// @param b i32 Deuxième nombre
    /// @returns i32 La somme
    pub fn add(&self, a: i32, b: i32) -> i32 {
        a + b
    }
    
    /// @doc.init calculator_subtract subtract
    /// @description Soustrait deux nombres
    /// @param a i32 Nombre à soustraire
    /// @param b i32 Nombre à soustraire de a
    /// @returns i32 La différence
    pub fn subtract(&self, a: i32, b: i32) -> i32 {
        a - b
    }
}


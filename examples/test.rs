/// @doc calculator Calculator
/// @description Structure to perform mathematical calculations
/// @example
/// ```rust
/// let calc = Calculator::new();
/// let result = calc.add(5, 3);
/// ```
pub struct Calculator;

impl Calculator {
    /// @doc calculator_new new
    /// @description Creates a new Calculator instance
    /// @returns Calculator A new instance
    pub fn new() -> Self {
        Calculator
    }
    
    /// @doc calculator_add add
    /// @description Adds two integers
    /// @param a i32 First number
    /// @param b i32 Second number
    /// @returns i32 The sum
    pub fn add(&self, a: i32, b: i32) -> i32 {
        a + b
    }
    
    /// @doc calculator_subtract subtract
    /// @description Subtracts two numbers
    /// @param a i32 First number
    /// @param b i32 Second number
    /// @returns i32 The difference
    pub fn subtract(&self, a: i32, b: i32) -> i32 {
        a - b
    }
}


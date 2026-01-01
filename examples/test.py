# @doc.init math_utils MathUtils
# @description Mathematical utilities
# @example
# ```python
# from math_utils import MathUtils
# result = MathUtils.factorial(5)
# ```

class MathUtils:
    """Class for mathematical operations"""
    
    # @doc.init factorial factorial
    # @description Calculates the factorial of a number
    # @param n int Positive integer
    # @returns int The factorial of n
    # @example
    # ```python
    # result = MathUtils.factorial(5)  # 120
    # ```
    @staticmethod
    def factorial(n: int) -> int:
        if n <= 1:
            return 1
        return n * MathUtils.factorial(n - 1)
    
    # @doc.init gcd gcd
    # @description Calculates the greatest common divisor
    # @param a int First number
    # @param b int Second number
    # @returns int The greatest common divisor of a and b
    @staticmethod
    def gcd(a: int, b: int) -> int:
        while b != 0:
            a, b = b, a % b
        return a

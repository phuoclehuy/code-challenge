/**
 * Implementation A: Mathematical Formula (Gauss's Formula)
 *
 * Uses the mathematical formula: sum = n * (n + 1) / 2
 *
 * Time Complexity: O(1) - Constant time, single calculation
 * Space Complexity: O(1) - No additional space needed
 *
 * Efficiency: MOST EFFICIENT - Direct calculation without any iteration
 * This is the optimal solution as it computes the result in constant time
 * regardless of the input size.
 */
function sum_to_n_a(n: number): number {
  // Handle negative numbers by using absolute value and applying sign
  const absN = Math.abs(n);                                                  
  const sum = (absN * (absN + 1)) / 2;
  return n < 0 ? -sum : sum;
}

/**
 * Implementation B: Iterative Loop Approach
 *
 * Uses a simple for loop to accumulate the sum
 *
 * Time Complexity: O(n) - Linear time, iterates n times
 * Space Complexity: O(1) - Only uses a single variable for accumulation
 *
 * Efficiency: MODERATE - Straightforward and readable, but slower for large n
 * This is a traditional approach that's easy to understand and maintain.
 * Performance degrades linearly with input size.
 */
function sum_to_n_b(n: number): number {
  let sum = 0;
  // Handle negative numbers by using absolute value and applying sign
  const absN = Math.abs(n);

  for (let i = 1; i <= absN; i++) {
    sum += i;
  }

  return n < 0 ? -sum : sum;
}

/**
 * Implementation C: Recursive Approach
 *
 * Uses recursion to calculate the sum
 *
 * Time Complexity: O(n) - Linear time, makes n recursive calls
 * Space Complexity: O(n) - Call stack depth is proportional to n
 *
 * Efficiency: LEAST EFFICIENT - Has overhead of function calls and stack space
 * While elegant, this approach is the least efficient due to:
 * 1. Function call overhead for each recursion
 * 2. Risk of stack overflow for very large n
 * 3. Additional memory usage for call stack
 */
function sum_to_n_c(n: number): number {
  // Handle negative numbers by using absolute value and applying sign
  const absN = Math.abs(n);

  // Base case
  if (absN === 0) {
    return 0;
  }

  // Recursive case: n + sum(n-1)
  const sum = absN + sum_to_n_c(absN - 1);
  return n < 0 ? -sum : sum;
}

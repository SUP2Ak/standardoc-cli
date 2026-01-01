/**
 * @doc user User
 * @description A class representing a user
 * @example
 * ```typescript
 * const user = new User("John", "john@example.com");
 * console.log(user.getName());
 * ```
 */
export class User {
    private name: string;
    private email: string;
    
    /**
     * @doc user_constructor constructor
     * @description Creates a new user instance
     * @param name string The user's name
     * @param email string The user's email
     */
    constructor(name: string, email: string) {
        this.name = name;
        this.email = email;
    }
    
    /**
     * @doc user_getName getName
     * @description Gets the user's name
     * @returns string The user's name
     */
    getName(): string {
        return this.name;
    }
    
    /**
     * @doc user_getEmail getEmail
     * @returns string The user's email
     */
    getEmail(): string {
        return this.email;
    }
    
    /**
     * @doc user_setName setName
     * @description Modifies the user's name
     * @param name string The new name
     */
    setName(name: string): void {
        this.name = name;
    }
}


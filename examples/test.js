"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
/**
 * @doc user User
 * @description Classe représentant un utilisateur
 * @example
 * ```typescript
 * const user = new User("John", "john@example.com");
 * console.log(user.getName());
 * ```
 */
class User {
    name;
    email;
    /**
     * @doc user_constructor constructor
     * @description Crée une nouvelle instance d'utilisateur
     * @param name string Le nom de l'utilisateur
     * @param email string L'email de l'utilisateur
     */
    constructor(name, email) {
        this.name = name;
        this.email = email;
    }
    /**
     * @doc user_getName getName
     * @description Récupère le nom de l'utilisateur
     * @returns string Le nom de l'utilisateur
     */
    getName() {
        return this.name;
    }
    /**
     * @doc user_getEmail getEmail
     * @returns string L'email de l'utilisateur
     */
    getEmail() {
        return this.email;
    }
    /**
     * @doc user_setName setName
     * @description Modifie le nom de l'utilisateur
     * @param name string Le nouveau nom
     */
    setName(name) {
        this.name = name;
    }
}
exports.User = User;
//# sourceMappingURL=test.js.map
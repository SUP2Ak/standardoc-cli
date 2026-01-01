// @doc.init vector3 Vector3
// @description Classe représentant un vecteur 3D
// @param x float Composante X
// @param y float Composante Y
// @param z float Composante Z
class Vector3 {
public:
    float x, y, z;
    
    Vector3(float x, float y, float z) : x(x), y(y), z(z) {}
    
    // @doc.init vector3_dot dot
    // @description Calcule le produit scalaire de deux vecteurs
    // @param a Vector3 Premier vecteur
    // @param b Vector3 Deuxième vecteur
    // @returns float Le produit scalaire
    // @example
    // ```cpp
    // Vector3 v1(1, 2, 3);
    // Vector3 v2(4, 5, 6);
    // float result = Vector3::dot(v1, v2);
    // ```
    static float dot(const Vector3& a, const Vector3& b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }
};


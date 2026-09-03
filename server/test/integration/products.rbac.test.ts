/**
 * Prueba de integración real contra Postgres (usa el mismo DATABASE_URL de .env
 * apuntando a una base de pruebas). Requiere que el backend ya tenga migraciones
 * aplicadas y al menos un usuario "usuario" y un área sembrados.
 *
 * Ejecutar solo cuando hay una base de datos de pruebas disponible:
 *   DATABASE_URL=... npx vitest run test/integration
 *
 * Se documenta como parte de la verificación del plan (RBAC 403 para el rol
 * "usuario" al intentar crear un producto), no corre en un pipeline sin DB.
 */
import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/interfaces/http/app.js";
import { container } from "../../src/config/container.js";

const app = createApp();

describe("RBAC en /api/v1/products", () => {
  it("rechaza con 401 a un request sin token", async () => {
    const res = await request(app).post("/api/v1/products").send({});
    expect(res.status).toBe(401);
  });

  it("rechaza con 403 a un usuario con rol 'usuario' intentando crear un producto", async () => {
    const token = container.tokenService.signAccessToken({
      userId: "seed-usuario-id",
      username: "usuario_demo",
      role: "usuario",
    });

    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ codigo: "99", nombre: "Producto de prueba", areaId: "00000000-0000-0000-0000-000000000000" });

    expect(res.status).toBe(403);
  });
});

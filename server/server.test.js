// @vitest-environment node
import { describe, expect, it } from "vitest";
import { __test__ } from "./server.js";

describe("server helpers", () => {
  it("keeps health and config independent from MongoDB", () => {
    expect(__test__.routeUsesDatabase("GET", "/api/health")).toBe(false);
    expect(__test__.routeUsesDatabase("GET", "/api/config")).toBe(false);
    expect(__test__.routeUsesDatabase("GET", "/api/ready")).toBe(true);
    expect(__test__.routeUsesDatabase("GET", "/api/catalog")).toBe(true);
    expect(__test__.routeUsesDatabase("POST", "/api/monitoring/failures")).toBe(true);
  });

  it("validates product payloads", () => {
    expect(
      __test__.validateProductPayload({
        categoryId: "rm-luvas",
        model: " Luva 2 ",
        description: "Produto técnico",
      }),
    ).toMatchObject({ ok: true });

    expect(
      __test__.validateProductPayload({ categoryId: "invalida", model: "Teste" }),
    ).toMatchObject({ ok: false });
  });

  it("validates contact payloads", () => {
    expect(
      __test__.validateContactPayload({
        name: "Nicolas",
        phone: "(17) 99999-9999",
        email: "nicolas@example.com",
        message: "Preciso de orçamento",
        captchaToken: "token",
      }),
    ).toMatchObject({ ok: true });

    expect(
      __test__.validateContactPayload({
        name: "Nicolas",
        phone: "(17) 99999-9999",
        email: "email-invalido",
        message: "Preciso de orçamento",
        captchaToken: "token",
      }),
    ).toMatchObject({ ok: false });
  });

  it("detects supported image signatures and rejects invalid base64", () => {
    const png = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
    const jpg = Buffer.from("ffd8ffe000104a464946", "hex");
    const webp = Buffer.from("524946461a00000057454250", "hex");

    expect(__test__.detectImageType(png)).toMatchObject({ contentType: "image/png" });
    expect(__test__.detectImageType(jpg)).toMatchObject({ contentType: "image/jpeg" });
    expect(__test__.detectImageType(webp)).toMatchObject({ contentType: "image/webp" });
    expect(() => __test__.decodeBase64Image("not base64")).toThrow("Imagem inválida.");
  });

  it("validates frontend failure reports", () => {
    expect(
      __test__.validateFailurePayload({
        source: "frontend",
        message: "Erro no catálogo",
        route: "/catalogo",
        stack: "stack".repeat(800),
      }),
    ).toMatchObject({ ok: true });

    expect(__test__.validateFailurePayload({ message: "" })).toMatchObject({ ok: false });
  });
});

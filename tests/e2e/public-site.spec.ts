import { expect, test } from "@playwright/test";

test("public pages render and catalog search filters products", async ({ page }) => {
  await page.route("**/api/catalog", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        products: [
          {
            id: "rm-luvas-luva-2",
            categoryId: "rm-luvas",
            mainCategory: "Reservatórios Metálicos",
            subCategory: "Luvas",
            model: "Luva 2\"",
            importPath:
              "./src/assets/Products/Reservatórios Metálicos/Luvas/7. Luva 2_/20260203_145643(1).png",
            description: "",
          },
        ],
      }),
    });
  });
  await page.route("**/api/config", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ imageLimitMb: 3 }) });
  });
  await page.route("**/api/admin/session", async (route) => {
    await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Sessão inválida." }) });
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/Hidroconex/);
  await expect(page.getByRole("heading", { name: /conexões/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /catálogo/i }).first()).toBeVisible();

  await page.goto("/catalogo");
  await expect(page.getByRole("heading", { name: /peças industriais/i })).toBeVisible();

  const search = page.getByRole("searchbox", { name: /buscar produtos/i });
  await search.fill("reservatorio");
  await expect(page.getByText(/luva/i).first()).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /painel hidroconex/i })).toBeVisible();
});

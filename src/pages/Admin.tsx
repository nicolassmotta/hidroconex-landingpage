import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Edit3,
  ImagePlus,
  LogOut,
  PackagePlus,
  RefreshCcw,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { catalogCategories, getCategoryMeta } from "@/data/categories";
import {
  CatalogItem,
  fetchCatalog,
  productSearchText,
  resolveCatalogImage,
} from "@/lib/catalog";

const TOKEN_KEY = "hidroconex_admin_token";

interface UploadImage {
  data: string;
  contentType: string;
  filename: string;
}

interface FormState {
  id: string;
  categoryId: string;
  model: string;
  description: string;
  imageFile: File | null;
  imagePreview: string;
}

const emptyForm: FormState = {
  id: "",
  categoryId: "ts-luvas",
  model: "",
  description: "",
  imageFile: null,
  imagePreview: "",
};

async function fileToUpload(file: File): Promise<UploadImage> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const [, data = ""] = dataUrl.split(",");
  return {
    data,
    contentType: file.type,
    filename: file.name,
  };
}

async function requestJson(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Não foi possível concluir a operação.");
  }

  return data;
}

const AdminPage = () => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isEditing = Boolean(form.id);

  async function loadProducts(options: { clearMessage?: boolean } = {}) {
    setIsLoading(true);
    if (options.clearMessage !== false) {
      setMessage(null);
    }

    try {
      const items = await fetchCatalog();
      setProducts(items);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao carregar catálogo.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadProducts();
    }
  }, [token]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        categoryFilter === "todos" || product.categoryId === categoryFilter;
      const matchesSearch =
        !normalizedSearch || productSearchText(product).includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, products, searchTerm]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const data = await requestJson("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword("");
      setMessage({ type: "success", text: "Login realizado com sucesso." });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível acessar o painel.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setProducts([]);
    setForm(emptyForm);
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage(null);
  }

  function clearForm() {
    setForm(emptyForm);
  }

  function startEdit(product: CatalogItem) {
    setForm({
      id: product.id,
      categoryId: product.categoryId,
      model: product.model,
      description: product.description || "",
      imageFile: null,
      imagePreview: resolveCatalogImage(product),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const payload: Record<string, unknown> = {
        categoryId: form.categoryId,
        model: form.model,
        description: form.description,
      };

      if (form.imageFile) {
        payload.image = await fileToUpload(form.imageFile);
      }

      const path = isEditing
        ? `/api/admin/products/${encodeURIComponent(form.id)}`
        : "/api/admin/products";

      await requestJson(path, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setMessage({
        type: "success",
        text: isEditing ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.",
      });
      clearForm();
      await loadProducts({ clearMessage: false });
    } catch (error) {
      const isUnauthorized =
        error instanceof Error && /token|sessão|senha|inválido/i.test(error.message);

      if (isUnauthorized) {
        logout();
      }

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o produto.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(product: CatalogItem) {
    const confirmed = window.confirm(`Remover "${product.model}" do catálogo?`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage(null);

    try {
      await requestJson(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage({ type: "success", text: "Produto removido do catálogo." });
      await loadProducts({ clearMessage: false });
      if (form.id === product.id) {
        clearForm();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível remover o produto.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-gradient-navy flex items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-lg bg-card border border-border shadow-xl p-8">
          <a href="/" className="text-sm font-semibold text-primary hover:text-primary/80">
            Voltar ao site
          </a>
          <h1 className="text-3xl font-bold text-foreground mt-6 mb-2">
            Painel Hidroconex
          </h1>
          <p className="text-muted-foreground mb-8">
            Acesse para cadastrar fotos e manter o catálogo atualizado.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                Senha do administrador
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
                autoComplete="current-password"
                required
              />
            </div>

            {message && (
              <div
                className={`rounded-md px-4 py-3 text-sm font-medium ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full btn-hero flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSaving ? "Entrando..." : "Entrar no painel"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="bg-secondary text-secondary-foreground border-b border-white/10">
        <div className="section-container py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <a href="/" className="text-sm text-secondary-foreground/70 hover:text-primary">
              Voltar ao site
            </a>
            <h1 className="text-3xl font-bold mt-2">Admin do Catálogo</h1>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadProducts}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10 transition-colors disabled:opacity-70"
            >
              <RefreshCcw className="w-4 h-4" />
              Atualizar
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="section-container py-10 grid lg:grid-cols-[420px_1fr] gap-8 items-start">
        <section className="rounded-lg bg-card border border-border shadow-card p-6 lg:sticky lg:top-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {isEditing ? (
                <Edit3 className="w-5 h-5 text-primary" />
              ) : (
                <PackagePlus className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {isEditing ? "Editar produto" : "Novo produto"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isEditing ? "Atualize dados e imagem." : "Cadastre uma nova foto no catálogo."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label htmlFor="categoryId" className="block text-sm font-semibold text-foreground mb-2">
                Categoria
              </label>
              <select
                id="categoryId"
                value={form.categoryId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, categoryId: event.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
              >
                {catalogCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.mainCategory} - {category.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-semibold text-foreground mb-2">
                Modelo
              </label>
              <input
                id="model"
                value={form.model}
                onChange={(event) =>
                  setForm((current) => ({ ...current, model: event.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Ex.: Luva 2&quot; 300lbs"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-foreground mb-2">
                Descrição
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={4}
                className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                placeholder="Descrição curta do produto ou aplicação."
              />
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-semibold text-foreground mb-2">
                Foto do produto
              </label>
              <label className="min-h-48 rounded-lg border-2 border-dashed border-border bg-background flex flex-col items-center justify-center gap-3 p-5 cursor-pointer hover:border-primary/60 transition-colors">
                {form.imagePreview ? (
                  <img
                    src={form.imagePreview}
                    alt="Prévia do produto"
                    className="max-h-40 max-w-full object-contain"
                  />
                ) : (
                  <>
                    <ImagePlus className="w-8 h-8 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Selecionar PNG, JPG ou WebP
                    </span>
                  </>
                )}
                <input
                  id="image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setForm((current) => ({
                      ...current,
                      imageFile: file,
                      imagePreview: file ? URL.createObjectURL(file) : current.imagePreview,
                    }));
                  }}
                  required={!isEditing}
                />
              </label>
            </div>

            {message && (
              <div
                className={`rounded-md px-4 py-3 text-sm font-medium ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-hero flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar produto"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:border-primary/50 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="space-y-6">
          <div className="rounded-lg bg-card border border-border shadow-card p-6">
            <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Produtos cadastrados</h2>
                <p className="text-muted-foreground text-sm">
                  {products.length} itens no catálogo
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <div className="relative sm:min-w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    type="search"
                    placeholder="Buscar produto"
                    className="w-full rounded-md border border-border bg-background pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="todos">Todas as categorias</option>
                  {catalogCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-lg bg-card border border-border p-8 text-center text-muted-foreground">
              Carregando produtos...
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map((product) => {
                const category = getCategoryMeta(product.categoryId);

                return (
                  <article
                    key={product.id}
                    className="rounded-lg bg-card border border-border shadow-card overflow-hidden"
                  >
                    <div className="h-44 bg-white p-4 flex items-center justify-center border-b border-border">
                      <img
                        src={resolveCatalogImage(product)}
                        alt={product.model}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="p-5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {category?.title || product.subCategory}
                      </span>
                      <h3 className="text-lg font-bold text-foreground mt-2 mb-2">
                        {product.model}
                      </h3>
                      <p className="text-sm text-muted-foreground min-h-10">
                        {product.description || `${product.mainCategory} - ${product.subCategory}`}
                      </p>

                      <div className="flex gap-2 mt-5">
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-secondary px-3 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          className="inline-flex items-center justify-center rounded-md border border-destructive/30 px-3 py-2.5 text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label={`Remover ${product.model}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg bg-card border border-dashed border-border p-8 text-center">
              <h3 className="text-lg font-bold text-foreground mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-muted-foreground">
                Cadastre um novo item ou ajuste os filtros.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminPage;

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Edit3,
  Eye,
  EyeOff,
  LogOut,
  PackagePlus,
  Plus,
  RefreshCcw,
  Save,
} from "lucide-react";
import { catalogCategories } from "@/data/categories";
import {
  ADMIN_IMAGE_LIMIT_MB,
  CatalogItem,
  fetchAppConfig,
  fetchCatalog,
  resolveCatalogImage,
} from "@/lib/catalog";
import { useAdminCatalogFilters } from "@/hooks/useAdminCatalogFilters";
import { toast } from "@/components/ui/sonner";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminProductCard } from "@/components/admin/AdminProductCard";
import { AdminProductRow } from "@/components/admin/AdminProductRow";
import { ImageDropzone } from "@/components/admin/ImageDropzone";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";

const VIEW_KEY = "hidroconex_admin_view";
const ADMIN_PRODUCTS_ID = "admin-products";

type ViewMode = "grid" | "list";

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

function normalizeMessage(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isAuthError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const message = normalizeMessage(error.message);
  return /token|sessao|senha|credencial|nao autorizado|unauthorized|forbidden/.test(message);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function isBlobPreview(url: string) {
  return url.startsWith("blob:");
}

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
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (typeof data?.error === "string" && data.error) ||
      (typeof data?.error?.message === "string" && data.error.message) ||
      (typeof data?.message === "string" && data.message) ||
      `Não foi possível concluir a operação (HTTP ${response.status}).`;
    throw new Error(message);
  }

  return data;
}

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [imageLimitMb, setImageLimitMb] = useState(ADMIN_IMAGE_LIMIT_MB);
  const [view, setView] = useState<ViewMode>(
    () => (localStorage.getItem(VIEW_KEY) as ViewMode) || "grid",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const modelInputRef = useRef<HTMLInputElement>(null);
  const filters = useAdminCatalogFilters(products);
  const isEditing = Boolean(form.id);

  useEffect(() => {
    if (!isBlobPreview(form.imagePreview)) return;

    const previewUrl = form.imagePreview;
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.imagePreview]);

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  useEffect(() => {
    let isMounted = true;

    fetchAppConfig().then((config) => {
      if (isMounted) {
        setImageLimitMb(config.imageLimitMb);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function loadProducts() {
    setIsLoading(true);
    setLoadError(null);
    try {
      setProducts(await fetchCatalog({ fallbackToStatic: false }));
    } catch (error) {
      const message = getErrorMessage(error, "Erro ao carregar catálogo.");
      setProducts([]);
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      try {
        await requestJson("/api/admin/session");
        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
    }
  }, [isAuthenticated]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setLoginError(null);

    try {
      await requestJson("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      setIsAuthenticated(true);
      setPassword("");
    } catch (error) {
      setLoginError(
        getErrorMessage(error, "Não foi possível acessar o painel."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function logout(nextLoginError: string | null = null) {
    await requestJson("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    setIsAuthenticated(false);
    setProducts([]);
    setForm(emptyForm);
    setSelectedIds(new Set());
    setLoadError(null);
    setLoginError(nextLoginError);
  }

  function resetForm() {
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

  function handleImageFile(file: File) {
    setForm((current) => ({
      ...current,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));
  }

  async function handleSave(
    event: FormEvent,
    options: { addAnother?: boolean } = {},
  ) {
    event.preventDefault();

    if (!isEditing && !form.imageFile) {
      toast.error("Adicione uma imagem", {
        description: "Todo produto novo precisa de uma foto.",
      });
      return;
    }

    setIsSaving(true);

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
        body: JSON.stringify(payload),
      });

      toast.success(
        isEditing ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.",
      );

      if (options.addAnother) {
        setForm((current) => ({ ...emptyForm, categoryId: current.categoryId }));
        requestAnimationFrame(() => modelInputRef.current?.focus());
      } else {
        resetForm();
      }

      await loadProducts();
    } catch (error) {
      if (isAuthError(error)) {
        await logout("Sessão expirada. Faça login novamente.");
      }

      toast.error(getErrorMessage(error, "Não foi possível salvar o produto."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(product: CatalogItem) {
    setIsSaving(true);

    try {
      await requestJson(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: "DELETE",
      });

      toast.success("Produto removido do catálogo.");
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(product.id);
        return next;
      });
      if (form.id === product.id) {
        resetForm();
      }
      await loadProducts();
    } catch (error) {
      if (isAuthError(error)) {
        await logout("Sessão expirada. Faça login novamente.");
      }

      toast.error(getErrorMessage(error, "Não foi possível remover o produto."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    if (!ids.length) return;

    setIsSaving(true);
    let removed = 0;
    let failed = 0;
    let authFailed = false;

    for (const id of ids) {
      try {
        await requestJson(`/api/admin/products/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        removed += 1;
      } catch (error) {
        if (isAuthError(error)) {
          authFailed = true;
        }
        failed += 1;
      }
    }

    setSelectedIds(new Set());
    setIsSaving(false);

    if (authFailed) {
      await logout("Sessão expirada. Faça login novamente.");
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    await loadProducts();

    if (failed === 0) {
      toast.success(`${removed} produto(s) removido(s).`);
    } else {
      toast.error(`${removed} removido(s), ${failed} não puderam ser removidos.`);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const allVisibleSelected =
    filters.filtered.length > 0 && filters.filtered.every((p) => selectedIds.has(p.id));

  function toggleSelectAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        filters.filtered.forEach((p) => next.delete(p.id));
      } else {
        filters.filtered.forEach((p) => next.add(p.id));
      }
      return next;
    });
  }

  if (isCheckingSession) {
    return (
      <main className="min-h-screen bg-gradient-navy flex items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-lg bg-card border border-border shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-3">Painel Hidroconex</h1>
          <p className="text-muted-foreground" role="status">
            Verificando sessão...
          </p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-navy flex items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-lg bg-card border border-border shadow-xl p-8">
          <a href="/" className="text-sm font-semibold text-lime-dark hover:text-primary">
            Voltar ao site
          </a>
          <h1 className="text-3xl font-bold text-foreground mt-6 mb-2">Painel Hidroconex</h1>
          <p className="text-muted-foreground mb-8">
            Acesse para cadastrar fotos e manter o catálogo atualizado.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                Senha do administrador
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-primary/40"
                  autoComplete="current-password"
                  aria-invalid={Boolean(loginError)}
                  aria-describedby={loginError ? "admin-login-error" : undefined}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div
                id="admin-login-error"
                role="alert"
                aria-live="assertive"
                className="rounded-md px-4 py-3 text-sm font-medium bg-red-100 text-red-800"
              >
                {loginError}
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
    <main className="min-h-screen bg-muted/30 pb-24">
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
              onClick={() => loadProducts()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10 transition-colors disabled:opacity-70"
            >
              <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => void logout()}
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

          {isEditing && (
            <div className="flex items-center justify-between gap-3 rounded-md bg-primary/10 border border-primary/30 px-4 py-3 mb-5">
              <span className="text-sm text-foreground truncate">
                Editando: <strong>{form.model || "produto"}</strong>
              </span>
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-semibold text-lime-dark hover:text-primary shrink-0"
              >
                Cancelar
              </button>
            </div>
          )}

          <form onSubmit={(event) => handleSave(event)} className="space-y-5">
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
                ref={modelInputRef}
                value={form.model}
                onChange={(event) =>
                  setForm((current) => ({ ...current, model: event.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
                placeholder={'Ex.: Luva 2" 300lbs'}
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
              <span className="block text-sm font-semibold text-foreground mb-2">Foto do produto</span>
              <ImageDropzone
                preview={form.imagePreview}
                maxSizeMb={imageLimitMb}
                onFile={handleImageFile}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-hero inline-flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar produto"}
              </button>

              {isEditing ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:border-primary/50 transition-colors"
                >
                  Cancelar edição
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={(event) => handleSave(event, { addAnother: true })}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:border-primary/50 transition-colors disabled:opacity-70"
                >
                  <Plus className="w-4 h-4" />
                  Salvar e adicionar outro
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Produtos cadastrados</h2>
              <p className="text-muted-foreground text-sm">{products.length} itens no catálogo</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                className="w-4 h-4 accent-primary"
                aria-controls={ADMIN_PRODUCTS_ID}
              />
              Selecionar todos os filtrados
            </label>
          </div>

          <AdminToolbar
            filters={filters}
            view={view}
            onViewChange={setView}
            resultCount={filters.filtered.length}
            totalCount={products.length}
            resultsId={ADMIN_PRODUCTS_ID}
          />

          <div id={ADMIN_PRODUCTS_ID} aria-live="polite">
            {isLoading ? (
              <div
                role="status"
                className="rounded-lg bg-card border border-border p-8 text-center text-muted-foreground"
              >
                Carregando produtos...
              </div>
            ) : loadError ? (
              <div
                role="alert"
                className="rounded-lg bg-red-50 border border-red-200 p-6 text-red-900"
              >
                <h3 className="text-lg font-bold mb-2">Não foi possível carregar o catálogo</h3>
                <p className="text-sm">{loadError}</p>
                <button
                  type="button"
                  onClick={() => loadProducts()}
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Tentar novamente
                </button>
              </div>
            ) : filters.filtered.length === 0 ? (
              <div
                role="status"
                className="rounded-lg bg-card border border-dashed border-border p-8 text-center"
              >
                <h3 className="text-lg font-bold text-foreground mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground">
                  {filters.hasActiveFilters
                    ? "Ajuste a busca ou os filtros para ver outros itens."
                    : "Cadastre um novo item para começar o catálogo."}
                </p>
              </div>
            ) : view === "grid" ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filters.filtered.map((product) => (
                  <AdminProductCard
                    key={product.id}
                    product={product}
                    isEditing={form.id === product.id}
                    isSelected={selectedIds.has(product.id)}
                    busy={isSaving}
                    onToggleSelect={() => toggleSelect(product.id)}
                    onEdit={() => startEdit(product)}
                    onDelete={() => handleDelete(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filters.filtered.map((product) => (
                  <AdminProductRow
                    key={product.id}
                    product={product}
                    isEditing={form.id === product.id}
                    isSelected={selectedIds.has(product.id)}
                    busy={isSaving}
                    onToggleSelect={() => toggleSelect(product.id)}
                    onEdit={() => startEdit(product)}
                    onDelete={() => handleDelete(product)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-5 left-3 right-3 z-40 flex flex-wrap items-center justify-center gap-3 rounded-lg bg-secondary text-secondary-foreground shadow-xl px-4 py-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:flex-nowrap sm:gap-4 sm:px-5">
          <span className="text-sm font-medium">{selectedIds.size} selecionado(s)</span>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
          >
            Limpar
          </button>
          <ConfirmDeleteButton
            variant="full"
            onConfirm={handleBulkDelete}
            ariaLabel="Excluir selecionados"
            disabled={isSaving}
          />
        </div>
      )}
    </main>
  );
};

export default AdminPage;

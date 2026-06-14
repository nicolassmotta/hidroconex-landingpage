import { FormEvent, useMemo, useState } from "react";
import {
  ClipboardList,
  Database,
  Edit3,
  Inbox,
  Lock,
  LogOut,
  PackageCheck,
  PackagePlus,
  RefreshCcw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { catalogCategories, getCategoryById } from "@/data/catalogCategories";
import { useQuoteRequests } from "@/hooks/useQuoteRequests";
import { useStoredProducts } from "@/hooks/useStoredProducts";
import { resolveProductImage } from "@/lib/catalogImages";
import {
  createEntityId,
  deleteQuoteRequest,
  resetStoredProducts,
  saveStoredProducts,
  updateQuoteRequestStatus,
  type ProductStatus,
  type QuoteStatus,
  type StoredProduct,
} from "@/lib/localData";
import {
  clearDemoAdminSession,
  createDemoAdminSession,
  hasConfiguredDemoAdminPassword,
  isDemoAdminAuthenticated,
  isDemoAdminAvailable,
  isSafeHttpsUrl,
  sanitizeHttpsUrl,
  sanitizeMultilineText,
  sanitizePlainText,
  validateDemoAdminPassword,
} from "@/lib/security";

interface ProductFormState {
  model: string;
  categoryId: string;
  description: string;
  material: string;
  imageUrl: string;
  status: ProductStatus;
}

const defaultCategory = catalogCategories[0];

const requestStatusOptions: { value: QuoteStatus; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "enviado", label: "Enviado" },
  { value: "erro", label: "Erro" },
  { value: "respondido", label: "Respondido" },
];

function createEmptyForm(): ProductFormState {
  return {
    model: "",
    categoryId: defaultCategory.id,
    description: "",
    material: "Aço carbono",
    imageUrl: "",
    status: "ativo",
  };
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Data não disponível";
  }
}

const AdminPage = () => {
  const products = useStoredProducts();
  const quoteRequests = useQuoteRequests();
  const [isAuthenticated, setIsAuthenticated] = useState(() => isDemoAdminAuthenticated());
  const [adminPassword, setAdminPassword] = useState("");
  const [authFeedback, setAuthFeedback] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(() => createEmptyForm());
  const [productSearch, setProductSearch] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const editingProduct = useMemo(
    () => products.find((product) => product.id === editingId),
    [editingId, products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = productSearch.trim().toLowerCase();
    if (!normalizedSearch) return products;

    return products.filter((product) =>
      [product.model, product.mainCategory, product.subCategory, product.material, product.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [productSearch, products]);

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const activeProductsCount = products.filter((product) => product.status === "ativo").length;
  const pendingRequestsCount = quoteRequests.filter((request) => request.status === "novo").length;

  const handleAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthFeedback("");

    if (!(await validateDemoAdminPassword(adminPassword))) {
      setAuthFeedback("Senha inválida ou não configurada.");
      setAdminPassword("");
      return;
    }

    createDemoAdminSession();
    setIsAuthenticated(true);
    setAdminPassword("");
  };

  const handleAdminLogout = () => {
    clearDemoAdminSession();
    setIsAuthenticated(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const selectedCategory = getCategoryById(form.categoryId) || defaultCategory;
    const model = sanitizePlainText(form.model, 120);
    const imageUrl = sanitizeHttpsUrl(form.imageUrl);

    if (!model) {
      setFeedback({ type: "error", message: "Informe o modelo do produto antes de salvar." });
      return;
    }

    if (form.imageUrl.trim() && !isSafeHttpsUrl(form.imageUrl)) {
      setFeedback({ type: "error", message: "Use apenas URLs de imagem HTTPS válidas." });
      return;
    }

    const productToSave: StoredProduct = {
      id: editingProduct?.id || createEntityId("produto"),
      categoryId: selectedCategory.id,
      mainCategory: selectedCategory.mainCategory,
      subCategory: selectedCategory.subCategory,
      model,
      importPath: editingProduct?.importPath,
      imageUrl: imageUrl || undefined,
      description:
        sanitizeMultilineText(form.description, 500) ||
        `${model} para ${selectedCategory.mainCategory.toLowerCase()}, linha de ${selectedCategory.subCategory.toLowerCase()}.`,
      material: sanitizePlainText(form.material, 80) || "Aço carbono",
      status: form.status,
      source: editingProduct?.source || "admin",
      updatedAt: new Date().toISOString(),
    };

    const nextProducts = editingProduct
      ? products.map((product) => (product.id === editingProduct.id ? productToSave : product))
      : [productToSave, ...products];

    saveStoredProducts(nextProducts);
    setForm(createEmptyForm());
    setEditingId(null);
    setFeedback({ type: "success", message: editingProduct ? "Produto atualizado." : "Produto cadastrado." });
  };

  const handleEdit = (product: StoredProduct) => {
    setEditingId(product.id);
    setForm({
      model: product.model,
      categoryId: product.categoryId,
      description: product.description,
      material: product.material,
      imageUrl: product.imageUrl || "",
      status: product.status,
    });
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setFeedback(null);
  };

  const handleDeleteProduct = (product: StoredProduct) => {
    const confirmed = window.confirm(`Excluir "${product.model}" do catálogo local?`);
    if (!confirmed) return;

    saveStoredProducts(products.filter((item) => item.id !== product.id));
    if (editingId === product.id) handleCancelEdit();
    setFeedback({ type: "success", message: "Produto excluído do catálogo local." });
  };

  const handleResetProducts = () => {
    const confirmed = window.confirm("Restaurar o catálogo base? Produtos criados no admin serão removidos.");
    if (!confirmed) return;

    resetStoredProducts();
    handleCancelEdit();
    setFeedback({ type: "success", message: "Catálogo base restaurado." });
  };

  const handleDeleteRequest = (requestId: string) => {
    const confirmed = window.confirm("Excluir esta solicitação do armazenamento local?");
    if (!confirmed) return;

    deleteQuoteRequest(requestId);
  };

  if (!isDemoAdminAvailable()) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="internal" />
        <main className="pt-20">
          <section className="section-padding">
            <div className="section-container max-w-3xl text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">Admin desativado em produção</h1>
              <p className="mt-4 text-muted-foreground">
                Este projeto não possui backend com autenticação real. Por segurança, o painel local fica indisponível
                fora do modo de desenvolvimento ou demonstração explicitamente habilitado.
              </p>
              <a
                href="/"
                className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-lime-dark"
              >
                Voltar ao site
              </a>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (!hasConfiguredDemoAdminPassword()) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="internal" />
        <main className="pt-20">
          <section className="section-padding">
            <div className="section-container max-w-3xl text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-red-50">
                <ShieldAlert className="h-7 w-7 text-red-700" />
              </div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">Senha de demonstração não configurada</h1>
              <p className="mt-4 text-muted-foreground">
                Defina <code className="rounded bg-muted px-1.5 py-0.5">VITE_DEMO_ADMIN_PASSWORD_SHA256</code> no ambiente local
                para habilitar o admin didático. A senha não deve ser gravada em <code className="rounded bg-muted px-1.5 py-0.5">localStorage</code>.
              </p>
              <a
                href="/"
                className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-lime-dark"
              >
                Voltar ao site
              </a>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="internal" />
        <main className="pt-20">
          <section className="section-padding">
            <div className="section-container max-w-md">
              <form className="rounded-lg border border-border bg-card p-6 shadow-card" onSubmit={handleAdminLogin}>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Acesso administrativo</h1>
                    <p className="text-sm text-muted-foreground">Sessão local expira em 1 hora.</p>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Senha de demonstração</span>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    maxLength={120}
                    autoComplete="current-password"
                    className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                  />
                </label>

                {authFeedback && (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
                    {authFeedback}
                  </div>
                )}

                <button
                  type="submit"
                  className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-lime-dark"
                >
                  Entrar
                </button>

                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Este bloqueio é apenas para demonstração acadêmica. Segurança real de admin exige backend.
                </p>
              </form>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header variant="internal" />
      <main className="pt-20">
        <section className="bg-secondary py-12 text-secondary-foreground md:py-16">
          <div className="section-container">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">
              <Database className="h-4 w-4" />
              Administração local
            </span>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr_auto] lg:items-end">
              <div>
                <h1 className="text-4xl font-bold md:text-5xl">Gestão do catálogo</h1>
                <p className="mt-4 max-w-2xl text-secondary-foreground/75">
                  Cadastre, edite, consulte e remova produtos usando armazenamento no navegador.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-xs text-secondary-foreground/65">Produtos</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-bold">{activeProductsCount}</p>
                  <p className="text-xs text-secondary-foreground/65">Ativos</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-bold">{pendingRequestsCount}</p>
                  <p className="text-xs text-secondary-foreground/65">Novos leads</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAdminLogout}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/20 px-4 text-sm font-semibold text-secondary-foreground transition hover:border-primary hover:text-primary lg:justify-self-end"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </section>

        <section className="section-padding" aria-labelledby="admin-produtos">
          <div className="section-container">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <section className="rounded-lg border border-border bg-card p-5 shadow-card" aria-labelledby="produto-form">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-primary">
                      <PackagePlus className="h-4 w-4" />
                      Produto
                    </span>
                    <h2 id="produto-form" className="mt-2 text-2xl font-bold text-foreground">
                      {editingProduct ? "Editar produto" : "Novo produto"}
                    </h2>
                  </div>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                  )}
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-foreground">Modelo</span>
                    <input
                      type="text"
                      value={form.model}
                      onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
                      maxLength={120}
                      autoComplete="off"
                      className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                      placeholder="Ex: Luva 2&quot; 300lbs"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-foreground">Categoria</span>
                      <select
                        value={form.categoryId}
                        onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                        className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                      >
                        {catalogCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.mainCategory} | {category.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-foreground">Status</span>
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, status: event.target.value as ProductStatus }))
                        }
                        className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-foreground">Material</span>
                    <input
                      type="text"
                      value={form.material}
                      onChange={(event) => setForm((current) => ({ ...current, material: event.target.value }))}
                      maxLength={80}
                      autoComplete="off"
                      className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                      placeholder="Ex: Aço carbono"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-foreground">URL da imagem</span>
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                      maxLength={500}
                      autoComplete="off"
                      className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                      placeholder="https://..."
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-foreground">Descrição</span>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      maxLength={500}
                      rows={4}
                      className="w-full resize-none rounded-md border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                      placeholder="Aplicação, medidas ou observações técnicas"
                    />
                  </label>

                  {feedback && (
                    <div
                      className={`rounded-md border p-3 text-sm font-medium ${
                        feedback.type === "success"
                          ? "border-green-200 bg-green-50 text-green-800"
                          : "border-red-200 bg-red-50 text-red-800"
                      }`}
                    >
                      {feedback.message}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-lime-dark"
                    >
                      <Save className="h-4 w-4" />
                      {editingProduct ? "Salvar alterações" : "Cadastrar produto"}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetProducts}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Restaurar base
                    </button>
                  </div>
                </form>
              </section>

              <section aria-labelledby="admin-produtos" className="min-w-0">
                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-primary">
                      <PackageCheck className="h-4 w-4" />
                      Catálogo
                    </span>
                    <h2 id="admin-produtos" className="mt-2 text-2xl font-bold text-foreground">
                      Produtos cadastrados
                    </h2>
                  </div>
                  <label className="block md:w-72">
                    <span className="sr-only">Buscar produto</span>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="search"
                        value={productSearch}
                        onChange={(event) => setProductSearch(event.target.value)}
                        className="h-11 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                        placeholder="Buscar no catálogo"
                      />
                    </div>
                  </label>
                </div>

                <div className="grid gap-4">
                  {filteredProducts.map((product) => (
                    <article key={product.id} className="rounded-lg border border-border bg-card p-4 shadow-card">
                      <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
                        <div className="flex h-28 items-center justify-center rounded-md border border-border bg-white p-3">
                          <img
                            src={resolveProductImage(product)}
                            alt={product.model}
                            loading="lazy"
                            decoding="async"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="mb-2 flex flex-wrap gap-2">
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                  {product.mainCategory}
                                </span>
                                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                  {product.status}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-foreground">{product.model}</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {product.subCategory} | {product.material}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(product)}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                              >
                                <Edit3 className="h-4 w-4" />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product)}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </button>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
                          <p className="mt-3 text-xs text-muted-foreground/70">
                            Atualizado em {formatDate(product.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="section-padding bg-muted/30" aria-labelledby="admin-solicitacoes">
          <div className="section-container">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-primary">
                  <ClipboardList className="h-4 w-4" />
                  Orçamentos
                </span>
                <h2 id="admin-solicitacoes" className="mt-2 text-2xl font-bold text-foreground">
                  Solicitações recebidas
                </h2>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {quoteRequests.length} registros no localStorage
              </p>
            </div>

            {quoteRequests.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {quoteRequests.map((request) => {
                  const relatedProduct = productById.get(request.productId);

                  return (
                    <article key={request.id} className="rounded-lg border border-border bg-card p-5 shadow-card">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {relatedProduct?.model || request.productModel || "Produto não informado"}
                          </span>
                          <h3 className="mt-3 text-lg font-bold text-foreground">{request.name}</h3>
                          <p className="text-sm text-muted-foreground">{request.phone}</p>
                          {request.email && (
                            <a
                              href={`mailto:${request.email}`}
                              className="text-sm font-medium text-primary transition hover:text-lime-dark"
                            >
                              {request.email}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={request.status}
                            onChange={(event) =>
                              updateQuoteRequestStatus(request.id, event.target.value as QuoteStatus)
                            }
                            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                          >
                            {requestStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeleteRequest(request.id)}
                            className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 px-3 text-red-700 transition hover:bg-red-50"
                            aria-label="Excluir solicitação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{request.message}</p>
                      <p className="mt-4 text-xs text-muted-foreground/70">Recebido em {formatDate(request.createdAt)}</p>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-background p-10 text-center">
                <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-bold text-foreground">Nenhuma solicitação registrada</h3>
                <p className="mt-2 text-muted-foreground">
                  As mensagens enviadas pelo formulário aparecem aqui para consulta administrativa.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;

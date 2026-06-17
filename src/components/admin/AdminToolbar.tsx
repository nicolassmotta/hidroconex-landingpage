import { AlignLeft, ImageOff, LayoutGrid, List, Search, X } from "lucide-react";
import {
  MainGroup,
  SortKey,
  useAdminCatalogFilters,
} from "@/hooks/useAdminCatalogFilters";
import { cn } from "@/lib/utils";

type Filters = ReturnType<typeof useAdminCatalogFilters>;

interface AdminToolbarProps {
  filters: Filters;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  resultCount: number;
  totalCount: number;
}

const GROUPS: { id: MainGroup; label: string }[] = [
  { id: "todos", label: "Todas as linhas" },
  { id: "tanques", label: "Tanques Subterrâneos" },
  { id: "reservatorios", label: "Reservatórios Metálicos" },
];

const SORTS: { id: SortKey; label: string }[] = [
  { id: "recentes", label: "Mais recentes" },
  { id: "az", label: "Modelo (A–Z)" },
  { id: "categoria", label: "Categoria" },
];

export function AdminToolbar({
  filters,
  view,
  onViewChange,
  resultCount,
  totalCount,
}: AdminToolbarProps) {
  const { state, visibleCategories, categoryCounts } = filters;

  return (
    <div className="rounded-lg bg-card border border-border shadow-card p-5 space-y-5">
      {/* Search + sort + view toggle */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={state.search}
            onChange={(event) => filters.setSearch(event.target.value)}
            type="search"
            placeholder="Buscar por modelo, descrição ou categoria"
            className="w-full rounded-md border border-border bg-background pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={state.sort}
            onChange={(event) => filters.setSort(event.target.value as SortKey)}
            className="rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Ordenar produtos"
          >
            {SORTS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex rounded-md border border-border overflow-hidden">
            <ViewButton
              active={view === "grid"}
              onClick={() => onViewChange("grid")}
              label="Visualização em grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </ViewButton>
            <ViewButton
              active={view === "list"}
              onClick={() => onViewChange("list")}
              label="Visualização em lista"
            >
              <List className="w-4 h-4" />
            </ViewButton>
          </div>
        </div>
      </div>

      {/* Main category segmented control */}
      <div className="flex flex-wrap gap-2">
        {GROUPS.map((groupOption) => (
          <button
            key={groupOption.id}
            type="button"
            onClick={() => filters.setGroup(groupOption.id)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold border transition-colors",
              state.group === groupOption.id
                ? "bg-secondary text-secondary-foreground border-secondary"
                : "bg-background text-foreground border-border hover:border-primary/50",
            )}
          >
            {groupOption.label}
          </button>
        ))}
      </div>

      {/* Sub-category chips */}
      <div className="flex flex-wrap gap-2">
        <Chip
          active={state.categoryId === "todas"}
          onClick={() => filters.setCategoryId("todas")}
        >
          Todas
        </Chip>
        {visibleCategories.map((category) => (
          <Chip
            key={category.id}
            active={state.categoryId === category.id}
            onClick={() => filters.setCategoryId(category.id)}
          >
            {category.title}
            <span className="ml-1.5 text-xs opacity-70">{categoryCounts[category.id] || 0}</span>
          </Chip>
        ))}
      </div>

      {/* Quick filters + result count */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
        <span className="text-sm text-muted-foreground mr-1 pt-3">Filtros rápidos:</span>
        <QuickToggle
          active={state.onlyNoImage}
          onClick={() => filters.setOnlyNoImage(!state.onlyNoImage)}
          icon={<ImageOff className="w-3.5 h-3.5" />}
          label="Sem foto"
        />
        <QuickToggle
          active={state.onlyNoDescription}
          onClick={() => filters.setOnlyNoDescription(!state.onlyNoDescription)}
          icon={<AlignLeft className="w-3.5 h-3.5" />}
          label="Sem descrição"
        />

        <div className="flex items-center gap-3 ml-auto pt-3">
          {filters.hasActiveFilters && (
            <button
              type="button"
              onClick={filters.resetFilters}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          )}
          <span className="text-sm font-medium text-foreground">
            {resultCount} de {totalCount} produtos
          </span>
        </div>
      </div>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "px-3 py-2.5 transition-colors",
        active ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-border hover:border-primary/50",
      )}
    >
      {children}
    </button>
  );
}

function QuickToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium border transition-colors mt-3",
        active
          ? "bg-amber-100 text-amber-800 border-amber-300"
          : "bg-background text-muted-foreground border-border hover:border-primary/50",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'src/assets/Products');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src/data/catalog.ts');

// Mapeia os nomes reais das pastas principais (ex: 'Reservatórios Metálicos') para os prefixos curtos (ex: 'rm')
const CATEGORY_PREFIX_MAP = {
  'Reservatórios Metálicos': 'rm',
  'Tanques Subterrâneos': 'ts',
};

// Mapeia os nomes das subpastas (ex: 'Luvas') para os identificadores finais das URLs
const SUBCATEGORY_SLUG_MAP = {
  'Luvas': 'luvas',
  'Niples': 'niples',
  'Juntas': 'juntas',
  'Plugs': 'plugs',
  'Filtros': 'filtros',
};

function formatModelName(folderName) {
  let name = folderName;

  // Regra 1: Remove numerações iniciais em arquivos ou pastas (ex: "1. Luva", "7.1 Niple")
  name = name.replace(/^\d+\.?\d*\s*/, '');

  // Regra 2: Converte traços solitários finais em aspas de polegada (ex: "Luva 3-8_" → "Luva 3-8\"")
  name = name.replace(/_\s*$/, '"');

  // Regra 3: Converte traços separando números por barras fracionárias (ex: "3-8" → "3/8")
  name = name.replace(/(\d)-(\d)/g, '$1/$2');

  // Regra 4: Troca underscores restantes soltos por aspas de polegada para finalizar o formato
  name = name.replace(/_/g, '"');

  return name.trim();
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateCatalog() {
  console.log('Scanning directories in: ' + ASSETS_DIR);

  // Varre a pasta de Assets do projeto atrás de todo e qualquer arquivo PNG
  const files = globSync(`${toPosixPath(ASSETS_DIR)}/**/*.png`, {
    nodir: true,
    windowsPathsNoEscape: true,
  });

  // Filtro de repetição: Mantém apenas 1 imagem representativa por pasta de modelo
  const processedModels = new Set();
  const catalogItems = [];

  files.forEach((file) => {
    const absoluteFile = path.resolve(file);
    const pathParts = path.relative(ASSETS_DIR, absoluteFile).split(path.sep);

    // A estrutura deve ser rigorosamente: Products / [Categoria] / [Subcategoria] / [Pasta Modelo] / [imagem.png]
    if (pathParts.length >= 4) {
      const mainCategory = pathParts[0];
      const subCategory = pathParts[1];
      const modelFolder = pathParts[2];

      const prefix = CATEGORY_PREFIX_MAP[mainCategory];
      const subSlug = SUBCATEGORY_SLUG_MAP[subCategory];

      if (!prefix || !subSlug) {
        console.warn(`Skipping unknown category/subcategory: ${mainCategory} / ${subCategory}`);
        return;
      }

      const categoryId = `${prefix}-${subSlug}`;
      const modelName = formatModelName(modelFolder);
      const uniqueKey = `${categoryId}-${modelName}`;

      if (!processedModels.has(uniqueKey)) {
        processedModels.add(uniqueKey);

        const importPath = `./${toPosixPath(path.relative(ROOT_DIR, absoluteFile))}`;

        catalogItems.push({
          id: slugify(uniqueKey),
          categoryId,
          mainCategory,
          subCategory,
          model: modelName,
          // IMPORTANTE: Esse relative path será lido e empacotado pelo react/vite durante a renderização estática
          importPath,
          description: '',
        });
      }
    }
  });

  // Ordena os itens alfabeticamente visando manter o Array do Catálogo perfeitamente alinhado por Categoria -> Modelo
  catalogItems.sort((a, b) => {
    if (a.mainCategory !== b.mainCategory) return a.mainCategory.localeCompare(b.mainCategory);
    if (a.subCategory !== b.subCategory) return a.subCategory.localeCompare(b.subCategory);
    return a.model.localeCompare(b.model);
  });

  console.log(`Category IDs created: ${[...new Set(catalogItems.map(i => i.categoryId))].join(', ')}`);

  const tsContent = `// Automatically generated from src/assets/Products directory structure.
// To regenerate, run: node scripts/generateCatalog.js

export interface CatalogItem {
  id: string;
  categoryId: string;
  mainCategory: string;
  subCategory: string;
  model: string;
  importPath: string;
  description: string;
}

export const catalogData: CatalogItem[] = ${JSON.stringify(catalogItems, null, 2)};
`;

  fs.outputFileSync(OUTPUT_FILE, tsContent);
  console.log(`✓ Generated catalog with ${catalogItems.length} unique products.`);
}

generateCatalog();

# Hidroconex - Site Oficial

Site oficial da Hidroconex com landing page, catálogo público separado e painel administrativo para cadastrar, editar e remover produtos com fotos.

## Stack

- React + Vite + TypeScript no frontend.
- Tailwind CSS para a interface.
- Node.js puro no backend, sem Express.
- MongoDB como banco de dados principal.
- GridFS do MongoDB para armazenar as fotos enviadas pelo admin.
- Web3Forms + hCaptcha no formulário de contato.
- API compatível com servidor Node local e Vercel Functions em produção.

## Banco de Dados

Configure o MongoDB no `.env`:

```env
MONGODB_URI="mongodb://127.0.0.1:27017"
MONGODB_DB_NAME="hidroconex"
ADMIN_PASSWORD="uma_senha_forte"
PORT=3333
IMAGE_LIMIT_MB=3
VITE_WEB3FORMS_ACCESS_KEY="sua_chave_web3forms"
```

O backend cria automaticamente:

- `products`: dados do catálogo.
- `settings`: controle de seed/migração.
- `productImages.files` e `productImages.chunks`: imagens via GridFS.

Quando o MongoDB estiver vazio, o backend importa os produtos iniciais do catálogo legado.

## Como Rodar

1. Instale as dependências:

```bash
npm install
```

2. Garanta que o MongoDB esteja rodando.

3. Rode frontend e backend juntos:

```bash
npm run dev
```

O site abre em `http://localhost:8080`.

## Rotas

- `/` - landing page institucional.
- `/catalogo` - catálogo público completo.
- `/admin` - painel para gerenciar produtos e fotos.
- `/api/catalog` - API pública do catálogo.
- `/api/catalog/images/:id` - imagens salvas no MongoDB/GridFS.
- `/api/health` - status da API e do MongoDB.

## Scripts Úteis

```bash
npm run dev       # API + Vite
npm run dev:web   # somente frontend
npm run dev:api   # somente backend Node
npm run build     # build de produção
npm run start     # serve API e frontend buildado
npm run lint      # lint
npm run test      # testes
```

## Produção

Use uma `MONGODB_URI` de produção, como MongoDB Atlas ou servidor próprio, e configure `ADMIN_PASSWORD` com uma senha forte. As fotos novas não dependem de disco local: ficam no GridFS do MongoDB.

Na Vercel, configure pelo painel as variáveis:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `ADMIN_PASSWORD`
- `VITE_WEB3FORMS_ACCESS_KEY`
- `IMAGE_LIMIT_MB` com valor recomendado `3`

O frontend é publicado como Vite e a API roda em `api/[...path].js`, reaproveitando o backend Node do projeto.

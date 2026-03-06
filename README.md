# Hidroconex - Landing Page Oficial

Bem-vindo ao repositório do projeto **Hidroconex**, uma landing page moderna e responsiva desenvolvida para apresentar o catálogo de produtos, história e informações de contato da fabricante de conexões industriais.

## 🚀 Tecnologias Utilizadas

Este projeto foi construído utilizando as ferramentas mais modernas do ecossistema front-end:

- **React + Vite:** Para uma renderização rápida e um ambiente de desenvolvimento instantâneo.
- **TypeScript:** Garantindo tipagem estática, código seguro e previsível.
- **Tailwind CSS:** Para estilização altamente customizável e responsiva.
- **Shadcn UI + Radix:** Componentes acessíveis e projetados de forma nativa.
- **Web3Forms + hCaptcha:** Para um formulário de contato funcional, seguro e protegido contra spam, enviado diretamente para o seu e-mail, sem a necessidade de um backend próprio.
- **Node.js (Scripts):** Utilizado para gerar dinamicamente o catálogo dos produtos à partir das subpastas de imagens.

## 📦 Estrutura do Projeto

- `/src/assets/Products`: Contém todas as imagens dos produtos com fundo transparente.
- `/src/components`: Componentes da interface como `Hero`, `Products`, `Contact`, `Location`, etc.
- `/src/data/catalog.ts`: Dados automáticos do catálogo, gerados a partir do script Node.js.
- `/scripts/generateCatalog.js`: Script responsável por ler os diretórios de produtos e gerar/atualizar o catálogo dinâmico.

## ⚙️ Como executar rodar o projeto localmente

Siga os passos abaixo para rodar o projeto na sua máquina:

1. **Clone o repositório:**
   ```bash
   git clone <URL_DO_SEU_REPOSITORIO>
   ```

2. **Navegue até a pasta:**
   ```bash
   cd hidroconex-launchpad
   ```

3. **Instale as dependências:**
   Você pode usar npm, pnpm ou bun. (Exemplo com npm)
   ```bash
   npm install
   ```

4. **Configuração de Variáveis de Ambiente:**
   Crie um arquivo chamado `.env` na raiz do projeto.
   Dentro dele, adicione a sua chave do Web3Forms para que o formulário de contato funcione:
   ```env
   VITE_WEB3FORMS_ACCESS_KEY="coloque_sua_chave_aqui"
   ```

5. **Inicie o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse no navegador: `http://localhost:8080` (a porta pode variar dependendo da configuração automática do Vite).

## 🛠️ Como atualizar o Catálogo de Produtos

Se você adicionar novas fotos dentro de `src/assets/Products/`, certifique-se de executar o script de geração para atualizar o array `src/data/catalog.ts`:

```bash
node scripts/generateCatalog.js
```
*Isso lerá todas as novas pastas de modelos e automaticamente formatará os títulos para o site.*

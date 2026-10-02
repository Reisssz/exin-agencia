# EXIN Comunicação

Site institucional em Angular 22 com API Express 5. Requer Node.js 22.22.3 ou superior, menor que 27.

## Desenvolvimento

```sh
npm install
npm run dev
```

O cliente fica em `http://localhost:4200` e a API em `http://localhost:3000`. O Angular encaminha `/api`, `/movies` e `/logo-exin.png` para a API local.

## Produção

```sh
npm run build
npm start
```

O Express serve o build Angular, os endpoints da API e os vídeos com suporte a requisições parciais para reprodução progressiva.

## Netlify

O arquivo `netlify.toml` configura a raiz do repositório como base, `npm run build` como comando e `client/dist/exin-client/browser` como diretório publicado. As funções Node em `netlify/functions` atendem `/api/portfolio` e `/api/health`; o redirect final encaminha rotas do site para o Angular. Use Node.js 22.23.3 ou superior compatível com a faixa declarada no projeto.

## API

- `GET /api/health`: estado do serviço.
- `GET /api/portfolio`: projetos e origens dos vídeos.
- `GET /movies/:arquivo`: mídia local, com suporte a `Range`.

Os projetos aceitam uma origem `file` para mídia local ou `instagram` para abrir uma publicação pública. Nenhum vídeo é solicitado no carregamento inicial: a mídia só é adicionada ao player quando o visitante abre um projeto. A interface mantém uma lista local de fallback se a API estiver indisponível.
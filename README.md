# tasnim

Monorepo-style workspace. Newsroom admin lives on branch `cursor/newsroom-admin-fa-5a6f` (PR #2).

## Building charge PWA — دیارشارژ

- Path: [`apps/sharj/`](apps/sharj/)
- Live: https://sharj.diyareminoodari.ir
- cPanel docroot: `/home/h430544/sharj` (subdomain `sharj.diyareminoodari.ir`, separate from main news site)

```bash
cd apps/sharj && npm install && npm run build
# deploy dist/ → /home/h430544/sharj
```

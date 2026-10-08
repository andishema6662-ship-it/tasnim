# tasnim

Monorepo-style workspace. Newsroom admin lives on branch `cursor/newsroom-admin-fa-5a6f` (PR #2).

## Building charge PWA — شارژبان

- Path: [`apps/sharj/`](apps/sharj/)
- Live (target): https://sharzhban.ir — cPanel home `/home/h432694` (docroot TBD / typically `public_html`)
- Previous: https://sharj.diyareminoodari.ir (`/home/h430544/sharj`)

```bash
cd apps/sharj && npm install && npm run build
# deploy dist/ → sharzhban.ir docroot under /home/h432694
```

# CDaub — Bingo em Tempo Real

App de bingo multiplayer React + Firebase. Live em https://nl-cdaub.web.app.

## Stack

- React 18 via CDN (Babel standalone, sem bundler)
- Firebase Firestore v9.23.0 compat CDN
- Firebase Hosting (projeto `nl-cdaub`)
- Sem build step — tudo carregado via CDN

## Arquivos principais

- `index.html` — carrega Firebase config + React + Babel + styles. Cache busting via query string `?v=YYYYMMDDHHII`
- `app.jsx` — todos os componentes React + lógica Firestore
- `styles.css` — reset + keyframes

## Regras de desenvolvimento

- **Sem bundler** — manter tudo em `app.jsx` e `styles.css`. Não usar ES imports em `app.jsx`.
- Firebase compat expõe global `firebase`; não usar ES module imports.
- Novos keyframes vão em `styles.css`.

## Ao fim de cada tarefa

Sempre (sem esperar o usuário pedir):

1. Incrementar query strings de versão no `index.html`:
   - `styles.css?v=YYYYMMDDHHII`
   - `app.jsx?v=YYYYMMDDHHII`
   - (formato: ano4d + mês2d + dia2d + hora2d + minuto2d)
2. `firebase deploy --only hosting`
3. `git add <arquivos>` + `git commit` + `git push`

Não há `APP_VERSION` no código — o versionamento é exclusivamente via query strings.

## Design system (light theme)

- Fundo: `#f7fafc` / Fonte: Nunito 600/700/800/900
- Verde: `#58cc02` / `#46a302` (bolas chamadas, progresso, BINGO)
- Azul: `#1cb0f6` / `#0d8fcc` (DAUBED chip, célula marcada)
- Laranja: `#ff9600` / `#cc7700` (ROOM chip)
- Vermelho: `#ff4b4b` / `#cc0000` (LEFT chip)
- Cinza: `#6b6b6b` / `#555555` (botões icon, chips neutros)

### Células da cartela (CastScreen)

| Estado | Visual |
|---|---|
| Não chamado | branco |
| Último sorteado | verde claro |
| Chamado, não daubed | dashed verde |
| Daubed | azul |
| FREE (centro) | âmbar `#fff8ec` / borda `#ffc866` |

## Estrutura Firestore

- Coleção `sessions` → documento `{room}` (string "01"–"99")
- Campos: `drawn[]`, `lastDrawn`, `players{}`, `winner`
- Jogador: `{ id, name, joinedAt, card[], marked[], bingo }`
- Atualização via dot notation: `players.{pid}.marked`

## Telas e fluxo

1. `WelcomeScreen` — nome do jogador (persiste localStorage)
2. `RoleScreen` — escolha HOST ou JOIN
3. `JoinScreen` — digita código de 2 dígitos
4. `HostScreen` — layout fixo `height:100vh overflow:hidden`; header 12-col grid; subtítulo "ROOM XX" / "HOST · Name"
5. `CastScreen` — mesmo padrão que HostScreen; header 5-col grid; subtítulo "ROOM XX" / "CAST · Name"; FREE central com fogo 🔥 que cresce com daubProgress

## Componentes reutilizáveis

- `StatChip` — chip colorido com prop `pulse`
- `DrawButton` — botão verde com anel de pulse quando ativo
- `BigCta` — botão CTA grande com shimmer interno
- `IconButton` — botão quadrado para ícones
- `ScreenShell` — wrapper centralizado com animation screenIn
- `WinOverlay` / `GameConfetti` / `CalledList` / `CastCallout`
- `ExitModal` — overlay blur + card + X button absoluto top-right + ícone ⚠️ 64×64 + botão Exit largura total (sem Stay)
- `LeaderboardModal` — mesmo padrão do ExitModal com ícone 🏆 + lista de jogadores com ranking/avatar/progress bar

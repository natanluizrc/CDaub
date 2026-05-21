# DaubCard — Bingo em Tempo Real

App de bingo multiplayer React + Firebase. Live em https://nl-daubcard.web.app.

## Stack

- React 18 via CDN (Babel standalone, sem bundler)
- Firebase Firestore v9.23.0 compat CDN
- Firebase Auth v9.23.0 compat CDN (Anonymous Auth habilitado)
- Firebase Hosting (projeto `nl-daubcard`)
- Sem build step — tudo carregado via CDN

## Arquivos principais

- `index.html` — carrega Firebase config + React + Babel + styles. Cache busting via query string `?v=YYYYMMDDHHII`
- `app.jsx` — todos os componentes React + lógica Firestore
- `styles.css` — reset + keyframes
- `firestore.rules` — regras de leitura/escrita por coleção

## Regras de desenvolvimento

- **Sem bundler** — manter tudo em `app.jsx` e `styles.css`. Não usar ES imports em `app.jsx`.
- Firebase compat expõe global `firebase`; não usar ES module imports.
- Novos keyframes vão em `styles.css`.
- Ao adicionar nova coleção Firestore, lembrar de liberar em `firestore.rules` e fazer `firebase deploy --only firestore:rules`.

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
- Cinza: `#6b6b6b` / `#555555` (botões icon, chips neutros, 4º+ no leaderboard)

### Células da cartela (CastScreen)

| Estado | Visual |
|---|---|
| Não chamado | branco |
| Último sorteado | verde claro |
| Chamado, não daubed | dashed verde |
| Daubed | azul |
| FREE (centro) | âmbar `#fff8ec` / borda `#ffc866` |

### Cores do Leaderboard (por posição)

| Posição | Cor | Hex |
|---|---|---|
| 1º | Ouro | `#ffc800` |
| 2º | Prata | `#afafaf` |
| 3º | Bronze | `#cd7f32` |
| 4º+ | Cinza | `#6b6b6b` |

A cor afeta: número do rank (`#1`, `#2`…), borda do avatar e barra de progresso.

## Estrutura Firestore

- Coleção `sessions` → documento `{room}` (string "01"–"99")
  - Campos: `drawn[]`, `lastDrawn`, `players{}`, `winner`, `hostUid`
  - Jogador: `{ id, name, uid, joinedAt, card[], marked[], bingo }`
  - Atualização via dot notation: `players.{pid}.marked`

- Coleção `names` → documento `{name.toLowerCase()}`
  - Campos: `uid`, `name`, `lastActive` (timestamp ms)
  - Reserva global de nomes; expiração por inatividade (`INACTIVE_MS = 15 min`)

- Coleção `users` → documento `{uid}`
  - Campos: `uid`, `firstSeen`, `lastSeen` (serverTimestamp), `sessionCount`
  - Tracking de usuários únicos e DAU

## Autenticação e tracking

- `firebase.auth().signInAnonymously()` chamado no mount do `App` — invisível ao usuário
- UID armazenado em estado `uid` no `App`, passado via `me.uid` para HostScreen/CastScreen
- `trackUser(uid)` atualiza `users/{uid}` a cada abertura do app
- `claimName(name, uid)` reserva nome em `names/{name}` via transação Firestore
- `releaseName(name)` deleta `names/{name}` ao sair
- `heartbeatName(name)` atualiza `lastActive` a cada `HEARTBEAT_MS = 5 min`

## Validação de nomes

- Mínimo: 2 caracteres / Máximo: 12 caracteres
- Globalmente únicos entre usuários ativos (não apenas por sala)
- Nome expirado = `lastActive` há mais de 15 min → pode ser tomado por outro
- Erro exibido na WelcomeScreen; botão mostra `…` enquanto revalida (`claiming`)

## Timeout de inatividade

- `INACTIVE_MS = 15 min` — sem interação do usuário → libera nome + volta para WelcomeScreen
- `HEARTBEAT_MS = 5 min` — renova reserva do nome enquanto app ativo
- Listeners de atividade: `mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`
- Timeout só ativo quando `stage !== 'welcome'`

## Sistema de pop-ups (fila)

Tanto HostScreen quanto CastScreen usam **fila única** — um pop-up por vez, sem sobreposição.

**HostScreen** (`winnerQueue`): itens do tipo `{ type, n?, msg?, name? }`
- `type: 'number'` → `HostCallout` (número sorteado, verde, 5s)
- `type: 'line'`   → `LineNotif` (LINE!, azul, 5s)
- `type: 'bingo'`  → `WinNotif` (BINGO!, fechamento manual)

**CastScreen** (`calloutQueue`): itens do tipo `{ n, msg }`
- `CastCallout` (número sorteado, verde, 5s)

Todos os pop-ups automáticos têm timeout de **5 segundos**.

## Telas e fluxo

1. `WelcomeScreen` — nome do jogador (persiste localStorage); valida e reserva nome globalmente ao clicar Continuar; aceita props `error` e `claiming`
2. `RoleScreen` — escolha HOST ou JOIN
3. `JoinScreen` — digita código de 2 dígitos
4. `HostScreen` — layout fixo `height:100vh overflow:hidden`; header 12-col grid; wordmark "DaubCard" (4vh, preto) + nome do host (4vh, cinza `#6b6b6b`)
5. `CastScreen` — mesmo padrão que HostScreen; header 5-col grid; wordmark "DaubCard" (4vh, preto) + nome do jogador (4vh, cinza `#6b6b6b`); FREE central com fogo 🔥 que cresce com daubProgress

## Componentes reutilizáveis

- `StatChip` — chip colorido com prop `pulse`
- `DrawButton` — botão verde com anel de pulse quando ativo
- `BigCta` — botão CTA grande com shimmer interno
- `IconButton` — botão quadrado para ícones
- `ScreenShell` — wrapper centralizado com animation screenIn
- `GameConfetti` / `CalledList`
- `HostCallout` / `CastCallout` — pop-up de número sorteado (5s, fila)
- `LineNotif` — pop-up LINE! azul (5s, fila)
- `WinNotif` — pop-up BINGO! verde (fechamento manual)
- `ExitModal` — overlay blur + card + X button absoluto top-right + ícone ⚠️ 64×64 + botão Exit largura total (sem Stay)
- `LeaderboardModal` — mesmo padrão do ExitModal com ícone 🏆 + lista de jogadores com ranking/avatar/progress bar; cores por posição

# DaubCard — Guia de Desenvolvimento

Bingo multiplayer em tempo real. Live em https://nl-daubcard.web.app. App irmão do RushWord — mesma stack, projeto Firebase separado (`nl-daubcard`).

## Paridade com o app irmão (RushWord)

DaubCard e RushWord são apps irmãos da NL Consultoria e **devem permanecer idênticos** em:

- **Identidade visual** — design system (cores, tipografia, espaçamentos), animações, layout de telas compartilhadas
- **Padrões de código** — estrutura de hooks, roteamento via `screen` state, sistema de nomes, comportamento de `beforeunload`, timeout de inatividade
- **UX compartilhada** — WelcomeScreen, HomeScreen, JoinScreen, LobbyScreen, ExitModal, BackLink, fluxo de entrada na sala

**Ao alterar qualquer padrão compartilhado neste app, replicar imediatamente no RushWord** (e vice-versa).

Componentes e funções que devem ficar sincronizados entre os dois apps:
`ScreenShell`, `BigCta`, `IconButton`, `BackLink`, `HomeCard`, `LangPicker`, `TwemojiFlag`, `GameConfetti`, `ExitModal`, `WelcomeScreen`, `claimName`, `releaseName`, `heartbeatName`, `trackUser`

---

## Stack

- React 18 via CDN (Babel standalone, sem bundler)
- Firebase Firestore v9.23.0 compat CDN
- Firebase Auth v9.23.0 compat CDN (Anonymous Auth habilitado)
- Firebase Hosting (projeto `nl-daubcard`)
- Twemoji v14.0.2 via CDN — renderização de bandeiras em Windows
- Sem build step — tudo carregado via CDN

## Arquivos principais

- `index.html` — carrega Firebase config + React + Babel + Twemoji + styles. Cache busting via `?v=YYYYMMDDHHII`
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

Não há `APP_VERSION` no código — o versionamento é exclusivamente via query strings.

---

## Constantes principais

```js
const ME_KEY       = "bingo_me";
const LANG_KEY     = "bingo_lang";   // idioma persiste localStorage; default 'en'
const INACTIVE_MS  = 15 * 60 * 1000;
const HEARTBEAT_MS =  5 * 60 * 1000;
```

---

## i18n (internacionalização)

Três idiomas: `en`, `pt`, `es`. Idioma padrão: `'en'`.

```js
const TRANSLATIONS = { en: { ... }, pt: { ... }, es: { ... } };
const LangContext = React.createContext({ lang: 'en', setLang: () => {}, t: TRANSLATIONS.en });
function useLang() { return React.useContext(LangContext); }
```

- `LangContext.Provider` envolve toda a árvore em `App`
- `LangPicker` — botões de bandeira usando `TwemojiFlag`
- `TwemojiFlag` — usa `dangerouslySetInnerHTML` com a API string do Twemoji (não `useRef`+`useEffect` — o React sobrescreve o DOM)
- Idioma persiste em `localStorage` via `LANG_KEY`

### Chaves de tradução relevantes

| Chave | EN | PT | ES |
|-------|----|----|-----|
| `greeting` | `Hello, {name}!` | `Olá, {name}!` | `¡Hola, {name}!` |
| `whatToDo` | `What do you want to do?` | `O que deseja fazer?` | `¿Qué deseas hacer?` |
| `createRoom` | `Create Room` | `Criar Sala` | `Crear Sala` |
| `joinRoom` | `Join Room` | `Entrar na Sala` | `Entrar a la Sala` |
| `developedBy` | `By NL Consultancy` | `Por NL Consultoria` | `Por NL Consultoría` |
| `namePlaceholder` | `e.g. John/Mary` | `ex: João/Maria` | `ej: Juan/María` |

---

## Design system (light theme)

- Fundo: `#f7fafc` / Fonte: Nunito 600/700/800/900
- Verde: `#58cc02` / `#46a302` (Criar Sala, bolas chamadas, progresso, BINGO)
- Azul: `#1cb0f6` / `#0d8fcc` (Entrar na Sala, DAUBED chip, célula marcada)
- Laranja: `#ff9600` / `#cc7700` (ROOM chip)
- Vermelho: `#ff4b4b` / `#cc0000` (LEFT chip)
- Cinza: `#6b6b6b` / `#555555` (botões icon, chips neutros, 4º+ no leaderboard)
- Títulos/textos principais: `#3c3c3c` (preto suave)

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

---

## Telas e fluxo

Roteamento via `const [screen, setScreen] = useState('welcome')` em `App`. Navegação centralizada em `handleBack` e `handleExit`.

```
welcome → home → [Criar Sala] → host (HostScreen → LobbyScreen → jogo)
               → [Entrar na Sala] → join (JoinScreen) → cast (CastScreen → lobby → jogo)
```

| `screen` | Componente | Descrição |
|----------|-----------|-----------|
| `'welcome'` | `WelcomeScreen` | Nome + LangPicker; F5 pré-preenche com nome salvo |
| `'home'` | `HomeScreen` | Criar Sala / Entrar na Sala |
| `'join'` | `JoinScreen` | Input de código de 2 dígitos |
| `'host'` | `HostScreen` | Grid de 72 bolas + LobbyScreen embutida |
| `'cast'` | `CastScreen` | Cartela 5×5 do jogador guest |

### `handleBack` (voltar entre telas pré-jogo)
- `screen === 'home'` → `releaseName` + `setScreen('welcome')`
- `screen === 'join'` → limpa joinError + `setScreen('home')`

### `handleExit` (sair do jogo/lobby)
- `setRoom(''); setScreen('home')` — nome **não** é liberado (usuário continua logado na HomeScreen)
- Nome é liberado em: `handleBack` a partir de HomeScreen, timeout de inatividade, `beforeunload`

### LobbyScreen (dentro de HostScreen, `session.phase === 'lobby'`)
- Mostra código da sala + lista de jogadores
- Host clica **Iniciar Jogo** → `phase = 'playing'` → todos entram simultaneamente
- **Sem aprovação individual** — guest entra direto em `players` ao submeter o código

### CastScreen — fluxo de entrada
1. Transação Firestore: adiciona guest direto em `players` (sem `pending`)
2. `setPlayerId` + `setLocalCard` imediatamente após a transação
3. `onSnapshot` assina a sessão → lobby view com botão `<BigCta disabled>` mostrando `t.waitingForHost` ("Aguardando início…")
4. Host inicia → jogo começa

**Não há persistência de sessão em localStorage** — DaubCard não salva `playerId`/`card` no `ME_KEY`. O fluxo após F5 é sempre um fresh join, igual ao RushWord.

### Saída de sala no `beforeunload` (F5 / fechar aba)

**Nunca usar SDK no `beforeunload`** — o browser cancela requisições assíncronas durante o page unload.

Todo o cleanup de saída está centralizado no **App** com listeners `pagehide` + `beforeunload` (guard `done` evita execução dupla). **Criador e guest usam mecanismos diferentes** — `fetch PATCH keepalive` para guest (deletar campo aninhado de mapa via `:commit` updateMask é não-confiável no Firestore REST):

- **Criador (`screen === 'host'`)**: DELETE do documento de sessão → outros recebem `!snap.exists` → tela "Sala encerrada"
- **Guest (`screen === 'cast'`)**: PATCH com `updateMask` remove `players.${uid}` da sessão
- **Todos**: DELETE do documento `names/${name}` libera o nome

```js
navigator.sendBeacon(
  'https://firestore.googleapis.com/v1/projects/nl-daubcard/databases/(default)/documents:commit',
  new Blob([JSON.stringify({ writes })], { type: 'application/json' })
);
```

O handler usa `screenRef`, `roomRef`, `uidRef` e `currentNameRef` (refs sempre atuais) para evitar closures estáticas. Registrado uma vez com `[]` deps no App.

**`screenRef`** determina o papel de forma **síncrona** — `'host'` = criador, `'cast'` = guest. Nunca usar dados do Firestore (como `hostUid`) para determinar papel no `beforeunload`. O RushWord usa `isCreatorRef` pelo mesmo motivo.

Para saídas explícitas (BackLink, ExitModal, inatividade), o SDK é seguro — a página não está sendo destruída.

⚠️ **Problema conhecido**: extensões de browser (uBlock, AdGuard, etc.) podem bloquear `sendBeacon` para `firestore.googleapis.com` em guias normais — funciona em guia anônima e mobile. Solução pendente: sistema de presença por heartbeat.

1. **WelcomeScreen** — nome do jogador (persiste em `localStorage` via `ME_KEY` — campo pré-preenchido no F5); valida e reserva nome globalmente ao clicar Continuar; `LangPicker` no topo; rodapé `t.developedBy`
2. **HomeScreen** — saudação `t.greeting` + `t.whatToDo`; dois `HomeCard`:
   - 🎙️ `t.createRoom` (verde `#58cc02`) — chama `onPick('host')`
   - 🎟️ `t.joinRoom` (azul `#1cb0f6`) — chama `onPick('cast')` → vai para JoinScreen
3. **JoinScreen** — input de código de 2 dígitos
4. **HostScreen** — layout fixo `height:100vh overflow:hidden`; header 12-col grid; wordmark "DaubCard" (4vh, preto) + nome do host (4vh, cinza `#6b6b6b`)
5. **CastScreen** — mesmo padrão que HostScreen; header 5-col grid; FREE central com fogo 🔥 que cresce com `daubProgress`

---

## Componentes reutilizáveis

- `HomeCard` — card de ação: `{ color, emoji, title, desc, onClick }` (sem tagline)
- `LangPicker` — botões de bandeira PT/EN/ES com `TwemojiFlag`
- `TwemojiFlag` — renderiza emoji de bandeira via Twemoji (compatível Windows)
- `StatChip` — chip colorido com prop `pulse`
- `DrawButton` — botão verde com anel de pulse quando ativo
- `BigCta` — botão CTA grande com shimmer interno; variantes green/blue/orange
- `IconButton` — botão quadrado para ícones
- `ScreenShell` — wrapper centralizado com animation `screenIn`
- `BackLink` — link `← Voltar` / `← Back` / `← Atrás`
- `GameConfetti`
- `HostCallout` / `CastCallout` — pop-up de número sorteado (5s, fila)
- `LineNotif` — pop-up LINE! azul (5s, fila)
- `WinNotif` — pop-up BINGO! verde (fechamento manual)
- `ExitModal` — overlay blur + card + X button absoluto top-right + ícone ⚠️ 64×64 + botão Exit largura total (sem Stay)
- `LeaderboardModal` — mesmo padrão do ExitModal com ícone 🏆 + lista de jogadores com ranking/avatar/progress bar

---

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

## Autenticação e tracking

- `firebase.auth().signInAnonymously()` chamado no mount do `App`
- UID armazenado em estado `uid`, passado via `me.uid` para HostScreen/CastScreen
- `trackUser(uid)` atualiza `users/{uid}` a cada abertura do app
- `claimName(name, uid)` reserva nome em `names/{name}` via transação Firestore
- `releaseName(name)` deleta `names/{name}` ao sair
- `heartbeatName(name)` atualiza `lastActive` a cada `HEARTBEAT_MS = 5 min`

## Validação de nomes

- Mínimo: 2 caracteres / Máximo: 12 caracteres
- Globalmente únicos entre usuários ativos
- Nome expirado = `lastActive` há mais de 15 min → pode ser tomado por outro
- Erro exibido na WelcomeScreen; botão mostra `…` enquanto valida (`claiming`)

## Comportamento do nome

- **F5** → WelcomeScreen com nome pré-preenchido (lido de `localStorage`); nome ainda reservado no Firestore até expirar por inatividade
- **Back da HomeScreen** → Welcome com nome pré-preenchido; `releaseName` chamado
- **Exit do jogo/lobby** → HomeScreen com nome ainda ativo (pode criar/entrar em outra sala)
- **Timeout de inatividade** → Welcome com nome pré-preenchido; `releaseName` chamado
- **`beforeunload`** (fechar aba/janela) → nome deletado via `sendBeacon` + guest removido da sala via `sendBeacon` (Firestore REST `:commit`)
- `claimName` aceita o mesmo `uid` reclamando o próprio nome (re-entrada após back)

## Timeout de inatividade

- `INACTIVE_MS = 15 min` — sem interação → libera nome do Firestore + volta para WelcomeScreen (nome fica pré-preenchido)
- `HEARTBEAT_MS = 5 min` — renova reserva do nome enquanto app ativo
- Listeners: `mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`
- Só ativo quando `screen !== 'welcome'`

## Sistema de pop-ups (fila)

Tanto HostScreen quanto CastScreen usam **fila única** — um pop-up por vez, sem sobreposição.

**HostScreen** (`winnerQueue`): `{ type, n?, msg?, name? }`
- `type: 'number'` → `HostCallout` (número sorteado, verde, 5s)
- `type: 'line'`   → `LineNotif` (LINE!, azul, 5s)
- `type: 'bingo'`  → `WinNotif` (BINGO!, fechamento manual)

**CastScreen** (`calloutQueue`): `{ n, msg }`
- `CastCallout` (número sorteado, verde, 5s)

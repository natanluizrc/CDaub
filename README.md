# DaubCard — Bingo Multiplayer em Tempo Real

Bingo multiplayer para jogar com amigos e família. Uma pessoa cria a sala (host) e compartilha o código; os demais entram com uma cartela 5×5 gerada automaticamente. O host sorteia os números; o primeiro a completar uma linha ganha.

Live em https://nl-daubcard.web.app. App irmão do RushWord (https://nl-rushword.web.app).

---

## Fluxo do jogo

1. Jogador entra com seu nome e escolhe **Criar Sala** ou **Entrar na Sala**
2. Criador compartilha o código de 2 dígitos com os demais
3. Demais jogadores entram e aguardam o início
4. Criador sorteia números; jogadores marcam (daub) sua cartela
5. Primeiro a completar uma linha clica **BINGO** e vence

### Cartela

- 5×5 com 24 números únicos de 1–75 + centro FREE
- Estados das células: não chamado → chamado (dashed verde) → marcado/daubed (azul) → FREE (âmbar)

### Pontuação de calor (host)

O app classifica os jogadores por progresso com indicadores COLD / WARM / FIRE.

---

## Stack

- React 18 via CDN (Babel standalone, sem bundler)
- Firebase Firestore v9.23.0 — realtime via `onSnapshot`
- Firebase Auth v9.23.0 — Anonymous Auth (invisível ao usuário)
- Firebase Hosting — projeto `nl-daubcard`
- Twemoji v14.0.2 — renderização de bandeiras em Windows
- Fonte: Nunito 600–900 (Google Fonts)

---

## Idiomas

PT / EN / ES. Idioma padrão: inglês. Troca via botões de bandeira na tela inicial; persiste em `localStorage`.

---

## Para desenvolvedores

Ver `CLAUDE.md` para guia completo de desenvolvimento, padrões de código, design system e estrutura Firestore.

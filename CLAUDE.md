# Colony Clash

## Project Overview
Local multiplayer ant colony battle arena. Single HTML file game using HTML5 Canvas + vanilla JS. Zero dependencies.

## Architecture
- **Single file:** `index.html` contains all HTML, CSS, and JavaScript
- **Rendering:** HTML5 Canvas 2D context, 672x528px (28x22 tiles, 24px each)
- **No build step, no server required** — just open in a browser

## Key Design Decisions
- Player IS the queen — sudden death, lose queen = lose round
- Spawn mounds are the core strategic mechanic (risk queen to gain soldiers)
- Destructible terrain reshapes the map during play
- AI waves add chaos (termites eat walls, swarms hunt queens)
- Best of 5 rounds, new procedural map each round

## Development
- Preview: `python3 -m http.server 8080` then open localhost:8080
- No tests, no linting — hackathon sprint, ship fast
- See GAME_DESIGN.md for full spec with colors, stats, timers, and build phases

## Controls
- P1: WASD + Space (shoot)
- P2: Arrow keys + Enter (shoot)

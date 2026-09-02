# Battle of the Stores

Responsive live scoreboard for **OSL Ottawa West District**.

## Live data
The site reads the `Website Feed` tab from Google Sheet ID:

`16h5Es-wSjMliqfT4I59HEpSMjXP8lspta-wTZrPHhkw`

Thursday workflow stays the same: update the Battle Log / scoreboard Sheet and the website reads the refreshed feed. The page also contains a saved fallback dataset so it still renders if the live Sheet request is temporarily unavailable.

## GitHub Pages
This repository is designed to publish directly from the `main` branch root using GitHub Pages. No build step is required.

## Files
- `index.html` — page structure
- `styles.css` — responsive layout and design
- `app.js` — Google Sheet parsing, battle cards, leaderboard, and refresh behavior
- `battle-banner.png` — Battle of the Stores Back to School banner

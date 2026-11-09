# 🐔 Space Chicken Shooter

Defend the galaxy from a relentless flock in **Space Chicken Shooter** — a neon-soaked arcade game built with vanilla HTML, CSS, and JavaScript. Dodge falling eggs, blast waves of chickens, collect credits, and customize your ship in the Nebula Armory.

## 🚀 Play

Open `index.html` in a modern web browser. No installation, build step, or server is required.

> The game uses browser `localStorage` to save credits, unlocked ships, and upgrades on your device.

## 🎮 Controls

| Key | Action |
| --- | --- |
| `W` / `A` / `S` / `D` or arrow keys | Move your ship |
| `Space` | Fire lasers |
| `R` | Restart after a run ends |
| `Escape` | Pause or resume |
| Smart Bomb button | Clear the screen (uses one bomb) |

## ✨ Features

- Fast-paced, wave-based space shooter with increasingly challenging enemy flocks.
- Multiple chicken types, including swift, armored, and boss enemies.
- Ship skins with distinct looks and rarity tiers.
- Upgrade shop for weapons, thrusters, shields, armor, drones, bombs, and more.
- Credits, equipped skins, and upgrades saved locally in your browser.
- Animated neon visuals, starfields, particle effects, and responsive menus.

## 🗂️ Project files

- `index.html` — game layout, menus, HUD, and canvas.
- `style.css` — neon arcade styling and responsive layout.
- `game.js` — gameplay, rendering, controls, shop, and local saves.

## 🛠️ Run locally

1. Download or clone this repository.
2. Open `index.html` in your browser.
3. Press **Play** and take off!

For a local web server, you can also run:

```bash
python -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## 💾 Save data

Progress is stored in your browser under the `spaceChickenSave` localStorage key. Clearing browser storage will reset credits, unlocked skins, and upgrades.

## 📄 License

No license has been specified for this project yet.

<div align="center">

# 🌸 VN Library

**A personal, beautifully designed Visual Novel tracker — your own Letterboxd for VNs.**

*Track routes. Log characters. Write reviews. Fall in love with your library.*

![VN Library Demo](./assets/demo.webp)

[![Made with](https://img.shields.io/badge/Made%20with-Vanilla%20JS-f472a0?style=flat-square&logo=javascript&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Storage](https://img.shields.io/badge/Storage-localStorage-ffb3c6?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
[![License](https://img.shields.io/badge/License-MIT-fdd?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📚 **Game Library** | Add VNs with cover art, developer, platform, synopsis, and custom tags |
| 🔀 **Advanced Sorting** | Sort by Alphabetical (A-Z/Z-A), Recently Added, Recently Played, Highest Rated, or Most Routes |
| 🖼️ **Multi-View Modes** | Toggle between **List View**, **Grid S**, **Grid M** (default), and **Grid L** layouts |
| 🎲 **Random Pick** | Let the app choose your next adventure from your backlog with a fun randomizer |
| ▶ **Now Playing Strip** | Quick-access shelf at the top of your library for games you're currently reading |
| 🏆 **Milestones** | Track your progress with achievement-style badges for collection size and completions |
| 🏷️ **Card Badges** | Instant visual feedback on game cards showing route progress and average ratings |
| 🗺️ **Trail Log** | Track every route/character playthrough with start & end dates |
| 💖 **Route Favorites** | Heart your favorite routes — they appear on your Dashboard |
| ⭐ **Letterboxd-style Reviews** | 5-star ratings, spoiler-blurred text, and a "quick review" on completion |
| 👤 **Character Profiles** | Attach a photo and personal notes to any route log |
| 🎨 **Dark & Light Mode** | Toggleable *Coquette* (light) and *Chic Noir* (dark) themes |
| 🖼️ **Custom Backgrounds** | Set any image URL as a personal background wallpaper |
| 🔍 **Smart Library Filters** | Filter by platform, status, or search by title, dev, or tag |
| 📊 **Analytics Dashboard** | Tag distribution, platform breakdown, rating charts, and completion stats |
| ✂️ **Image Cropper** | Crop cover art from URL or upload from local files directly in the app |
| 💾 **Data Export / Import** | Backup and restore your entire library as a `.json` file |
| 📌 **Collapsible Sidebar** | Save screen space with an elegant icon-only sidebar mode |
| 📈 **Library Stats** | Live counters showing exactly how many games are in your view and backlog |
| 🍁 **Falling Leaves** | Animated 🍁🍂🍃 leaves gently float across every page |

---

## 📖 New Library Features

![Library View](./assets/library.png)

We've recently upgraded the library experience to make managing large collections even easier:

- **View Modes**: Choose **List View** for a compact, text-heavy layout, or **Grid L** to see your covers in high-definition glory. **Grid S** is perfect for those with massive backlogs.
- **Backlog Randomizer**: Can't decide what to play next? Click the 🎲 icon in your library to let fate decide!
- **Persistent Settings**: Your preferred view mode and sort order are saved automatically to your device.
- **Route Tracking**: Card badges now show your route progress (e.g., `2/5`) at a glance, alongside your average rating for that VN.
- **Milestones**: Check your dashboard to see your latest achievements as your collection and completion counts grow.

---

## 🚀 Running Locally

VN Library is a **100% static web app** — no server, no database, no Node.js required. All data lives in your browser's `localStorage`.

### Option 1 — Double-click launch (Mac/Linux) ⭐ Recommended

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/vn-library.git
cd vn-library

# 2. Make the launcher executable (first time only)
chmod +x launch.sh

# 3. Launch!
./launch.sh
```

The script spins up Python's built-in HTTP server, picks a free port, and opens your browser automatically. Press `Ctrl+C` in the terminal to stop.

### Option 2 — Python one-liner

```bash
cd vn-library
python3 -m http.server 8080
# Then open http://127.0.0.1:8080 in your browser
```

### Option 3 — VS Code Live Server

Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html`, and choose **Open with Live Server**.

---

## 📂 File Structure

```
vn-library/
├── index.html          # App shell & navigation (sidebar, modals)
├── styles.css          # All styling (light + dark tokens, analytics, animations)
├── app.js              # All app logic, routing, image cropper, analytics, localStorage
├── launch.sh           # One-click local launcher script
└── assets/             # App assets
```

---

## 📊 Analytics

The **Analytics** page gives you a bird's-eye view of your VN journey:

- **Overview** — Total games, routes, completed count, favorites, reviews, average rating
- **Completion Time** — Average, fastest, and slowest route completion times + most productive month
- **Tags** — Bar chart showing how many VNs you have per tag (e.g. Otome, Romance, Sci-Fi)
- **By Platform** — Bar chart of your games across Steam, Switch, Itch.io, etc.
- **Status Distribution** — Horizontal bar breakdown of Want to Play / Playing / Completed / Paused / Dropped
- **Rating Distribution** — Bar chart of your 1–5 star ratings across all reviews

---

## ✂️ Cover Image Cropper

When adding a VN, you can:

1. **Paste a URL** for the cover art
2. Click **✂️ Crop** to open a full-screen cropper — drag to select the area you want, then apply
3. Or click **📁 File** to upload an image directly from your computer

The cropped/uploaded image is stored as a data URL in localStorage, so it works fully offline.

---

## 💾 Data & Backup

All your data is stored in your browser's `localStorage` under the key `vnTrackerData`. This means:

- ✅ Works fully offline
- ✅ Persists between browser sessions
- ⚠️ Data is **browser-specific** — clearing browser data will erase it

**To back up or move your data:**
1. Click the avatar icon (top right) to open Profile & Settings
2. Click **Export** — this downloads a `.json` file of all your games, routes, and reviews
3. On a new device/browser, use **Import** to restore it

---

## 🛠️ Tech Stack

- **HTML5** — semantic structure
- **Vanilla CSS** — custom properties, animations, dark mode via `[data-theme]`
- **Vanilla JavaScript** — zero dependencies, zero build step
- **Google Fonts** — [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) (headings) + [Poppins](https://fonts.google.com/specimen/Poppins) (body)

---

## 🌸 Credits

Built with love for the VN community. Inspired by [Letterboxd](https://letterboxd.com/).

> *"Every route is a story worth remembering."*

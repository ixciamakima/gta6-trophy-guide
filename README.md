[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/ixciamakima/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/ixciamakima/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Trophy Atlas

An offline trophy guide and tracker for **Grand Theft Auto VI on PlayStation 5** — all **55 official trophies** (1 Platinum, 2 Gold, 6 Silver, 46 Bronze), each with a guide written for this atlas and the sources for its facts cited right beside it.

## What it does

- **Full tracker** — every official trophy with its published name, description and grade; check trophies off, and watch per-grade tallies and the overall progress bar fill in.
- **Progress counters** — the 19 trophies with numeric targets (250 stunts, 42 shooting-range golds, 100 WAiNK spots, $250,000 laundered…) get steppers that feed the tracker; hitting a target marks the trophy earned.
- **Filters & search** — by kind (story, collectibles, activities, feats & free roam, meta), by grade, by status, by the one missable, or by free text.
- **Spoiler shield** — hides the 17 story trophies (name, description and guide) until each is earned, so the tracker can sit open next to a first playthrough.
- **Platinum roadmap** — five stages built from the official descriptions: story first (with a manual save at every chapter — there is no mission replay), stranger strands, the 100% checklist push, collection sweeps, then the feats-and-money cleanup. Each stage shows its own progress, and a *Next up* planner in every guide points at the sensible next trophy.
- **Missables page** — the list's one genuinely missable trophy, Positive Mental Attitude (its Chapter 1 home meditation spot disappears when the chapter ends), flagged everywhere it appears, with the warnings sourced.
- **Saved progress** — checklist and counters persist in the browser (localStorage), with JSON export/import and a reset.

## Sources

Guides are original text written for this atlas. Facts are cited per trophy in the app, from:

- PowerPyx — *GTA 6 Trophy Guide & Roadmap* (roadmap structure, the missable, checklist requirements)
- Exophase — the official PS5 trophy list (names, descriptions, grades)
- PSNProfiles — trophy list and PSN progress targets
- GTA-Zone — trophy list

Where a trophy's trigger is still unconfirmed in the launch guides, the guide says so instead of inventing steps.

## Running it

The app is plain static files — no build step, no network calls. Serve the `app/` folder with any static file server, for example:

```sh
python3 -m http.server --directory app 8080
# then open http://localhost:8080
```

Fan-made tool. Not affiliated with Rockstar Games or Take-Two Interactive; no Rockstar artwork, logos or fonts are used.

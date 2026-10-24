# UCNA Training Simulator

An offline-capable, browser-based Bridge Command / EmptyEpsilon training academy. This is an unofficial, non-commercial community fan project and is not endorsed by the game developers.

**Online Academy:** https://w1face.github.io/ucna-training-simulator/

**Offline edition (v1.3):** Download via the Academy homepage or [this standalone HTML file](https://w1face.github.io/ucna-training-simulator/downloads/UCNA_Training_Simulator_v1.3_Offline.html). The HTML file embeds all four current training modules and the artwork; it requires no server, connection or installation.

## Modules

- **Radar Scanning** — Science / Radar: waveform reading, scanning and control.
- **Radar Icon Recognition** — bridge-wide: ship contacts, IFF and tactical symbols.
- **Radar Signature Analysis** — Science / Radar: signal behaviour and ship activity.
- **Hacking & System Disruption** — Command / Navigation: electronic warfare and system effects.

## Maintaining the Academy

- `index.html` is the GitHub Pages homepage and modular launcher.
- `trainers/` contains independent exercise files; update any trainer there without rebuilding unrelated modules.
- `assets/illustrations/` contains the four custom blue monochrome training tile illustrations.
- `assets/icons/` contains small utility/legacy icons.
- `downloads/UCNA_Training_Simulator_v1.3_Offline.html` is the self-contained offline edition. Rebuild it when changing the exercises or artwork.

The online and offline editions store officer progress locally in the browser and do not automatically sync across origins. Export training records before changing browsers or computers.

GitHub Pages publishes the `main` branch from the repository root. The entry point is `index.html`.

## Attribution

Bridge Command, EmptyEpsilon and the United Confederation Navy insignia belong to their respective rights holders. This independent community project is not official, sponsored, endorsed by or affiliated with the developers. The Academy illustrations are original training UI artwork; supplied insignia appear separately.

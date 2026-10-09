# lehramt_melina

Studium-Tracker für Lehramt Gymnasium (Englisch, Politik und Gesellschaft) an der Universität Passau.

Die App liegt in `app/` (React, TypeScript, Vite, Tailwind, Zustand). `studium-app/` ist reine Build-Ausgabe
und wird automatisch von `.github/workflows/deploy-studium-app.yml` bei jedem Push auf `main` erzeugt – dort
nichts von Hand ändern.

Live: https://noaschka.github.io/lehramt_melina/studium-app/

Alle Daten liegen nur lokal im Browser (localStorage). Unter Einstellungen gibt es Export/Import als JSON-Backup.
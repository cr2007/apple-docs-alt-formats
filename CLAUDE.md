# CLAUDE.md

`AGENTS.md` is the primary reference for this repository: toolchain,
commands, project structure, URL rules, and conventions. Read that file
first. This file only adds instructions specific to Claude Code.

## Claude-specific instructions

- Never use `npm`, `npx`, `yarn`, or `pnpm`. Use `bun` / `bunx --bun` for
  every command, including ones a tool's own docs show with `npx`.
- Never add a `Co-Authored-By` or similar attribution trailer to a
  commit made in this repository.
- Write commit messages as a heredoc so they carry both a subject line
  and a body (see `AGENTS.md`'s commit message convention).

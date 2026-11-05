# Agent skills

Skills are installed per project with the `skills` CLI (`pnpm dlx skills ...`) and committed: `.claude/skills/`, `.agents/skills/` and `skills-lock.json`. Only personal settings (`.claude/settings.local.json`) are git-ignored, and Biome ignores the skill files and the lock.

- `.claude/skills/` is the only directory Claude Code loads project skills from. It is a real directory; don't replace it with a symlink to another repo.
- Miden SDK skills ship inside the `@miden-sdk/*` npm packages and are symlinked, not copied: `.claude/skills/<name>` → `.agents/skills/<name>` → `apps/web/node_modules/@miden-sdk/*/skills/<name>`. They follow the installed SDK version, so they break until `pnpm install` has run. After an SDK bump that adds or removes skills, re-sync:

  ```bash
  pnpm dlx skills experimental_sync -r --agent claude-code --include '@miden-sdk/*' -y
  ```

- Third-party skills are copied in and recorded in `skills-lock.json`. Example: `shadcn` and `migrate-radix-to-base` from `pnpm dlx skills add shadcn/ui --skill '*' --agent claude-code -y`.
- `tutorials-qa` is a hand-written local skill in `.claude/skills/tutorials-qa/`, with no upstream source; don't delete it.
- Install skills at project level with `--agent claude-code`, not globally (`-g`), unless asked.

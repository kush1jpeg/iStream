# Contributing to iStream

First off, thank you for even considering to contributing. This project was built with a lot of late nights, bad coffee, and genuine love inorder to learn systems(design + implementation). If you're here, you probably care about building things properly too.

Please be kind with the code — but not too kind :)
This was built by a second-year college student at 3am, running on coffee and questionable life choices. It is not perfect. There are things done wrong, patterns that could be cleaner, and architectural decisions that seemed genius at 3am.

If you know something I don't, tell me. If you see something wrong, say it. If you think there's a better way - show me. I am not here to be gratified. The fastest way to do that is to have people who actually know what they're doing tell me exactly where I'm wrong and why.

Don't sugarcoat it. I can take it.

This entire project exists because I refused to use a managed streaming service and wanted to understand every layer myself — RTMP ingest, FFmpeg transcoding, HLS delivery, autoscaling workers, the whole thing.

I would have had used any service, if it provided abs(adaptive-bitrate-streaming), but sadly i couldn't find it, and made it myself.

If you know something that would have saved me three days of debugging at 3am — please, for the love of god, tell me now.

[Teach me. I'm listening](https://www.youtube.com/shorts/Sx7_blAfbBI).
---

## Before You Start

Read the [architecture docs](./architecture.md) first. Seriously. Don't open a PR that breaks things because you didn't understand how stuff work. Understanding the system I have built is a prerequisite, not a suggestion, different perspectives about doing a thing are joyously welcomed.

---

## Code Style 

### Tabs, not spaces (Pleaseee!)

iStream uses **tabs** for indentation. Not 2 spaces. Not 4 spaces. Tabs!

This is a philosophical choice, not just a formatting rule. Tabs mark the logical structure of the code while leaving visual width to the reader. That means the same file can look right in anyone's editor, without forcing a particular column width on every contributor.

If your editor is inserting spaces, fix it:

**VS Code** ~ add to `settings.json` also grow up and use nvim:
```json
{
  "editor.insertSpaces": false,
  "editor.tabSize": 4
}
```

**Neovim** ~ add to your config:
```lua
vim.opt.expandtab = false
vim.opt.tabstop = 4
vim.opt.shiftwidth = 4
```

PRs with spaces instead of tabs will be asked to reformat before merge. This is not negotiable.
I am a tabs guy btw;

### TypeScript

- Strict mode is enabled — don't turn it off
- No `any` unless absolutely unavoidable — if you use it, leave a comment explaining why
- Prefer `const` over `let`. 
- Async functions should have proper error handling — no silent catch blocks

### Comments

Write comments for tough codepieces; **why**, not **what**. The code shows what. The comment should explain the decision.

---

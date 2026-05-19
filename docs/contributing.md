# Contributing to iStream

First off, thank you for even considering to contributing. This project was built with a lot of late nights, bad coffee, and genuine love inorder to learn systems(design + implementation). If you're here, you probably care about building things properly too.

Please be kind with the code. It was written by a second-year college student, I want you all to help me grow by reminding me, how shit code I write, and how to improve on it.

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
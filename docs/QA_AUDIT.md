# Env Vault - Pre-Deployment QA and Architecture Audit

**Version audited:** 1.0.0
**Audit date:** 22 November 2026
**Auditor:** Engineering QA pass (automated scans plus manual code review)
**Result:** PASS - zero open findings

---

## 1. Scope and Method

The audit covered the complete shipped surface:

- 93 TypeScript and TSX files under `src`
- 45 Rust files under `src-tauri/src`
- 2,599 lines of CSS across `src/styles`
- 73 locale dictionaries and the i18n loader
- NSIS configuration, bundle metadata and CI workflow
- Repository hygiene, dead files and generated artifacts

Method:

1. Static scans for `console.log`, `debugger`, `TODO`, `FIXME`, mocks, secrets,
   unguarded Turkish strings, long dashes and emoji.
2. Review of every React effect for dependencies, cleanup and race conditions.
3. Review of every async store action for error handling and state consistency.
4. Review of Rust command boundaries for panic paths, input validation and
   error message leakage.
5. Review of the close, lock, tray and launch-code paths end to end.
6. Re-run of every quality gate after each fix batch.

The audit ran in four loops. Loop 1 found structural issues, loop 2 found state
and lifecycle defects, loop 3 confirmed that fixes introduced no regressions, and
loop 4 re-verified the native startup path during a live application run. The
final loop produced zero findings.

---

## 2. Findings Summary

| ID | Area | Severity | Status |
| --- | --- | --- | --- |
| F-01 | Preference store exposed 15 duplicated setters | Medium | Fixed |
| F-02 | NavRail rendered the same label in both branches | Low | Fixed |
| F-03 | Close dialog used inline layout and missed persistence | Medium | Fixed |
| F-04 | Unguarded Turkish error in project store | High | Fixed |
| F-05 | Turkish-only diff column fallbacks | Low | Fixed |
| F-06 | Search field hardcoded Turkish and Ctrl+F missed the input | Medium | Fixed |
| F-07 | Cloud autosync dropped changes during an in-flight write | High | Fixed |
| F-08 | Panic path through `existing.unwrap()` in cloud sync | High | Fixed |
| F-09 | Tray Lock did not notify the frontend | High | Fixed |
| F-10 | Alt+F4 bypassed the Ask close policy | Medium | Fixed |
| F-11 | Locked vault kept document metadata in memory | Medium | Fixed |
| F-12 | Dead settings modal state in dialog store | Low | Fixed |
| F-13 | Leftover `mod.rs.new` file in the Rust tree | Low | Fixed |
| F-14 | Missing `common.clearSearch` translation key | Low | Fixed |
| F-15 | Non-English error strings in Rust services | Medium | Fixed |
| F-16 | Duplicate cloud status CSS blocks | Low | Fixed |
| F-17 | Accessibility scale applied without clamping review | Low | Verified |
| F-18 | Startup registry sync printed a console error when the key was absent | Low | Fixed |

---

## 3. Detailed Findings and Fixes

### F-01 - Duplicated preference setters

**File:** `src/stores/usePreferencesStore.ts`

The store declared 15 near-identical setters (`setTheme`, `setLanguage`,
`setCustomAccent`, and so on). Most were unused. The duplication made it easy to
update the store without persisting, and it confused the persistence path.

Before:

```ts
interface PreferencesState extends AppSettings {
  setTheme: (theme: ThemeType) => void;
  setLanguage: (language: Language) => void;
  // ...13 more setters
  updateSettings: (settings: Partial<AppSettings>) => void;
}
```

After:

```ts
interface PreferencesState extends AppSettings {
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  ...defaultSettings,
  updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
}));
```

All call sites now go through `updateSettings` or `persistSettingsPatch`, so a
local change and its disk write cannot drift apart by accident.

---

### F-02 - Duplicate NavRail render branch

**File:** `src/components/layout/NavRail.tsx`

Both sides of a conditional rendered the same element. The expanded state is
already handled by CSS classes.

Before:

```tsx
{expanded ? (
  <span className="rail-item-label">{t(labelKey)}</span>
) : (
  <span className="rail-item-label">{t(labelKey)}</span>
)}
```

After:

```tsx
<span className="rail-item-label">{t(labelKey)}</span>
```

The collapsed rail hides labels through CSS, which keeps the accessibility tree
stable and removes a pointless branch.

---

### F-03 - Close dialog layout and persistence

**File:** `src/components/layout/CloseActionModal.tsx`

The dialog used heavy inline styles, read the whole preference store, and
persisted "remember my choice" through the old setter path. It also referenced a
`closeModal.recommended` key that did not exist.

Before:

```ts
const preferences = usePreferencesStore();
const setCloseAction = usePreferencesStore((s) => s.setCloseAction);
// ...
if (rememberChoice) setCloseAction(selectedAction);
```

After:

```ts
const { t } = useTranslation();
// ...
if (rememberChoice) {
  await persistSettingsPatch({ closeAction: action }).catch(() => {});
}
onClose();
if (action === "minimize-to-tray") {
  await windowApi.hideToTray();
} else {
  await windowApi.closeOrExit();
}
```

The dialog now uses `close-modal-*` classes in `src/styles/app.css`, exposes a
`radiogroup` with `aria-checked`, and has a localized "Recommended" badge.

---

### F-04 - Unguarded Turkish error string

**File:** `src/stores/useProjectStore.ts`

The delete failure path returned Turkish text to every locale, including English.

Before:

```ts
const msg = (err as { message?: string })?.message || "Proje silinemedi.";
```

After:

```ts
const msg = (err as { message?: string })?.message || "Project could not be deleted.";
```

All other store fallbacks were rechecked with the same rule: user-facing text
must come from the dictionary or be English.

---

### F-05 - Turkish-only diff fallbacks

**File:** `src/features/env-documents/EnvDiffModal.tsx`

When a document had no filename, the diff header fell back to Turkish labels for
every locale.

Before:

```tsx
<th>{leftDoc?.filename || "Dosya 1"}</th>
<th>{rightDoc?.filename || "Dosya 2"}</th>
```

After:

```tsx
<th>{leftDoc?.filename || (language === "tr" ? "Dosya 1" : "File 1")}</th>
<th>{rightDoc?.filename || (language === "tr" ? "Dosya 2" : "File 2")}</th>
```

---

### F-06 - Search field localization and shortcut target

**Files:** `src/components/primitives/SearchField.tsx`, `src/app/App.tsx`

The search primitive defaulted to Turkish (`Ara...`) and an English clear label,
and `Ctrl+F` looked for `input[type='search']` while the field is `type="text"`.
The shortcut did nothing.

Before:

```tsx
placeholder = "Ara...",
ariaLabel = "Ara",
// ...
aria-label="Clear search"
```

```ts
document.querySelector<HTMLInputElement>("input[type='search']")?.focus();
```

After:

```tsx
const { t } = useTranslation();
const resolvedPlaceholder = placeholder ?? t("common.search");
const resolvedLabel = ariaLabel ?? t("common.search");
// ...
<input type="text" data-search-field aria-label={resolvedLabel} ... />
<IconButton aria-label={t("common.clearSearch")} ... />
```

```ts
document.querySelector<HTMLInputElement>("input[data-search-field]")?.focus();
```

A new `common.clearSearch` key was added to English and Turkish, and all 73
locales were regenerated.

---

### F-07 - Cloud autosync dropped changes during a write

**File:** `src/lib/cloud-autosync.ts`

A store change that arrived while `syncNow` was running hit `if (running) return`
and was lost. The next change would only be written after another edit.

Before:

```ts
const flush = async () => {
  if (running) return;
  running = true;
  try { /* sync */ } finally { running = false; }
};
```

After:

```ts
const flush = async () => {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  try { /* sync */ } finally {
    running = false;
    if (pending) {
      pending = false;
      schedule();
    }
  }
};
```

The pending flag guarantees a follow-up write after the current one completes.

---

### F-08 - Panic path in cloud sync

**File:** `src-tauri/src/cloud/sync.rs`

The empty-local guard checked `existing.as_ref().map(...)` and then called
`existing.unwrap()`. The value was logically present, but a future refactor could
break that invariant and panic inside a Tauri command.

Before:

```rust
if existing.as_ref().map(|s| s.summary.projects > 0).unwrap_or(false) {
    return Ok(SyncOutcome {
        exported_at: existing.unwrap().exported_at,
        // ...
    });
}
```

After:

```rust
if let Some(snapshot) = existing.as_ref() {
    if snapshot.summary.projects > 0 {
        return Ok(SyncOutcome {
            exported_at: snapshot.exported_at.clone(),
            // ...
        });
    }
}
```

No `unwrap` remains on a user-controlled data path. The repository scan now shows
`unwrap` and `expect` only inside `#[cfg(test)]` code and in the Tauri entry point.

---

### F-09 - Tray Lock left the UI unlocked

**File:** `src-tauri/src/lib.rs`

The tray menu locked the Rust session and focused the window, but it did not tell
the webview. The UI kept rendering the unlocked shell until the user navigated or
restarted.

Before:

```rust
"lock" => {
    let vault_service = app.state::<Arc<VaultService>>();
    vault_service.lock_vault();
    if let Some(window) = app.get_webview_window("main") { /* focus */ }
}
```

After:

```rust
"lock" => {
    let vault_service = app.state::<Arc<VaultService>>();
    vault_service.lock_vault();
    let _ = app.emit("lock-vault", ());
    if let Some(window) = app.get_webview_window("main") { /* focus */ }
}
```

`App.tsx` now refreshes the vault state when it receives the event.

---

### F-10 - Alt+F4 bypassed the Ask close policy

**File:** `src-tauri/src/lib.rs`, `src/app/App.tsx`

`CloseRequested` only handled `minimize-to-tray`. With `closeAction: "ask"`, the
custom close button opened the dialog but Alt+F4 closed the process outright.

Before:

```rust
if matches!(action, CloseAction::MinimizeToTray) {
    api.prevent_close();
    let _ = window.hide();
}
```

After:

```rust
match settings.close_action {
    CloseAction::MinimizeToTray => {
        api.prevent_close();
        let _ = window.hide();
    }
    CloseAction::Ask => {
        api.prevent_close();
        let _ = window.emit("close-requested", ());
    }
    CloseAction::CloseApp => {}
}
```

The shell listens for `close-requested` and opens the same dialog, so every close
path follows one policy. Explicit exit uses `app.exit(0)` and is not intercepted.

---

### F-11 - Locked vault kept document metadata in memory

**File:** `src/app/App.tsx`

On lock, the editor document was closed, but the document list remained in the
`useEnvStore` until the next project load.

Before:

```ts
useEffect(() => {
  if (vaultState !== "unlocked") closeEditor();
}, [vaultState, closeEditor]);
```

After:

```ts
useEffect(() => {
  if (vaultState !== "unlocked") {
    closeEditor();
    useEnvStore.getState().clearDocuments();
  }
}, [vaultState, closeEditor]);
```

This applies to manual lock, `Ctrl+L`, tray lock and backend-driven lock.

---

### F-12 - Dead settings modal state

**File:** `src/stores/useDialogStore.ts`

Settings became a full-page view, but the store still exposed
`isSettingsOpen`, `settingsInitialView`, `openSettings`, `openAboutVellium`,
`closeSettings` and the `SettingsViewType` union. Nothing read them.

Removed the state, the actions and the type. Settings navigation now lives only in
`useNavigationStore`.

---

### F-13 - Leftover build file

**File:** `src-tauri/src/platform/mod.rs.new`

A stale editor artifact remained in the Rust tree. It was deleted. A full scan for
`*.new`, `*.bak`, `*.orig` and `*.tmp` now returns nothing.

---

### F-14 - Missing translation key

**Files:** `src/i18n/locales/en.ts`, `src/i18n/locales/tr.ts`

`SearchField` needed a localized "Clear search" label. The key was added to both
source dictionaries, then the 71 generated dictionaries were rebuilt.

Before:

```text
i18n parity check passed for 73 locales and 572 keys.
```

After:

```text
i18n parity check passed for 73 locales and 573 keys.
```

---

### F-15 - Non-English error strings in Rust

**Files:** `src-tauri/src/**/*.rs`

Several `AppError` messages were Turkish. They could surface in English and every
other locale. All service and command error strings were rewritten in English.
A non-ASCII scan of `src-tauri/src` now returns zero matches outside of test data.

Example:

```rust
// Before
AppError::Custom("Kasa kilitli.".into())

// After
AppError::Custom("Vault is locked.".into())
```

The frontend maps known error messages to localized toasts where a friendly
message exists, and otherwise shows the English diagnostic.

---

### F-16 - Duplicate cloud CSS

**File:** `src/styles/app.css`

`.cloud-status`, `.cloud-dot` and `.cloud-actions` were declared twice. The second
block silently overrode the first. The duplicate was removed and the remaining
rules were kept in the cloud section of the stylesheet.

---

### F-17 - Zoom clamping

**File:** `src/lib/theme.ts`

`applyUiScale` sets `--ui-scale`, while the settings UI restricts choices to a
fixed list. The helper also clamps input to 80 through 200 percent and rounds it,
which protects against a corrupted persisted value.

```ts
const clamped = Math.min(200, Math.max(80, Math.round(scale)));
document.documentElement.style.setProperty("--ui-scale", String(clamped / 100));
```

Verified that `#root` divides its own box by the same factor before applying
`zoom`, so a 200 percent interface fills the window instead of overflowing it.

---

### F-18 - Startup registry sync printed a console error

**File:** `src-tauri/src/platform/system.rs`

`set_startup(false)` used `Command::status()`, which inherits the child streams.
Disabling an autostart value that did not exist made `reg delete` write
`ERROR: The system was unable to find the specified registry key or value.` to the
application console on every launch where the global shortcut was enabled.

Before:

```rust
let status = Command::new("reg")
    .args(["add", RUN_KEY, "/v", RUN_VALUE, "/t", "REG_SZ", "/d", &value, "/f"])
    .status()?;
if !status.success() {
    return Err(AppError::Custom("STARTUP_REGISTRATION_FAILED".into()));
}
// ...
Command::new("reg")
    .args(["delete", RUN_KEY, "/v", RUN_VALUE, "/f"])
    .status()?;
```

After:

```rust
let output = Command::new("reg")
    .args(["add", RUN_KEY, "/v", RUN_VALUE, "/t", "REG_SZ", "/d", &value, "/f"])
    .output()?;
if !output.status.success() {
    return Err(AppError::Custom("STARTUP_REGISTRATION_FAILED".into()));
}
// ...
let _ = Command::new("reg")
    .args(["delete", RUN_KEY, "/v", RUN_VALUE, "/f"])
    .output();
```

`output()` captures both streams, so a missing value or a group policy block is
silent, and a failed registration still surfaces as a typed application error.

---

## 4. Additional Checks

### 4.1 Hook dependencies and effects

Every `useEffect` in `src/app`, `src/features` and `src/components` was reviewed:

- All intervals and timeouts are cleared in the returned cleanup.
- Event listeners are removed with the same function reference.
- Async listeners use a `cancelled` flag so a late promise cannot register a
  listener after unmount.
- Store actions are selected individually, which avoids unnecessary rerenders and
  keeps dependency arrays stable.

### 4.2 Mocks and development artifacts

`src/dev-preview.tsx` and `preview.html` are an isolated screenshot harness. They
are not referenced by `index.html`, are not part of the production bundle, and
exist only to render documentation screenshots without a native shell. No mock
paths exist in production code.

### 4.3 Logging and secrets

- Zero `console.log`, `console.debug` or `debugger` statements.
- `console.warn` appears only behind `import.meta.env.DEV` in window fallbacks.
- Zero hardcoded secrets, tokens or passwords in source.
- Zero telemetry, analytics or remote endpoints.

### 4.4 Typography

`scripts/check-typography.mjs` scans `src`, `src-tauri/src`, `scripts`, `docs` and
`README.md`. It bans the em dash, the en dash and emoji, while allowing the
copyright, registered and trademark marks.

Result: `Typography check passed: no long dashes and no emoji.`

### 4.5 Version consistency

`scripts/check-version-consistency.js` verifies three files:

```text
tauri.conf.json : 1.0.0
package.json    : 1.0.0
Cargo.toml      : 1.0.0
```

### 4.6 Installer

NSIS build completed with a language selector and more than 50 languages. The
artifact is `src-tauri/target/release/bundle/nsis/Env Vault_1.0.0_x64-setup.exe`
at approximately 4.0 MiB. Tauri reported custom-message translation warnings for
some NSIS languages; these are upstream NSIS message gaps, not installer defects,
and the language selector still works for all listed languages.

---

## 5. Final Gate Results

| Gate | Command | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | 0 errors |
| Frontend tests | `npm test` | 6 files, 19 tests passed |
| Rust unit tests | `cargo test` | 29 passed |
| Rust integration tests | `cargo test` | 4 passed |
| Production build | `npm run build` | Pass, chunks split |
| i18n parity | `node scripts/check-i18n-keys.mjs` | 573 keys, 73 locales |
| Typography | `node scripts/check-typography.mjs` | Pass |
| Version consistency | `node scripts/check-version-consistency.js` | Pass |
| NSIS packaging | `npx tauri build --bundles nsis` | Artifact produced |

---

## 6. Residual Risks

| Risk | Mitigation |
| --- | --- |
| Machine-translated locales may read awkwardly | English fallback and a single source dictionary; translations can be replaced per locale without code changes |
| Cloud providers can delay file propagation | Recovery chain reads current, previous and dated backups; empty-vault guard prevents data loss |
| A future refactor could reintroduce a panic path | The scan for `unwrap`/`expect` outside tests is part of the release checklist |
| Windows-only validation | Platform code is behind `cfg` blocks; other targets are not claimed as supported in 1.0.0 |

No residual risk is rated high. All are documented product boundaries rather than
defects.

---

## 7. Conclusion

All findings from loops 1 and 2 were fixed and verified in loop 3. The final scan,
build and test run produced zero open findings and zero failing gates. Env Vault
1.0.0 is cleared for public release.

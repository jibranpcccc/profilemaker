# 📝 Project Backlog & Tech Debt

*This document tracks feature requests, optimizations, and known tech-debt gaps that were deferred from the v1.0 milestone.*

## 🚧 Unresolved Gaps (v1.0 Audit Tech Debt)

### Infrastructure & Bot Resilience
- [ ] **Proxy Support:** `ProfileSubmissionAssistant` relies heavily on standard connectivity. ENSP Mexico and Instituto Crecer appear to employ IP blocks. A proxy manager/rotation logic must be implemented inside `SettingsService` to bypass rate limits.
- [ ] **Human-like Delays:** Some modern JS frameworks (e.g. React implementations like MIT Open) natively flag immediate `.value` inputs as bot activity. Refactor `findInShadowDom` and `fillEl` to implement realistic, character-by-character typing delays (50-100ms) alongside the dispatch events.
- [ ] **Geezek API Rate Limiting:** Current execution can spam the Geezek Mail API at high concurrency (10+ threads). Introduce a 500ms jitter/delay between thread email creation calls to prevent throttling.

### Functional Enhancements
- [ ] **Domain Manager UI:** `DomainManagerView.xaml.cs` is currently a stub file. Build out the logic to allow users to visually manage `platform_dataset.json` (Add, Edit, Remove fields) directly from the application instead of raw text editing.
- [ ] **Domain Retry Queue:** Add a mechanism so that domains that fail dynamically (timeout, captcha exhausted) are placed into a pending secondary queue for a final retry pass at the end of execution.
- [ ] **Screenshot Evidence (ProofService):** While `ProofService` exists to handle snapshot captures, it hasn't been tightly integrated into the success hook of `RunAllSitesAsync`. We need it to snap a picture of exactly what the `BacklinkUrl` looks like right as Phase 5 triggers.
- [ ] **DataGrid Polish:** Add missing fields to `ObservableCollection<ProfileReportItem>` inside the Live Reports view—specifically `BacklinkStatus` (NOFOLLOW vs ACTIVE) tracking natively on the grid.

### Quality of Life & Automation
- [ ] **Nullability Warnings:** Fix remaining 23 CS86* nullable warnings across `BrowserWorkflowViewModel` compiler output to achieve 100% warning elimination.
- [ ] **Export Options:** Only `TXT` is functional. Wire up `CSV/Excel` exports inside `ReportingService` as initially outlined in the architecture draft.

# Global AI Development Rules

This file is the canonical cross-project rule set for AI-assisted development.

> **Repository = development memory. Chat = control plane.**

The user should not need to repeatedly paste project history, taskbooks, logs, or Worker reports between models. Durable rules and execution state belong in repositories; chat should carry goals, decisions, blockers, and concise results.

## 1. Roles

- **User:** sets goals, constraints, priorities, and final product decisions.
- **Strong model / primary agent:** handles requirement framing, architecture, high-risk decisions, complex debugging, task decomposition, and final review.
- **Worker / lower-cost capable model:** handles ordinary implementation, focused fixes, repetitive edits, routine debugging, tests, documentation, and code search.
- **Deterministic tools:** tests, build, lint, static checks, probes, exit codes, Git state, and smoke tests decide PASS/FAIL whenever possible.
- **Repository:** persistent memory and handoff medium between agents and sessions.

Avoid making several models independently re-plan or re-understand the same task.

## 2. Match process to task size

### Small / isolated task

Use:

`locate → change → focused verify → report`

Do not create taskbooks, handoff documents, new abstractions, or long plans for trivial fixes.

### Medium task

Use a compact repo-owned task specification when that reduces ambiguity. Read only relevant files and verify the affected path.

### Large / long-lived / cross-system task

Use repository-native task/state/handoff artifacts and explicit acceptance criteria so another model can continue without reconstructing chat history.

## 3. Repository-first workflow

For medium/large work, store the execution contract in the repository rather than repeatedly pasting it into chat.

A useful task package contains:

- objective;
- constraints;
- deterministic acceptance criteria;
- expected/allowed scope;
- verification commands;
- known blockers or state that must not be redone.

Stable rules belong in `AGENTS.md` or a project rules file. Temporary implementation details belong in a task file. Keep stable rule files stable where possible to improve prompt-cache reuse.

Do not create multiple state files that repeat the same facts. If one current-task file already handles handoff well, reuse it.

## 4. New-session read order

A new agent/session should not receive a giant history dump.

Default order:

1. open the canonical repository/project path;
2. read `AGENTS.md` or the project rule entry point;
3. read the current task/state pointer;
4. read a dedicated handoff only if it adds non-duplicated information;
5. check branch, HEAD, `git status`, and relevant diff;
6. read only files required for the current task;
7. if an active Worker/job/session may exist, query/resume it before creating another.

Do not scan the whole repository, all documentation, full Git history, or old chats unless the current state is genuinely ambiguous.

If the taskbook already exists in the repository, do not paste its body into chat or the Worker prompt again.

## 5. Research and reuse before building

Before writing a substantial subsystem from scratch:

1. inspect the existing project for a validated implementation/pattern;
2. check authoritative documentation when relevant;
3. search GitHub or mature libraries/templates when reuse could materially reduce work;
4. evaluate license, maintenance state, dependency cost, security, and compatibility;
5. reuse/adapt the smallest proven component that fits.

Preference:

`existing validated project pattern > small mature dependency/pattern > new custom subsystem`

Do not import an entire framework/repository for one small reusable idea.

## 6. Delegate by cost and capability

Use expensive reasoning only where it adds value.

Strong model owns:

- architecture and high-risk decisions;
- ambiguous requirements;
- hard debugging;
- cross-system integration;
- conflict resolution;
- final review.

Worker owns:

- ordinary implementation;
- routine bug fixes;
- repetitive edits;
- compile/lint/test fixes with clear diagnostics;
- documentation;
- deterministic verification work.

If a Worker produced a reasonable diff and objective verification passed, review it rather than reimplementing it “for safety.”

## 7. One coherent task, one Worker job when possible

The initial Worker task should include the acceptance criteria it can reasonably know. Avoid splitting one predictable task into several independent jobs that each need to reread context.

When a follow-up is necessary, resume the same job/session if possible and pass only the new error or missing requirement plus existing state.

A normal Worker startup instruction should be short, e.g.:

`Pull latest state, read project rules/current task, execute and verify, update state, commit/push, return only result/commit/tests/blocker.`

## 8. Resume instead of restart

A timeout, disconnected UI, or missing result message does not imply that the underlying job failed.

Before redispatching:

- check the existing process/job/session;
- check task fingerprint and current HEAD;
- inspect partial outputs and repository state;
- resume from checkpoint/handoff when possible.

Do not start duplicate side-effectful work simply because the outer call timed out.

## 9. Deterministic verification is authoritative

Model prose is not the success condition.

Prefer objective signals such as:

- expected diff exists;
- test/build/lint command exits 0;
- runtime/smoke behavior is observed;
- changed files stay within expected scope;
- safety boundaries are preserved.

Once acceptance criteria pass, stop model calls. Do not spend another model call explaining why passing deterministic verification probably passed, and do not expand scope into unrelated cleanup.

## 10. Context and log hygiene

Feed models high-information-density evidence.

For failures, prefer:

- failed command;
- exit code;
- concise core error/stack;
- relevant surrounding lines;
- filtered `head` / `tail` / `grep` output;
- affected diff/file.

Avoid dumping huge build logs, full generated files, large JSON payloads, or thousands of successful test lines into context.

Prefer targeted search (`rg`, known paths, symbols) over uncontrolled recursive reading. Prefer diff/hunks over rereading unchanged files.

One identical unexpected failure may be retried if a transient issue is plausible. Repeated deterministic failure should trigger diagnosis/repair or a changed method rather than identical retries.

## 11. Incremental review

Default review order:

1. `git diff --stat`;
2. changed filenames and relevant hunks;
3. deterministic verification results;
4. current task/state;
5. expand into full files or wider context only if risk justifies it.

Review the delta, not the whole project again.

If the user says “review the latest commit / latest result / continue,” retrieve state and diffs directly from the repository. Do not ask the user to copy long Worker reports between models.

## 12. Git/GitHub durability

For versioned development work, coherent progress should be committed and pushed when the task or project workflow expects persistence.

Do not force-push, hard-reset over valid user/remote work, or take destructive Git shortcuts merely to simplify synchronization.

If remote verification is part of acceptance, local success is not final until remote state is confirmed.

## 13. Current-state handoff

For long-lived work, maintain one compact current-state artifact such as `CURRENT_TASK.md` or a project equivalent.

It should normally contain only:

- current goal;
- branch and last known good commit;
- already done/verified work;
- active/recoverable Worker job/session if known;
- exact next step;
- explicit “do not redo” items;
- current blocker;
- pending human-only checks when applicable.

Do not paste large logs, full taskbooks, diffs, or source files into the state file.

## 14. Rule update policy

Durable workflow changes belong in the canonical rules source, not in remembered chat history.

Project-specific rules belong in that project's `AGENTS.md` or project workflow document. Feature-specific acceptance belongs in task/spec files. Current execution state belongs in the current-state file.

When a new durable rule overlaps an existing one, merge/edit the existing rule instead of endlessly appending near-duplicates.

## 15. Model-effort routing

Use the least expensive model/effort likely to complete the remaining work reliably.

- simple Git/text/isolated chores: lower-cost capable model;
- ordinary implementation/integration: normal strong model or capable Worker;
- high reasoning: hard debugging, architecture rescue, complex cross-system work.

Do not use a high-cost reasoning model for deterministic chores that scripts or a cheaper Worker can perform.

## 16. Autonomous execution / zero-question default

After a clear development goal is given, routine technical choices should normally be resolved by the agent.

Use:

`inspect → choose smallest reversible path → implement → verify → diagnose → repair → re-verify → commit/push when applicable → report`

Prefer:

1. smallest reversible change;
2. existing validated project patterns;
3. preservation of user data and stable branches;
4. deterministic verification over routine user confirmation.

Ask the user only when needed for a true blocker such as destructive/data-loss risk, unavailable credentials/signing/payment/authorization, irreversible external side effects, genuinely product-defining ambiguity, or exhausted safe technical fallbacks.

Host permission dialogs are separate and must not be bypassed.

## 17. Unattended / remote mode

When the user explicitly says they are away/unavailable or asks the agent to continue without intermediate confirmation, maximize safe progress instead of stopping for routine choices.

Continue automatable implementation, debugging, tests, builds, safe Git operations, state updates, and already-specified next phases.

If a required judgment is genuinely subjective and cannot be evaluated reliably, record it as a pending human check rather than inventing a PASS.

Human absence is not itself a blocker.

## 18. Reporting budget

Detailed work belongs in Git, task files, test artifacts, and logs. Chat reports should be concise and decision-oriented.

Default Worker completion report:

```text
PASS | FAIL
commit: <sha or none>
tests: <compact result>
blocker: <none or one key blocker>
```

Do not produce a second long natural-language copy of facts already present in the diff, commit, task file, or logs.

## 19. Token/context efficiency metric

Do not optimize only for the shortest individual prompt. Optimize for **total repeated understanding required to finish one accepted task**.

Eliminate these waste patterns:

- the same requirement explained to several models;
- the same repository repeatedly scanned;
- a repo-resident taskbook pasted into chat again;
- the same logs repeatedly reread;
- successful work summarized multiple times;
- a timed-out but still-running job started again;
- passing work followed by unnecessary model calls;
- strong models used for deterministic chores.

A healthy workflow normally has one authoritative task definition, one execution state, one Worker execution path, deterministic verification, and one diff-based final review.

## 20. Security

Never commit or echo API keys, access tokens, passwords, cookies, private signing material, or equivalent secrets. Use environment variables, secret stores, or project-approved credential mechanisms and redact sensitive logs.

---

**Final principle:** human sets the goal and final product decisions; strong model designs/reviews; Worker executes; deterministic tools verify; repository remembers.
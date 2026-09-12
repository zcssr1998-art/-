# AGENTS.md — Web Game

This repository is developed with AI coding agents. Treat this file as the default operating procedure for all work in this repo.

## 1. User / product-owner model

- The user is the product owner, not the implementation engineer.
- Convert natural-language requests into concrete engineering tasks yourself.
- Resolve routine implementation, debugging, dependency, and build decisions from the repository and tools instead of asking the user to do engineering triage.
- Prefer the smallest reversible implementation that advances the requested gameplay goal.
- Final status should be concise Chinese unless the user asks otherwise.

## 2. Definition of done

Never claim a gameplay feature is complete because the code compiles, the page loads, or the implementation looks correct by inspection.

A change is complete only when all applicable checks pass:

1. The game starts successfully.
2. The changed feature is exercised in a real browser/runtime.
3. Relevant controls are actually used.
4. Browser console/runtime errors are checked.
5. The player can complete the affected gameplay loop without a blocking defect.
6. The final report states what was changed and what was actually tested.

If real runtime testing is unavailable, explicitly say `implemented but not runtime-verified`.

## 3. Mandatory web-game iteration loop

For gameplay changes:

1. Inspect the existing control/state/update loop.
2. Make one coherent change.
3. Launch or refresh the game.
4. Send real player input.
5. Observe movement, collisions, state changes, UI, and console output.
6. Fix issues found.
7. Repeat until the relevant loop works end-to-end.

Do not make a large batch of speculative gameplay edits without intermediate playtesting.

## 4. Control quality is a first-class requirement

The game must support the control schemes advertised by the project.

For desktop, verify as applicable:

- WASD / keyboard movement;
- mouse-follow or pointer steering;
- pause/restart/action buttons;
- focus behavior after clicking UI;
- input responsiveness under rapid direction changes.

For mobile/touch, verify as applicable:

- virtual controls actually receive touch input;
- buttons are large enough and not blocked by browser UI;
- touch controls do not accidentally scroll/zoom the page;
- simultaneous movement/action input works if the design requires it;
- layout remains usable in portrait/landscape modes the game supports.

A visually present button that is not wired to gameplay is a blocking defect.

## 5. Snake-specific gameplay rules

For snake-like mechanics:

- Larger size must not automatically eliminate smaller opponents unless the design explicitly calls for it.
- Preserve counterplay: large snakes should still be able to make positioning mistakes and lose.
- Growth/evolution thresholds should modify the player's capabilities, presentation, or strategic options without erasing the core collision/counterplay loop.
- Test self-collision, opponent collision, edge/world collision, spawn behavior, growth, death/restart, and high-speed turning after related changes.
- Avoid control smoothing that creates noticeable input lag; responsiveness takes priority over ornamental motion.

## 6. Game-feel verification

Do not infer game feel from source code.

When changing movement/camera/animation:

- play long enough to perform repeated turns and recoveries;
- test low and high speed states;
- check acceleration/deceleration, steering response, camera follow, and visual feedback together;
- prefer responsive control over physically "correct" motion if the latter feels sluggish;
- look for jitter, tunneling, input buffering mistakes, and frame-rate-dependent behavior.

## 7. Scope and architecture discipline

- Prefer the smallest correct fix over a rewrite.
- Reuse existing systems before creating parallel abstractions.
- Do not introduce a framework merely for architectural neatness.
- First get the gameplay loop working; refactor after verification.
- Avoid speculative content not requested by the user.

## 8. UI / visual quality

- Do not accept a generic flat AI-prototype look.
- Favor readable, playful, dimensional presentation with coherent lighting/shadows/depth where consistent with the art direction.
- Maintain clear hierarchy, touch-safe controls, responsive layout, readable feedback, and meaningful animation.
- UI work is not complete until rendered and visually inspected when tools are available.

## 9. Debugging discipline

For a bug:

1. Reproduce the exact failure.
2. Identify the input/state transition involved.
3. Form a concrete hypothesis.
4. Make the smallest root-cause fix.
5. Re-run the exact failed scenario.
6. Add a regression test/check when practical.

Do not call a workaround a root-cause fix.

## 10. GitHub Actions / CI

- Inspect failing workflow logs yourself.
- Fix the cause rather than blindly retrying.
- Do not disable checks or remove tests to obtain a green build.
- Verify the relevant workflow passes before declaring success whenever possible.

## 11. Repository hygiene

- Never commit secrets, passwords, tokens, or private credentials.
- Avoid unrelated formatting churn.
- Do not commit generated build output unless intentionally tracked.

## 12. Agent handoff / reporting

Before finishing, report:

- **Changed:** what materially changed.
- **Verified:** what was actually launched/played/clicked/tested.
- **Result:** what now works.
- **Remaining risk:** real unverified paths or known limitations only.

Never say `done`, `fixed`, or `works` when the relevant gameplay path has not been verified.

## 13. Mini-game release version notice

For every user-visible WeChat Mini Game update:

- Update `minigame/src/version.js` in the same work batch.
- Increment `RELEASE.version` using `vX.Y.Z` format.
- Set `RELEASE.time` to the actual update time in Beijing time (UTC+8) and explicitly include `北京时间`.
- Keep `RELEASE.notes` concise and limited to material player-visible changes.
- The intro screen must always expose the current version badge; tapping it must open the in-game update notice.
- Keep the smoke test that opens and closes the release notice. A player-visible update is not complete if release metadata is stale or the notice is not clickable.
- Final reporting should tell the user the new version number so they can compare it with the version shown in WeChat after upload.

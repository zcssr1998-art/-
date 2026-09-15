# AGENTS.md — Web Game

This repository inherits the cross-project AI workflow from:

`https://github.com/zcssr1998-art/AI-Development-Rules/blob/main/GLOBAL_AI_RULES.md`

This file contains **web-game-specific** rules only. Rule precedence:

`explicit current user instruction > this AGENTS.md > GLOBAL_AI_RULES.md > agent defaults`

## New-session read order

1. `AGENTS.md`
2. global `GLOBAL_AI_RULES.md`
3. current task/state file if present
4. current branch / HEAD / `git status` / relevant diff
5. only files required for the current task

Do not paste the global rulebook or repo-resident taskbooks into chat again.

## Runtime definition of done

A gameplay feature is not complete because the code compiles or the page loads.

When applicable:

1. game starts successfully;
2. changed feature is exercised in a real browser/runtime;
3. relevant controls are actually used;
4. browser console/runtime errors are checked;
5. affected gameplay loop can be completed without a blocking defect.

If runtime testing is unavailable, report `implemented but not runtime-verified`.

## Mandatory web-game iteration loop

For gameplay changes:

1. inspect the existing control/state/update loop;
2. make one coherent change;
3. launch/refresh the game;
4. send real player input;
5. observe movement, collisions, state changes, UI, and console output;
6. fix issues found;
7. repeat until the affected loop works end-to-end.

Do not make a large speculative batch of gameplay edits without intermediate playtesting.

## Control quality

For desktop, verify as applicable:

- WASD / keyboard movement;
- mouse-follow or pointer steering;
- pause/restart/action buttons;
- focus behavior after clicking UI;
- input responsiveness under rapid direction changes.

For mobile/touch, verify as applicable:

- virtual controls receive touch input;
- buttons are large enough and not blocked by browser UI;
- touch controls do not accidentally scroll/zoom;
- simultaneous movement/action input works when required;
- layout remains usable in supported orientations.

A visually present button that is not wired to gameplay is a blocking defect.

## Snake-specific gameplay rules

For snake-like mechanics:

- larger size must not automatically eliminate smaller opponents unless explicitly designed that way;
- preserve counterplay: large snakes should still be able to make positioning mistakes and lose;
- growth/evolution thresholds should modify capabilities, presentation, or strategic options without erasing the core collision/counterplay loop;
- test self-collision, opponent collision, edge/world collision, spawn behavior, growth, death/restart, and high-speed turning after related changes;
- avoid control smoothing that creates noticeable input lag; responsiveness takes priority over ornamental motion.

## Game-feel verification

When changing movement/camera/animation:

- perform repeated turns and recoveries;
- test low/high speed states;
- check acceleration/deceleration, steering response, camera follow, and visual feedback together;
- prefer responsive control over physically "correct" motion if the latter feels sluggish;
- look for jitter, tunneling, input-buffer mistakes, and frame-rate-dependent behavior.

Do not infer game feel from source code.

## UI / visual quality

- Do not accept a generic flat AI-prototype look.
- Favor readable, playful, dimensional presentation consistent with the art direction.
- Maintain clear hierarchy, touch-safe controls, responsive layout, readable feedback, and meaningful animation.
- UI work is not complete until rendered and visually inspected when tools are available.

## Mini-game release version notice

For every user-visible WeChat Mini Game update:

- update `minigame/src/version.js` in the same work batch;
- increment `RELEASE.version` using `vX.Y.Z` format;
- set `RELEASE.time` to the actual update time in Beijing time (UTC+8) and explicitly include `北京时间`;
- keep `RELEASE.notes` concise and limited to material player-visible changes;
- intro screen must expose the current version badge; tapping it must open the in-game update notice;
- keep the smoke test that opens/closes the release notice;
- final reporting should include the new version number.

## Reporting additions

Follow the global concise-reporting rule. Add only relevant browser/gameplay/control/UI verification and real remaining risk.

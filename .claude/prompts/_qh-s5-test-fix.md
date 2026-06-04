# Task: fix one test assertion for section 5 outline-color icon

In `src/app/dev/req-cards/page.test.tsx`, the test "renders outline-color group type chips with primary only for assembly" asserts (line ~83):
```
expect(chip?.querySelector(".lucide-users-round")).not.toBeNull();
```
The section-5 outline-color assembly chip now uses the `Users` glyph (same as "Своя группа"), not `UsersRound` — colour is the only distinguisher. Update that assertion to match the new behaviour:
```
expect(chip?.querySelector(".lucide-users")).not.toBeNull();
```
Only that line. Do not change anything else.

Verify: `bun run test:run -- src/app/dev/req-cards/page.test.tsx` passes (or full `bun run test:run`). Report the diff.

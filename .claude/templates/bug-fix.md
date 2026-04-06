# Template: bug-fix

**Persona:** Investigative/Exploratory. Read broadly. Trace the root cause. Question assumptions. Do not patch symptoms — find and fix the root cause.

---

## CONTEXT

Tech stack: {{TECH_STACK}}
Framework versions: {{VERSIONS}}
Working directory: {{WORKING_DIR}}

Bug description: {{BUG_DESCRIPTION}}
Symptom observed: {{SYMPTOM}}
Reproduction steps: {{REPRO_STEPS}}

Relevant file tree:
```
{{FILE_TREE}}
```

Patterns to match (from PATTERNS.md):
{{PATTERNS}}

---

## SCOPE

Branch: {{BRANCH}}
Worktree: {{WORKTREE_PATH}}
Responsibility: Find and fix the root cause of the bug described above.

Out of scope — do NOT touch:
{{OUT_OF_SCOPE}}

---

## TASKS

1. Read all files in scope fully before touching anything.
2. Write a failing regression test that reproduces the bug.
3. Confirm the test fails.
4. Identify root cause.
5. Implement the fix.
6. Confirm the regression test now passes.
7. Confirm no other tests regressed.
8. Commit.

---

## KNOWLEDGE

Prior bugs in this area (from ERRORS.md):
{{ERRORS}}

Anti-patterns to avoid (from ANTI_PATTERNS.md):
{{ANTI_PATTERNS}}

Intentional decisions (from DECISIONS.md):
{{DECISIONS}}

---

## RULES

- Read every file in your scope before modifying anything.
- Never assume structure. If a path doesn't exist, say so and stop.
- Write failing regression test FIRST → confirm failure → implement fix → confirm passing → commit.
- No code before a failing test. No exceptions.
- No workarounds. Fix the root cause, not the symptom.
- Commit as: [{{WORKTREE_NAME}}] task-N: description
- No TODOs in committed code.
- No console.logs in committed code.

---

## VERIFICATION

- [ ] Regression test passes: `{{TEST_COMMAND}}`
- [ ] All other tests still pass: `{{TEST_COMMAND}}`
- [ ] Type-check passes: `{{TYPECHECK_COMMAND}}`
- [ ] Linter clean: `{{LINT_COMMAND}}`
- [ ] No console.logs in source
- [ ] Root cause documented in commit message

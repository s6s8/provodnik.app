# Template: refactor

**Persona:** Conservative/Careful. Change structure, preserve behavior. Test obsessively. If in doubt, don't.

---

## CONTEXT

Tech stack: {{TECH_STACK}}
Framework versions: {{VERSIONS}}
Working directory: {{WORKING_DIR}}

Refactor goal: {{REFACTOR_GOAL}}
What must NOT change (behavior/API contract): {{PRESERVED_BEHAVIOR}}

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
Responsibility: {{RESPONSIBILITY}}

Out of scope — do NOT touch:
{{OUT_OF_SCOPE}}

---

## TASKS

{{NUMBERED_TASKS}}

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
- Run full test suite BEFORE starting — establish green baseline.
- Change structure only. Do not change behavior or public API.
- Run full test suite AFTER every meaningful change — not just at the end.
- No TODOs in committed code.
- No console.logs in committed code.
- Commit as: [{{WORKTREE_NAME}}] task-N: description
- If a test breaks, stop and diagnose before continuing.

---

## VERIFICATION

- [ ] All tests pass before refactor (baseline): `{{TEST_COMMAND}}`
- [ ] All tests pass after refactor: `{{TEST_COMMAND}}`
- [ ] Type-check passes: `{{TYPECHECK_COMMAND}}`
- [ ] Linter clean: `{{LINT_COMMAND}}`
- [ ] No console.logs in source
- [ ] Bundle size not increased: `{{BUNDLE_CHECK}}`
- [ ] Public API unchanged (no breaking changes)

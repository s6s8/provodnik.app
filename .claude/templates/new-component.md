# Template: new-component

**Persona:** Strict/Mechanical. Follow the spec exactly. No creativity. No extras.

---

## CONTEXT

Tech stack: {{TECH_STACK}}
Framework versions: {{VERSIONS}}
Working directory: {{WORKING_DIR}}

Relevant file tree:
```
{{FILE_TREE}}
```

Patterns to match (from PATTERNS.md):
{{PATTERNS}}

API documentation (from API_REFERENCE.md):
{{API_DOCS}}

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
- Write failing test FIRST → confirm failure → implement → confirm passing → commit.
- No code before a failing test. No exceptions.
- No hardcoded values. No workarounds. Build robust general-purpose solutions.
- Commit as: [{{WORKTREE_NAME}}] task-N: description
- No TODOs in committed code.
- No console.logs in committed code.
- Match the patterns in the PATTERNS section exactly.
- Do not repeat any error documented in the ERRORS section.

---

## VERIFICATION

- [ ] All tests pass: `{{TEST_COMMAND}}`
- [ ] Type-check passes: `{{TYPECHECK_COMMAND}}`
- [ ] Linter clean: `{{LINT_COMMAND}}`
- [ ] No console.logs in source
- [ ] Visual review: component renders correctly
- [ ] Bundle size not increased beyond threshold
- [ ] No hardcoded secrets or credentials

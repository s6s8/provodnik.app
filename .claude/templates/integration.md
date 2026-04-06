# Template: integration

**Persona:** Strict/Mechanical. Wire exactly what is specified. No extra coupling. Verify both sides independently first, then integration.

---

## CONTEXT

Tech stack: {{TECH_STACK}}
Framework versions: {{VERSIONS}}
Working directory: {{WORKING_DIR}}

System A: {{SYSTEM_A}} — {{SYSTEM_A_DESCRIPTION}}
System B: {{SYSTEM_B}} — {{SYSTEM_B_DESCRIPTION}}
Integration goal: {{INTEGRATION_GOAL}}

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
- Verify System A independently, System B independently, then integration.
- No hardcoded values.
- Commit as: [{{WORKTREE_NAME}}] task-N: description
- No TODOs in committed code.
- No console.logs in committed code.

---

## VERIFICATION

- [ ] Unit tests pass: `{{TEST_COMMAND}}`
- [ ] Integration tests pass: `{{INTEGRATION_TEST_COMMAND}}`
- [ ] Type-check passes: `{{TYPECHECK_COMMAND}}`
- [ ] Linter clean: `{{LINT_COMMAND}}`
- [ ] No console.logs in source
- [ ] No hardcoded secrets or credentials
- [ ] Both systems still work independently

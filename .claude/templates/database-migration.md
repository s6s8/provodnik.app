# Template: database-migration

**Persona:** Strict/Mechanical. Migrations are irreversible in production. Be exact. Verify reversibility.

---

## CONTEXT

Tech stack: {{TECH_STACK}}
ORM/DB framework: {{DB_FRAMEWORK}}
Working directory: {{WORKING_DIR}}

Migration goal: {{MIGRATION_GOAL}}
Schema changes: {{SCHEMA_CHANGES}}

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
- Write the UP migration AND the DOWN migration. Every migration must be reversible.
- Write failing test FIRST → confirm failure → implement → confirm passing → commit.
- No code before a failing test. No exceptions.
- Never drop columns or tables without confirming they are unused.
- Commit as: [{{WORKTREE_NAME}}] task-N: description
- No TODOs in committed code.
- No console.logs in committed code.

---

## VERIFICATION

- [ ] All tests pass: `{{TEST_COMMAND}}`
- [ ] Type-check passes: `{{TYPECHECK_COMMAND}}`
- [ ] Linter clean: `{{LINT_COMMAND}}`
- [ ] Migration runs cleanly: `{{MIGRATE_UP_COMMAND}}`
- [ ] Migration rolls back cleanly: `{{MIGRATE_DOWN_COMMAND}}`
- [ ] Schema validation passes
- [ ] Integration tests pass
- [ ] No hardcoded secrets or credentials

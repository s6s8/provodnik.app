# Template: test-backfill

**Persona:** Adversarial. Try to break the code. Edge cases. Null inputs. Race conditions. Empty arrays. Max values. Concurrent access. Don't just test the happy path.

---

## CONTEXT

Tech stack: {{TECH_STACK}}
Test framework: {{TEST_FRAMEWORK}}
Working directory: {{WORKING_DIR}}

Code under test: {{CODE_UNDER_TEST}}
Current coverage: {{CURRENT_COVERAGE}}
Coverage target: {{COVERAGE_TARGET}}

Relevant file tree:
```
{{FILE_TREE}}
```

Testing patterns (from PATTERNS.md):
{{TEST_PATTERNS}}

Existing test example (follow this style exactly):
```
{{EXISTING_TEST_EXAMPLE}}
```

---

## SCOPE

Branch: {{BRANCH}}
Worktree: {{WORKTREE_PATH}}
Responsibility: Add tests for {{CODE_UNDER_TEST}} — do NOT modify the source code.

Out of scope — do NOT touch source files:
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

---

## RULES

- Do NOT modify source files. Tests only.
- Read the source fully before writing any tests.
- Follow the assertion style of the existing test example above exactly.
- Test: happy path, error cases, edge cases (empty, null, max, concurrent).
- No TODOs in committed code.
- Commit as: [{{WORKTREE_NAME}}] task-N: description

---

## VERIFICATION

- [ ] New tests pass: `{{TEST_COMMAND}}`
- [ ] All existing tests still pass: `{{TEST_COMMAND}}`
- [ ] Coverage increased to target: `{{COVERAGE_COMMAND}}`
- [ ] Linter clean: `{{LINT_COMMAND}}`
- [ ] No source files modified (test files only)

# OVERRIDES — tactics only (never rails)

- O-1: Sweep tasks (T-34, T-36) may be committed in per-directory sub-commits under the same T-id when the file count exceeds ~30. Rails unchanged: green + clean between commits.
- O-2: Screenshot proof is captured only for routes a task actually touches (not the full 63×3 matrix) until T-41, to keep the loop moving. T-41 still runs the broad capture.

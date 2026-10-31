# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the "Label in our tracker" column to match whatever vocabulary you actually use.

## Extra labels (for filtering)

Beyond the triage role, tag every ticket with labels from these groups so it can be filtered with `gh issue list --label ...`. Create a new label (`gh label create`) when no existing one fits; reuse before inventing.

| Group    | Labels                                                                                                  | Rule                 |
| -------- | ------------------------------------------------------------------------------------------------------- | -------------------- |
| Type     | `bug`, `enhancement`, `documentation`, `chore`                                                          | exactly one          |
| Scope    | `mvp`, `phase-2`                                                                                        | exactly one          |
| Page     | `page:01` … `page:10` (spec §2)                                                                         | zero or more         |
| Area     | `area:audio`, `area:recording`, `area:game`, `area:navigation`, `area:state`, `area:ui`, `area:assets`  | one or more          |
| Status   | `status:in-progress`, `status:blocked`                                                                  | zero or one, see below |

## Label lifecycle

Labels move as the ticket moves. Update them at each step:

- **Start implementing**: remove `ready-for-agent` / `ready-for-human`, add `status:in-progress`.
- **Blocked**: add `status:blocked`, comment with what blocks it; remove it once unblocked.
- **Done (PR merged / work complete)**: remove `status:*`, then close the issue with a comment.
- **Won't do**: remove `status:*` and readiness labels, add `wontfix`, close.
- Fix Type / Page / Area labels whenever implementation shows the original tags were wrong.

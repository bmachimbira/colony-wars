---
name: balance
description: Review and adjust game balance values (HP, speed, timers, counts)
user_invocable: true
---

# Balance Check

Review current game balance values against the design spec and suggest or apply adjustments.

## Steps

1. Read GAME_DESIGN.md for intended balance values (section 4-8)
2. Read index.html and extract all current balance constants
3. Compare current values against spec
4. List any discrepancies
5. If the user provided specific balance changes, apply them
6. Otherwise, present a summary table of current values vs spec values

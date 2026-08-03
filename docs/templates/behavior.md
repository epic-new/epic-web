# [Behavior Name]

[One paragraph describing the behavior in user-facing terms.]
Directory: `app/[page]/behaviors/[behavior-name]/`

## Rules

### [Rule Name]
- When:
  - [Condition]
  - [Condition]
- Then:
  - [Outcome]
  - [Outcome]

### [Rule Name]
- When:
  - [Condition]
- Then:
  - [Outcome]

## Scenarios

### [Scenario Name]

#### PreDB
[table-name]:
col_a, col_b, col_c
1, foo, bar

[table-name]:
col_a, col_b
1, baz

#### Steps
* Act: [User or system performs an action that changes state]
* Act: [Another action]
* Check: [Observable result in UI / API response]
* Check: [Observable result in database / derived state]

#### PostDB
[table-name]:
col_a, col_b, col_c
1, foo, bar
2, new, row

### [Scenario Name — Edge Case]

#### PreDB
[Optional CSV tables as needed]

#### Steps
* Act: [Trigger the edge case]
* Check: Error "[expected message]" is shown
* Check: No new records are created

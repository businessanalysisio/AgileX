# Northline — Project & Task Governance

Web app for the class project described in the Project & Task Governance Platform SRS. It is a role-based demo: tasks, blockers, evidence, conditional scope, a timeline, access administration, and auditable readiness decisions.

## Run locally

1. `npm install`
2. `npm run dev`

Sign in as one of the demo accounts. No password and no API key.

| Account | What to try |
| --- | --- |
| Minh Pham | PM dashboard across Harbor CRM and Clinic Portal |
| Hoa Le | Team lead scoped to her Harbor deliverables. Direct link `#/tasks/t-h04` is denied |
| Khoa Dang | Clinic lead. Does not see the lab interface task |
| An Nguyen | Can update tasks he owns. Updating H-03 is rejected |
| Lan Vo | Invite, assign roles, revoke access, deactivate |
| Que Nguyen | Pending invitation |
| Duc Phan | Deactivated. Cannot sign in. His comment remains on H-01 |

Files attached as evidence are stored as name, size, and type in this demo. There is no object store behind the upload control.

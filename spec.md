# HotBox Marketing

## Current State
- Three-tab app: Cold Calls, Scripts
- Header shows "HotBox Marketing" with subtitle "Cold Call Tracker"
- Cold Calls tab: log, edit, delete calls with status tracking and stats
- Scripts tab: create/edit/delete scripts organized by category (category filter pills)
- Backend: Motoko actor with Script CRUD; cold calls stored in frontend localStorage via useColdCalls hook

## Requested Changes (Diff)

### Add
- New "Clients" tab (third tab, alongside Cold Calls and Scripts)
- Backend: ClientGroup entity with id, name, description (optional), createdAt
- Backend: Client entity with id, groupId, name, company (optional), phone (optional), email (optional), notes (optional), createdAt
- Backend CRUD: addClientGroup, getClientGroups, updateClientGroup, deleteClientGroup
- Backend CRUD: addClient, getClients, getClientsByGroup, updateClient, deleteClient
- Frontend Clients section:
  - List of collapsible groups, each with a header (group name + optional description) and a list of client entries inside
  - Each group can be expanded/collapsed (accordion-style)
  - Add Group button (header CTA when on Clients tab)
  - Inside each group: list of clients with name, company, phone, email, notes; edit and delete per client
  - Add Client button inside each group
  - Edit and delete for groups
  - Empty state when no groups exist

### Modify
- Header subtitle "Cold Call Tracker" -> remove entirely (no subtitle shown)
- Main tab state type extended to include "clients"
- Header CTA dynamically shows the right action button per active tab (Log Call / New Script / Add Group)

### Remove
- The "Cold Call Tracker" subtitle text under "HotBox Marketing" in the header

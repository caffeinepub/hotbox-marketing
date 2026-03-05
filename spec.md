# HotBox Vault

## Current State
- Three main tabs: Cold Calls, Scripts, Future Clients
- Cold Calls tab: shows a stats section, a filterable table of calls, and an inline "Future Clients" section below
- Cold call entries stored in localStorage via `useColdCalls` hook; statuses include voicemail, noAnswer, callback, notInterested, interested
- Future Clients / Clients tab: group-based system with collapsible group panels, each group has a list of clients with name/company/phone/email/notes
- Scripts tab: card grid of call scripts with category filtering
- No "Purchased" call status; no dedicated "Clients" tab (the existing "Future Clients" tab serves a different purpose)
- No hosting checkbox on any client record

## Requested Changes (Diff)

### Add
- New `purchased` value to `CallStatus` enum in `useColdCalls.ts`
- Status config entry for "Purchased" (distinct color, e.g. purple/violet)
- "Purchased" section below the calls table in the Cold Calls tab — shows all cold call entries where status === purchased, in a styled list/table with all their fields
- New "Clients" main nav tab (separate from "Future Clients")
- Clients tab shows all purchased cold calls, each rendered as a card/row with: contact name, company, phone, call date, notes — plus a checkbox labeled "Hosting?" on the far right
- Hosting checkbox state stored in localStorage (a separate map of callId -> boolean)
- When a cold call is marked as "Purchased" (or edited to Purchased), it automatically appears in both the Purchased section and the Clients tab

### Modify
- `CallStatus` enum: add `purchased = "purchased"`
- `STATUS_CONFIG`: add purchased entry
- `STATUS_ORDER`: add purchased to the filter list
- Main tab state type: extend to include `"new_clients"` (or a new tab value like `"purchased_clients"`)
- Header CTA: no special action needed on the new Clients tab (or show nothing/a note)
- Cold Calls tab: add "Purchased" section below the calls table (and above or below Future Clients)
- Stats grid: optionally add a "Purchased" count card

### Remove
- Nothing removed

## Implementation Plan
1. Add `purchased` to `CallStatus` enum and update STATUS_CONFIG + STATUS_ORDER in App.tsx and useColdCalls.ts
2. Add a `useHostingState` hook (localStorage) to track hosting checkbox per cold call ID
3. In the Cold Calls tab, add a "Purchased" section below the calls table that filters entries by `status === purchased` and renders them in a table/list
4. Add a new "Clients" tab to the main nav (value: `"purchased_clients"`)
5. Build a `ClientsTab` component that reads all cold call entries filtered to purchased, renders each row with all info fields + a "Hosting?" checkbox on the far right wired to `useHostingState`
6. Update the header CTA to handle the new tab (no button, or neutral state)
7. Validate and deploy

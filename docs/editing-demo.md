# Editing and presenting the demo

## During your presentation

1. Open the live app and choose **New session**.
2. As Digger / Site Manager, drop a site photo into **Talk to Bower**, or use the + button. The three
   updates appear automatically.
3. Expand **Edit update** in any of the three cards to change its text. The Team,
   Client and Instagram pages immediately use the updated text.
4. **Open conversation** opens that role's page. Roo / Employee Coach explains the steps to employees, consults Bower's references and flags questions for Digger review when necessary. It also has an editable
   coaching guide. Kooka / Instagram has an editable caption. Tally / Client is a
   client conversation and cannot see internal notes or export the combined pack.
5. Return to Digger, choose **Approve updates**, then **Download updates**.

Edits last for this browser session only. Reloading or New session clears them.
Approval does not send messages or publish to Instagram.
Tasks and reminder drafts are assigned within the session; they do not schedule notifications. Bower's answers use the fictional demo Wiki notes. Unknown questions return a knowledge gap rather than an invented source.

## Permanent changes on GitHub

Open a file in GitHub, choose the pencil / Edit action, make the change and commit
to `main`. The Pages deployment runs the tests and then publishes the revision.

| What you want to change | File |
| --- | --- |
| Fictional address, project display name, client/team names, Instagram handle | `src/demo-config.js` |
| The three full output templates and source summaries | `src/photo-workflow.js` |
| Page greetings and role labels | `demo.js` |
| Bower's audience-scoped reference lookup, task and reminder templates | `src/photo-workflow.js` |
| App title, tagline, top navigation | `index.html` |
| Colours and layout | `demo.css` |
| Mascot, role characters, animation | `src/crew.js` |
| Agent map and its labels | `src/map.js` |

Keep project data fictional. The presentation uses **42 Marubra Street, Marubra**
and **Marubra Duplex** as aliases, with `DEMO-*` project identifiers. These are
presentation values, not a verified real address or approvals. Persona names are
scenario labels and do not verify any actual client, contact or lender records.
Do not commit original project files or photos. Upload a presentation-approved
photo when demonstrating; the public repository has no original project images.

The app uses fixed scenario templates; changing the photo does not run a live
vision model or identify a different project. Static role pages demonstrate the
workflow; production authentication is not implemented.

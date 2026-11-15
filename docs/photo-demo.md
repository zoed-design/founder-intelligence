# Photo-led hackathon demo

## Three-minute presentation

1. Start on **Digger / Site Manager**. The greeting and composer are generic and
   reveal no project or framing details before input.
2. Drop or paste a presentation-approved JPEG into the conversation, or use the inline + file
   picker. Preparation starts automatically; there is no manual run button.
3. Review the Team, Client and Instagram updates side by side below the
   conversation, then open any of the three corresponding role pages.
4. Roo has an admin conversation and editable action pack. Tally has a separate
   client conversation and a human mother/homeowner avatar, without PPE. Kooka
   has an Instagram preview and editable public caption.
5. Return to Digger to approve the three drafts and download the pack. Approval
   and dispatch are local simulation; nothing is sent externally.

No morning scenario runs. No unrelated questions, sample-photo controls, Markdown
uploader, project-overview page or simulation banner appears in the main UI.
The palette follows Digger's sunset scene: dusty lavender, sand, peach and ochre.
The original mascot retains continuous idle motion, Dance and optional Voice.

## Architecture

The original `src/engine.js`, `orchestrate()` and role policies are preserved.
`src/agents.js` also exports the focused `photo-workflow.js` scenario adapter.
It runs the same capture → router → curator → specialist → review pattern and
returns trace events for the original animated map and crew. The original broad
UI remains in `app.js`; `index.html` now launches `demo.js`.

The adapter uses entirely fictional reference notes and generic templates. It does not run a vision
model or LLM, parse arbitrary PDF uploads, validate engineering, confirm site
completion, update a schedule, connect WhatsApp or dispatch communications.
Markdown is preserved as quoted internal reference. It is not executable and
cannot change permissions, recipients or public templates.

## Fictional scenario

All project, customer, team, certifier, engineering and lender values are
invented for the presentation. No real source conversation, date, drawing
reference, spreadsheet cell, engineering dimension or approval record is used.

The generic workflow is: receive a photo, prepare team follow-up actions,
prepare a client progress message, and create a public-safe Instagram draft.
The reference notes in `src/photo-workflow.js` are fictional fixtures, not
excerpts from actual project documents. No claim eligibility or booking is
verified or inferred.

## Privacy and storage

The public presentation uses **42 Marubra Street, Marubra** and **Marubra
Duplex** as fictional aliases. Engineering and approval identifiers use `DEMO-*`
values. All personal and business contact names are invented. Original source
filenames, measurements and project conversations are absent from the public
code and documentation.

Real assets live only in ignored `private-demo/`. The test fixture can be copied
there as `framing.jpg`. The UI accepts photos directly from the user; it does not
preload a known project or expose a sample control. No real assets should be
pushed publicly.

Uploads, conversation and draft edits are held in memory only and clear on page
reload or New session. An edited public draft is screened again at approval.
This uses scenario-specific rules, not a general PII detection guarantee. Public
drafts have no original image attached. Review images and their metadata before
any future external publication. The downloaded combined pack includes private
admin/client material and is for founder review, not public distribution.

Existing connection backend work is outside this focused static demo. A real
deployment still needs authentication, server-enforced access controls, secure
provider integrations, and model services if live AI analysis is desired.

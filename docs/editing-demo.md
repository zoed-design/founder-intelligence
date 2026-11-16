# Editing and presenting the demo

1. Open the live app and choose **New session**, then **Load sample project**.
2. Review Bower’s drawing/chat comparison, schedule gap and three role drafts. Open Source references to inspect the public extracts.
3. Optionally attach a presentation-approved site photo. It stays attached to the selected case without image analysis.
4. Expand **Edit update** to revise a draft. **Open conversation** opens that role’s page. Roo coaches employees and flags changes for Digger review; Tally receives client context; Kooka prepares Client Stories.
5. Return to Digger, **Approve updates**, then **Download updates** with source links. Nothing is dispatched or scheduled.

Reloading or New session clears the case, attachments and edits. See [the sample demo guide](sample-data-demo.md) for questions to demonstrate and method limits.

## Permanent changes on GitHub

Edit the appropriate file and commit to main. Pages runs tests before deploying.

| Change | File |
| --- | --- |
| Reviewed case facts and source locators | `sample-data/project.json` and matching extract files |
| Sample checks, drafts and answers | `src/sample-project.js` |
| Generic photo-only templates and lookup | `src/photo-workflow.js` |
| Public aliases and Instagram handle | `src/demo-config.js` |
| Greetings, role pages and sample controls | `demo.js` |
| App title, tagline and navigation | `index.html` |
| Colours and layout | `demo.css` |
| Characters and animation | `src/crew.js` |
| Agent map | `src/map.js` |

Update reviewed facts and their supporting extracts together. Check identifiers, title blocks, contacts, comments and metadata before publication; do not commit full source packs or original chat images. All bundled downloads are public. Persona tabs are not production authentication. Changing an uploaded photo does not run a vision model or load a different project.

# Swapping in real data

The engine reads five JSON files. Keep their shapes and the demo works with new content.

## Steps

1. **Decide what may be used.** No personal or medical data. If a real business is involved, get the founder's written OK and strip names, addresses and amounts that are not needed.
2. **Replace a file at a time** in `data/`, starting with `knowledge.json` (most value, least risk).
3. **Update the `_dummy` note** at the top of each file to say what is real, what is dummy and where it came from.
4. **Log it in `docs/DATA.md`**: source, date range, coverage, method, licence.
5. **Run `npm test`.** Tests reference a few dummy IDs (`KB-S04`, `KB-MARGIN`, `KB-CLAIM-ELM`, `IN-01` to `IN-05`, the directory IDs). If you replace those, update the tests to the new IDs; keep every rule they check.

## Shapes

**Knowledge entry**
```json
{ "id": "KB-…", "tier": "internal | customer-safe | public", "project": "optional job id",
  "title": "…", "text": "…", "keywords": ["…"],
  "source": "where it came from", "owner": "who keeps it current", "reviewDate": "YYYY-MM-DD" }
```

**Inbox item**
```json
{ "id": "IN-…", "time": "HH:MM", "channel": "voice | email | sms | whatsapp | camera",
  "from": "directory id", "subject": "optional", "transcript": "text",
  "attachment": "optional", "simulatedVision": { "scene": "…", "observed": ["…"], "projectHint": "…", "confidence": 0.0 } }
```

**Directory person** and **role** are in `business.json`; add roles there with their `access` tiers and `projectScoped` flag.

## Other verticals

The engine is not construction-specific. A new vertical needs its own `business.json`, `knowledge.json` and `inbox.json`, and new templates in `draft()` for its intents (see ADR 0002 for replacing templates with a model).

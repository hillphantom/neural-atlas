# Connecting your activity

## Included working path

Run `python serve.py`, then open `http://127.0.0.1:4182/app/?source=external`.
The browser polls `activity.json` every 5 seconds. The initial file is `[]`, so nothing is invented. Your adapter writes a JSON array of events to this file. Use a temporary file and atomic rename to avoid partial reads. Do not expose this preview server to a network.

For an explicit fixture test, copy the contents of `activity-example.json` to `activity.json`, then refresh external mode. These are examples, not live work. Restore `[]` before connecting real events.

## Event contract

Required fields:

| Field | Meaning |
|---|---|
| id | Unique event ID (string, max 150 characters). State transitions need distinct IDs. |
| worker | Any worker ID registered in `app/atlas-config.js`. |
| state | `running`, `queued`, `completed`, `failed`, or `idle`. |
| title | Human-readable current work/result. |
| topic | High-level project topic. |
| at | ISO 8601 timestamp with timezone from your event source. |
| note | Optional short description. |

Example:
```json
{"id":"job-42-completed","worker":"worker-01","state":"completed","title":"Indexed pegboard holder references","topic":"3D printing","at":"2026-01-01T12:00:00Z","note":"Recorded five approved references."}
```

Completion must mean an actual durable result/checkpoint in your source system. Do not emit completed events on a timer or infer them from a token stream. Distinguish activity from knowledge acquisition. If a task fails or becomes idle, report that transition explicitly. A healthy empty queue is not an outage.

You can also call `window.NeuralAtlas.ingest(eventOrArray)` from your own same-page integration in external mode. Accepted inputs are validated before processing. Invalid batches are rejected. Duplicate IDs do not grow the mesh again within a session. Text is escaped before rendering.

## State and limitations

- At most 500 events per batch, 10,000 distinct IDs per browser session, 200 recent completion records retained. Counts are session counts, not lifetime totals. Last-hour/day counts cover retained records only.
- Repeated polls of the same file refresh connection health, not task progress. The latest timestamp per worker sets its state.
- If the file is unavailable or no feed receipt arrives for 35 seconds, activity settles and the header shows a stale/unavailable state. Completed structure remains. This starter does not implement the full-screen outage alert.
- Reloading clears session deduplication; the current file is replayed. A production connector needs a persistent cursor and a baseline snapshot to avoid treating history as new work.
- Queue/failed values in this starter are 0/1 indicators of the latest reported state per worker, not a complete queue inventory. Durable totals need a snapshot schema extension.
- Worker count, names and roles come from `app/atlas-config.js`; no four-role requirement. Reload after changing the inventory. Rendering uses a bounded growth budget shared across the selected workers. More workers means less visual history per worker; benchmark your actual device rather than assuming unlimited capacity.
- Real output downloads, source URLs, historical journals and reflection scheduling require your own storage/API extension. External workspaces intentionally omit example outputs and journals rather than manufacture them.
- A readable static file proves feed availability, not that a worker is healthy. Your upstream adapter must report accurate state and monitor its own connection.

## Verify before calling it live

1. Empty feed: no growth, all workers waiting.
2. Running event: appropriate color moves and glows; no new completed growth.
3. Completed event: one growth patch and correct worker/title popup.
4. Repeat that event: no extra completion or growth.
5. Failed/idle event: worker settles; no invented progress.
6. Remove the feed: unavailable status and settled activity.
7. Send malformed data and HTML in a title: invalid data is rejected; text cannot execute.

Use the connector prompt to build an adapter for your actual logs. Keep it read-only toward your workers and keep secrets outside this folder.

## Projects and machines

Each worker ID is globally unique and belongs to a project in the configuration. A worker can represent a whole pipeline or a single agent. If the same process reports work for two projects, register two stable worker IDs. The config assignment is authoritative; an event's optional project field is descriptive and does not reroute it.

Use the external-mode Project selector for All projects or one populated project. Changing selection reloads the view and replays the bounded current feed; it does not stop, start, deploy or reassign work. Machine and type labels appear in worker details. Feed health reflects receipt, not machine health.

Keep arbitrary worker names as configuration data. Unknown IDs are rejected. The shared feed may include registered workers from other projects; they are ignored by a filtered view without generating growth there.

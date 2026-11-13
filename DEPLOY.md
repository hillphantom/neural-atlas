# Publishing

## Static Maker Node demo

The `app/` folder is the standalone static demo. Upload its contents to a static website host with `index.html` at the published root. There is no build command, database, API key or model requirement. Keep `?source=external` off the public demo until a real feed has been designed.

The separate Neural Atlas guide website is not included in this app starter. The starter is the downloadable visualizer and integration materials.

Test from a private browser window: page loads, all three views work, worker details open, outputs download, mobile navigation fits. Radio is opt-in and uses an external station; remove its controls if you do not want that dependency.

Once hosting is working, follow that host's current custom-domain instructions. Configure DNS at your domain provider and let the host issue HTTPS. You do not need port forwarding to publish these static files.

## Real activity on a public website (not included)

Do not point a public page at your home PC or put API keys in its JavaScript. Build a separate service:

Local workers → read-only local adapter → authenticated outbound upload → hosted sanitized feed → public visualizer.

Keep secrets only in the local adapter and hosted service. Allowlist fields (worker name, state, topic, safe task title, timestamps, counts). Exclude raw prompts, proprietary outputs, private addresses and filesystem paths. Use HTTPS, bounded payloads, validation, rate limits and feed freshness. Make source links opt-in and validate their protocols. Public ingestion needs authentication even if public viewing does not.

Plan persistence, retention, replay/deduplication and an initial baseline before enabling live growth. Add explicit idle vs stale vs confirmed-fault states. Do not treat idle as MATRIX DOWN.

The included server is a local development helper, not a production internet server. The included file adapter is a prototype, not an authenticated public relay.

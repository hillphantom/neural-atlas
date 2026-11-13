# Your work, your structure

## Start with your AI assistant

Upload the starter ZIP if your coding assistant supports attachments; otherwise extract it and open the folder. Say: "Customize Neural Atlas for my existing work. Read README.md, CUSTOMIZE.md and CONNECTING.md. I have [agents/workflows/pipelines], grouped into [projects], running on [machines]. Ask for the missing event-source details, edit atlas-config.js, build an adapter, and verify the view. Do not start or stop my workers."

The viewer is framework-independent. An adapter translates your own logs/API events into the small event contract. New work can use the same contract from the start. The browser does not itself run an AI model.

## Configure any roles you need

Edit `app/atlas-config.js`. The default external inventory has one placeholder worker. Maker Node's four roles only belong to the fictional demo. The following twelve-pipeline example is also supplied as `atlas-config-12-example.js`: copy it over `app/atlas-config.js` to try the inventory.

```javascript
globalThis.AtlasConfig = {
  projects: [{id:'maker',name:'Maker'}, {id:'project-x',name:'Project X'}],
  workers: Array.from({length:12}, (_,i) => ({
    id:`pipeline-${i+1}`,
    name:`My pipeline ${i+1}`,
    project:i<6?'maker':'project-x',
    type:'pipeline',
    machine:i<6?'AI box 1':'AI box 2',
    goal:'Replace this with its real purpose.'
  }))
};
```

For twelve workers on one project, assign every worker the same project ID. For independent projects, add project entries and assign each worker accordingly. Use type `agent`, `workflow`, `pipeline`, or your own label. Add/remove entries rather than modifying four hard-coded roles. IDs must be unique and stable; configure at least one worker. Twelve is an example, not a cap. Large inventories still need browser performance testing, pagination and a durable backend. Visual growth is bounded and shared across workers.

## Connect and verify

Run `python serve.py`, open `http://127.0.0.1:4182/app/?source=external`, then have your adapter atomically update `activity.json`. Use a worker ID from the configuration. Choose All projects or an individual project. No workers are launched by changing the view.

Test every configured worker with an explicit fixture completion, ensure it appears under the right project, then remove fixtures before connecting real work. Check duplicate IDs, failed and idle states, unavailable feeds, and resize behavior. Retain historical records in your own database.

## Change the look or add capabilities

Ask your assistant to preserve the existing visual design while editing this extracted folder. Describe the result in plain language: add artifact links, display throughput from reported measurements, create a journal backed by your records, or add more projects. Have it distinguish existing features from extensions it must build. Use prompts.txt one task at a time.

## Deploy

Follow DEPLOY.md. Static hosting works for the example. Real public telemetry needs an authenticated outbound publishing adapter and an allowlisted feed; no direct browser access to private machines or secrets. A domain points to the host.

## Coming soon: assign local AI to projects

The future direction is to select a project and assign available local AI machines to it: Maker overnight, Project X in the morning. This requires explicit workload controls, authorization, safe handoffs and recovery. The current selector filters activity only. It is not a scheduler, deployment tool or compute broker.

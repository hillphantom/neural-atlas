# Neural Atlas

**A living map of work.** Visualize agents, workflows and pipelines as an organic network that responds to reported activity and grows when work completes.

Created by [HillPhantom](https://www.youtube.com/@HillPhantom). Explore the public demonstration at [neuralatlas.stream](https://neuralatlas.stream).

This repository is the standalone web app, with the fictional Maker Node demo and a local event adapter. It does not contain the separate marketing website, production integrations or device firmware.

## Download or clone

Use **Code → Download ZIP** on this repository, then extract it, or run:

```sh
git clone https://github.com/hillphantom/neural-atlas.git
cd neural-atlas
```

## Run the demo

Open **app/index.html** in your browser. No installation, account, AI model or API key is needed. The Maker Node example runs entirely in your browser.

For a local web server, install Python 3, open a terminal in this folder and run:

```sh
python serve.py
```

On Windows, `py serve.py` also works when the Python launcher is installed. On macOS/Linux, use `python3 serve.py` if needed.

- Demo: http://127.0.0.1:4182/app/
- Your activity: http://127.0.0.1:4182/app/?source=external
- Stop the server with **Ctrl+C**. If port 4182 is busy, stop your earlier preview first.

## What you can do

- Explore the network in Live AI, Matrix and Missions views.
- Open worker details, example history and JSON outputs.
- Configure your own agents, workflows or pipelines: no fixed four-role requirement.
- Group workers into projects and label the machines they run on.
- Connect task events through an adapter; accepted completions create growth.
- Pause the visualization, change motion settings or rotate the view.

## Connect your work

1. Edit **app/atlas-config.js** with your project and worker names, IDs, goals and machine labels.
2. Start the local server and open the external activity URL above.
3. Follow [CONNECTING.md](CONNECTING.md) to write events to **activity.json**. It starts empty.
4. Test running, completion, duplicate, idle, failed and unavailable-feed states before using real data.

[Customizing Neural Atlas](CUSTOMIZE.md) includes a twelve-pipeline example. Twelve is an example, not a product limit; performance still depends on your device. Selecting a project filters activity only. It does not start, stop or reassign workers.

## Build with your AI coding assistant

Upload the downloaded ZIP, or open this extracted folder in your coding assistant. Describe the work you want to see, the projects it belongs to and how your systems report activity. Ask it to read this README, [CUSTOMIZE.md](CUSTOMIZE.md) and [CONNECTING.md](CONNECTING.md), then use [prompts.txt](prompts.txt). Work inside a separate copy and verify changes before connecting production systems.

## Demo versus real activity

Maker Node is a **fictional, scripted demonstration**, including its tasks, history, reflections and outputs. It does not browse sources, run AI or train models. Its Live label means the demonstration is running.

External mode disables the scenario generator. It only visualizes accepted events. Reading a feed proves feed availability, not worker health. Counts/history are bounded to the browser session, and reload replays the current file. Durable journals, real artifact links, automatic reflections and a public telemetry relay require additional integrations; see [CONNECTING.md](CONNECTING.md).

## Publish your copy

Follow [DEPLOY.md](DEPLOY.md). The demo can be served as static files with no build step. Keep real credentials and private data out of browser files and public repositories. The included server binds to localhost and is for development, not internet hosting.

The optional radio only connects to SomaFM when you press Play. Audio availability depends on the station and browser. No audio or other third-party content is redistributed here.

## Verify changes

With Node.js installed (needed for these checks only):

```sh
node test.cjs
```

Checks cover demo progress, bounded growth, workspaces, duplicate/invalid events, escaped text and custom twelve-worker project filtering. Also test visually in a browser after changing the layout.

## License

[MIT](LICENSE) — Copyright © 2026 HillPhantom. Third-party websites and streams linked by the app remain subject to their own terms.

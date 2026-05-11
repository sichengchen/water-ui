# Meeting Actions Demo

This starter example turns a meeting note intent into a verified task panel:

1. The app registers four Water components: `MeetingPage`, `SummaryCard`, `TaskList`, and `ActionButton`.
2. The app registers runtime capabilities: `queries.meetingSummary.data` and `actions.createTasks`.
3. A mock agent returns Water Schema UI for the prompt: `Turn this meeting note into action items.`
4. Water verifies the document against the component registry and runtime capabilities.
5. React renders the verified UI, and the final button invokes `actions.createTasks`.

The generated page is intentionally simple: meeting summary at the top, task list below, and a `Create tasks` button at the end.

## Run

```sh
vp install
cd examples/meeting-actions-demo
vp test
```

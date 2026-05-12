# Meeting Note React

This starter example turns a meeting note into a streamed, verified todo list:

1. The React app shows a notebook on the left and an assistant panel on the right.
2. The user clicks `Turn this meeting note into a todo list.`
3. A mock agent returns Water stream events for `TaskList`.
4. Water verifies each stream event against the registry.
5. React renders the verified todo list as each item arrives.

The demo uses a mock agent so the example stays focused on the Water UI path:
app component registry, generated schema UI, verification, and rendering.

## Run

```sh
vp install
cd examples/meeting-note-react
vp dev
```

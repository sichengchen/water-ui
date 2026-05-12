# Examples

Example applications and integration demos live in this directory.

## Meeting Actions Demo

Path: [`examples/meeting-actions-demo`](./meeting-actions-demo)

A React + shadcn demo that turns a meeting note into a streamed Water UI todo list.

Flow:

1. The app shows a notebook on the left and an assistant panel on the right.
2. The user clicks `Turn this meeting note into a todo list.`
3. A mock agent emits Water stream events for `TaskList`.
4. Water verifies each event against the app registry.
5. React renders the verified todo list as items arrive.

Run:

```sh
vp install
cd examples/meeting-actions-demo
vp dev
```

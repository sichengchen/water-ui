# Examples

Example applications and integration demos live in this directory.

## Meeting Note React

Path: [`examples/meeting-note-react`](./meeting-note-react)

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
cd examples/meeting-note-react
vp dev
```

## Meeting Note Vue

Path: [`examples/meeting-note-vue`](./meeting-note-vue)

A Vue demo that uses the same meeting note flow and renders the streamed Water UI todo list with `@water-ui/vue`.

Run:

```sh
vp install
cd examples/meeting-note-vue
vp dev
```

## Meeting Note Svelte

Path: [`examples/meeting-note-svelte`](./meeting-note-svelte)

A Svelte demo that uses the same meeting note flow and renders the streamed Water UI todo list with `@water-ui/svelte`.

Run:

```sh
vp install
cd examples/meeting-note-svelte
vp dev
```

## Meeting Note Angular

Path: [`examples/meeting-note-angular`](./meeting-note-angular)

An Angular demo that uses the same meeting note flow and renders the streamed Water UI todo list with `@water-ui/angular`.

Run:

```sh
vp install
cd examples/meeting-note-angular
vp dev
```

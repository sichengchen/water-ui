# RFC 013: DevTools

Generated UI must be inspectable at every layer.

Required panels:

- Registry Inspector
- Schema UI Inspector
- VerifiedSchemaUI Inspector
- Validation Viewer
- Patch History
- Stream Viewer
- Runtime Viewer
- Prompt Viewer
- Render Viewer

DevTools must answer:

- Why was this node accepted?
- Why was this node rejected?
- Which registry entry validated it?
- Which props failed?
- Which action was blocked?
- Which query supplied this data?
- Which prompt capabilities were shown to the agent?
- Did the model invent an unregistered component?
- Did the model invent an action?
- Which stream event introduced this node?
- Which patch changed this UI?
- Which registry render binding rendered this node?

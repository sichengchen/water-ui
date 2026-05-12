import { Component } from "@angular/core";
import {
  NodeRendererComponent,
  SlotRendererComponent,
  WasserRendererComponent,
  WasserStreamRendererComponent,
} from "./index.js";

let renderRequest: any;

export function setRenderRequest(request: unknown): void {
  renderRequest = request;
}

@Component({
  selector: "test-app-shell",
  standalone: true,
  imports: [
    NodeRendererComponent,
    SlotRendererComponent,
    WasserRendererComponent,
    WasserStreamRendererComponent,
  ],
  template: `
    @switch (request.kind) {
      @case ("node") {
        <wasser-node-renderer
          [ui]="request.ui"
          [registry]="request.registry"
          [runtime]="request.runtime"
          [nodeId]="request.nodeId"
          [onDiagnostics]="request.onDiagnostics"
        />
      }
      @case ("slot") {
        <wasser-slot-renderer
          [ui]="request.ui"
          [registry]="request.registry"
          [runtime]="request.runtime"
          [nodeId]="request.nodeId"
          [name]="request.name"
          [onDiagnostics]="request.onDiagnostics"
        />
      }
      @case ("stream") {
        <wasser-stream-renderer
          [ui]="request.ui"
          [stream]="request.stream"
          [registry]="request.registry"
          [runtime]="request.runtime"
          [onDiagnostics]="request.onDiagnostics"
        />
      }
      @default {
        <wasser-renderer
          [ui]="request.ui"
          [registry]="request.registry"
          [runtime]="request.runtime"
          [onDiagnostics]="request.onDiagnostics"
        />
      }
    }
  `,
})
export class TestHostComponent {
  get request(): any {
    return renderRequest;
  }
}

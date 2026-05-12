import { Component } from "@angular/core";
import {
  NodeRendererComponent,
  SlotRendererComponent,
  WaterRendererComponent,
  WaterStreamRendererComponent,
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
    WaterRendererComponent,
    WaterStreamRendererComponent,
  ],
  template: `
    @switch (request.kind) {
      @case ("node") {
        <water-node-renderer
          [ui]="request.ui"
          [registry]="request.registry"
          [runtime]="request.runtime"
          [nodeId]="request.nodeId"
          [onDiagnostics]="request.onDiagnostics"
        />
      }
      @case ("slot") {
        <water-slot-renderer
          [ui]="request.ui"
          [registry]="request.registry"
          [runtime]="request.runtime"
          [nodeId]="request.nodeId"
          [name]="request.name"
          [onDiagnostics]="request.onDiagnostics"
        />
      }
      @case ("stream") {
        <water-stream-renderer
          [ui]="request.ui"
          [stream]="request.stream"
          [registry]="request.registry"
          [runtime]="request.runtime"
          [onDiagnostics]="request.onDiagnostics"
        />
      }
      @default {
        <water-renderer
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

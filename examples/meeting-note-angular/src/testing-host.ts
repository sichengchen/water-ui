import { Component } from "@angular/core";
import { WasserRendererComponent, WasserStreamRendererComponent } from "@wasser-ui/angular";

let renderRequest: any;

export function setRenderRequest(request: unknown): void {
  renderRequest = request;
}

@Component({
  selector: "test-app",
  standalone: true,
  imports: [WasserRendererComponent, WasserStreamRendererComponent],
  template: `
    @if (request.kind === "renderer") {
      <wasser-renderer [ui]="request.ui" [runtime]="request.runtime" />
    } @else {
      <wasser-stream-renderer [stream]="request.stream" [runtime]="request.runtime" />
    }
  `,
})
export class TestHostComponent {
  get request(): any {
    return renderRequest;
  }
}

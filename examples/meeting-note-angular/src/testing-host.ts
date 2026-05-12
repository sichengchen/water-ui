import { Component } from "@angular/core";
import { WaterRendererComponent, WaterStreamRendererComponent } from "@water-ui/angular";

let renderRequest: any;

export function setRenderRequest(request: unknown): void {
  renderRequest = request;
}

@Component({
  selector: "test-app",
  standalone: true,
  imports: [WaterRendererComponent, WaterStreamRendererComponent],
  template: `
    @if (request.kind === "renderer") {
      <water-renderer [ui]="request.ui" [runtime]="request.runtime" />
    } @else {
      <water-stream-renderer [stream]="request.stream" [runtime]="request.runtime" />
    }
  `,
})
export class TestHostComponent {
  get request(): any {
    return renderRequest;
  }
}

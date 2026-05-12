import { Component, Input } from "@angular/core";
import { WaterOutletComponent } from "./index.js";

@Component({
  selector: "test-page",
  standalone: true,
  template: '<main [attr.data-node]="nodeId">Dashboard</main>',
})
export class TestPageComponent {
  @Input() nodeId = "";
}

@Component({
  selector: "test-layout",
  standalone: true,
  imports: [WaterOutletComponent],
  template:
    "<section><header><water-outlet [value]='header' /></header><div><water-outlet [value]='children' /></div></section>",
})
export class TestLayoutComponent {
  @Input() children: readonly unknown[] = [];
  @Input() header: unknown = null;
}

@Component({
  selector: "test-text",
  standalone: true,
  template: "<p>{{ label }}</p>",
})
export class TestTextComponent {
  @Input() label = "";
}

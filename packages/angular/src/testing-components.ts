import { Component, Input } from "@angular/core";
import { WasserOutletComponent } from "./index.js";

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
  imports: [WasserOutletComponent],
  template:
    "<section><header><wasser-outlet [value]='header' /></header><div><wasser-outlet [value]='children' /></div></section>",
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

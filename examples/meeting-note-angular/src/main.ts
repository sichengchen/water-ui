import "@angular/compiler";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app.component.js";
import "./styles.css";

const bootstrap = bootstrapApplication(AppComponent);

(
  globalThis as typeof globalThis & { __waterAngularDemoBootstrap?: unknown }
).__waterAngularDemoBootstrap = bootstrap;

bootstrap.catch((error: unknown) => {
  console.error(error);
});

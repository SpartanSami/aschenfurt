// Tastatur- und Mauseingabe inklusive Pointer Lock.

export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();
  private released = new Set<string>();
  mouseDX = 0;
  mouseDY = 0;
  wheel = 0;
  mouseDown = [false, false, false];
  mousePressed = [false, false, false];
  locked = false;
  /** Touch-Modus (Smartphone/Tablet): Umschauen per Wischen statt Pointer Lock. */
  touch = false;
  private canvas: HTMLElement | null = null;
  /** Wenn false, werden Spieleingaben ignoriert (z. B. in Menüs). */
  enabled = true;
  onLockChange: ((locked: boolean) => void) | null = null;

  attach(canvas: HTMLElement): void {
    this.canvas = canvas;
    try {
      this.touch = matchMedia("(pointer: coarse)").matches && navigator.maxTouchPoints > 0;
    } catch {
      this.touch = false;
    }
    window.addEventListener("touchstart", () => {
      if (!this.touch) {
        this.touch = true;
        document.body.classList.add("touch");
      }
    }, { passive: true });
    if (this.touch) document.body.classList.add("touch");
    window.addEventListener("keydown", (e) => {
      if (e.code === "Tab" || e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
      if (e.ctrlKey && (e.code === "KeyW" || e.code === "KeyS" || e.code === "KeyD")) e.preventDefault();
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
    });
    window.addEventListener("keyup", (e) => {
      this.down.delete(e.code);
      this.released.add(e.code);
    });
    window.addEventListener("blur", () => {
      this.down.clear();
      this.mouseDown = [false, false, false];
    });
    window.addEventListener("mousemove", (e) => {
      if (!this.locked) return;
      // Ausreißer (bekannter Chrome-Fehler bei Pointer Lock) abfangen
      if (Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
    window.addEventListener("mousedown", (e) => {
      if (e.button < 3) {
        this.mouseDown[e.button] = true;
        this.mousePressed[e.button] = true;
      }
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button < 3) this.mouseDown[e.button] = false;
    });
    window.addEventListener("wheel", (e) => {
      if (this.locked) this.wheel += Math.sign(e.deltaY);
    }, { passive: true });
    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === this.canvas;
      this.onLockChange?.(this.locked);
    });
    window.addEventListener("contextmenu", (e) => {
      if (this.locked) e.preventDefault();
    });
  }

  /** Darf die Kamera gerade gesteuert werden (Pointer Lock oder Touch)? */
  get looking(): boolean {
    return this.locked || this.touch;
  }

  requestLock(): void {
    if (!this.canvas || this.locked || this.touch) return;
    try {
      const p = (this.canvas as any).requestPointerLock?.({ unadjustedMovement: false });
      if (p && typeof p.catch === "function")
        p.catch(() => {
          // Manche Browser kennen die Option nicht – ohne Option erneut versuchen.
          try {
            const p2 = (this.canvas as any).requestPointerLock?.();
            if (p2 && typeof p2.catch === "function") p2.catch(() => undefined);
          } catch {
            /* ohne Nutzergeste nicht möglich – der Klick-Hinweis bleibt sichtbar */
          }
        });
    } catch {
      /* Pointer Lock nicht verfügbar */
    }
  }

  exitLock(): void {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  isDown(code: string): boolean {
    return this.enabled && this.down.has(code);
  }

  /** Taste wurde in diesem Frame gedrückt (unabhängig von enabled, für UI). */
  wasPressedRaw(code: string): boolean {
    return this.pressed.has(code);
  }

  wasPressed(code: string): boolean {
    return this.enabled && this.pressed.has(code);
  }

  wasReleased(code: string): boolean {
    return this.released.has(code);
  }

  consume(code: string): void {
    this.pressed.delete(code);
  }

  endFrame(): void {
    this.pressed.clear();
    this.released.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
    this.mousePressed = [false, false, false];
  }
}

export const input = new Input();

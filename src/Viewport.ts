import { WorldCoords, CanvasCoords, ExploredChunkData, Planet } from './GlobalTypes';
import { PlanetHelper } from './PlanetHelper';
import events from 'events';
import _ from 'lodash';

export enum UIEvent {
  GamePlanetSelected = 'GamePlanetSelected',
  CenterPlanet = 'CenterPlanet',
  WindowResize = 'WindowResize',

  UIChange = 'UIChange', // whenever you collapse, etc.

  CanvasMouseDown = 'CanvasMouseDown',
  CanvasMouseMove = 'CanvasMouseMove',
  CanvasMouseUp = 'CanvasMouseUp',
  CanvasMouseOut = 'CanvasMouseOut',
  CanvasScroll = 'CanvasScroll',

  WorldMouseDown = 'WorldMouseDown',
  WorldMouseClick = 'WorldMouseClick',
  WorldMouseMove = 'WorldMouseMove',
  WorldMouseUp = 'WorldMouseUp',
  WorldMouseOut = 'WorldMouseOut',

  ZoomIn = 'ZoomIn',
  ZoomOut = 'ZoomOut',

  ContextChange = 'ContextChange',

  SendInitiated = 'SendInitiated',
  SendCancelled = 'SendCanelled',
  SendCompleted = 'SendCompleted',
}

// TODO: Coordinates.ts
export const distL2 = (
  a: CanvasCoords | WorldCoords,
  b: CanvasCoords | WorldCoords
): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export class Viewport extends events.EventEmitter {
  centerWorldCoords: WorldCoords;
  widthInWorldUnits: number;
  heightInWorldUnits: number;
  viewportWidth: number;
  viewportHeight: number;
  isPanning = false;
  mouseLastCoords: CanvasCoords | null;
  canvas: HTMLCanvasElement;

  isFirefox: boolean;

  planetHelper: PlanetHelper;

  mousedownCoords: CanvasCoords | null = null;

  constructor(
    planetHelper: PlanetHelper,
    centerWorldCoords: WorldCoords,
    widthInWorldUnits: number,
    viewportWidth: number,
    viewportHeight: number,
    canvas: HTMLCanvasElement
  ) {
    super();

    this.planetHelper = planetHelper;

    // each of these is measured relative to the world coordinate system
    this.centerWorldCoords = centerWorldCoords;
    this.widthInWorldUnits = widthInWorldUnits;
    this.heightInWorldUnits =
      (widthInWorldUnits * viewportHeight) / viewportWidth;
    // while all of the above are in the world coordinate system, the below are in the page coordinate system
    this.viewportWidth = viewportWidth; // width / height
    this.viewportHeight = viewportHeight;

    this.mouseLastCoords = centerWorldCoords;
    this.canvas = canvas;

    this.isFirefox = navigator.userAgent.indexOf('Firefox') > 0;

    this.isPanning = false;

    this.centerCoords(centerWorldCoords);

    let onMouseEvent = (emitEventName: UIEvent, mouseEvent: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const canvasX = mouseEvent.clientX - rect.left;
      const canvasY = mouseEvent.clientY - rect.top;
      this.emit(emitEventName, { x: canvasX, y: canvasY });
    }

    const onMouseDown = (e: MouseEvent) => {
      onMouseEvent(UIEvent.CanvasMouseDown, e);
    };
    // this is the root of the mousemove event
    const onMouseMove = (e: MouseEvent) => {
      onMouseEvent(UIEvent.CanvasMouseMove, e);
    };
    const onMouseUp = (e: MouseEvent) => {
      onMouseEvent(UIEvent.CanvasMouseUp, e);
    };
    // TODO convert this to mouseleave
    const onMouseOut = () => {
      this.emit(UIEvent.CanvasMouseOut);
    };

    const throttledWheel = _.throttle((e) => {
      const { deltaY } = e;
      this.emit(UIEvent.CanvasScroll, deltaY);
    }, 10);
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      throttledWheel(e);
    }
    let onResize = () => {
      console.log('resize');
      this.emit(UIEvent.WindowResize);
    }

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseout', onMouseOut);
    canvas.addEventListener('wheel', onWheel);
    window.addEventListener('resize', onResize);

    this
      .on(UIEvent.CanvasMouseDown, this.onMouseDown)
      .on(UIEvent.CanvasMouseMove, _.throttle(this.onMouseMove, 33))
      .on(UIEvent.CanvasMouseUp, this.onMouseUp)
      .on(UIEvent.CanvasMouseOut, this.onMouseOut)
      .on(UIEvent.CanvasScroll, this.onScroll)
      .on(UIEvent.WindowResize, this.onWindowResize)
      .on(UIEvent.CenterPlanet, this.centerPlanet)
      .on(UIEvent.ZoomIn, this.zoomIn)
      .on(UIEvent.ZoomOut, this.zoomOut);
  }

  centerPlanet(planet: Planet | null): void {
    if (!planet) return;
    const loc = this.planetHelper.getLocationOfPlanet(planet.locationId);
    if (!loc) return;
    const { x, y } = loc.coords;
    this.centerWorldCoords = { x, y };
  }

  centerCoords(coords: WorldCoords): void {
    this.centerWorldCoords = coords;
  }

  centerChunk(chunk: ExploredChunkData): void {
    const { bottomLeft, sideLength } = chunk.chunkFootprint;
    this.centerWorldCoords = {
      x: bottomLeft.x + sideLength / 2,
      y: bottomLeft.y + sideLength / 2,
    };
  }

  zoomIn(): void {
    this.onScroll(-600, true);
  }

  zoomOut(): void {
    this.onScroll(600, true);
  }

  // Event handlers
  onMouseDown(canvasCoords: CanvasCoords) {
    this.mousedownCoords = canvasCoords;

    const worldCoords = this.canvasToWorldCoords(canvasCoords);
    this.isPanning = true;
    this.emit(UIEvent.WorldMouseDown, worldCoords);
    this.mouseLastCoords = canvasCoords;
  }

  onMouseMove(canvasCoords: CanvasCoords) {

    if (this.isPanning && this.mouseLastCoords) {
      // if panning, don't need to emit mouse move event
      const dx = canvasCoords.x - this.mouseLastCoords.x;
      const dy = canvasCoords.y - this.mouseLastCoords.y;
      this.centerWorldCoords.x -= dx * this.scale();
      this.centerWorldCoords.y -= -1 * dy * this.scale();
    } else {
      const worldCoords = this.canvasToWorldCoords(canvasCoords);
      this.emit(UIEvent.WorldMouseMove, worldCoords);
    }
    this.mouseLastCoords = canvasCoords;
  }

  onMouseUp(canvasCoords: CanvasCoords) {
    const worldCoords = this.canvasToWorldCoords(canvasCoords);
    if (
      this.mousedownCoords &&
      distL2(canvasCoords, this.mousedownCoords) < 3
    ) {
      this.emit(UIEvent.WorldMouseClick, worldCoords);
    }

    this.mousedownCoords = null;
    this.emit(UIEvent.WorldMouseUp, worldCoords);
    this.isPanning = false;
    this.mouseLastCoords = canvasCoords;
  }

  onMouseOut() {
    this.emit(UIEvent.WorldMouseOut);
    this.isPanning = false;
    this.mouseLastCoords = null;
  }

  onScroll(deltaY: number, forceZoom = false) {
    if (this.mouseLastCoords !== null || forceZoom) {
      let mouseWorldCoords = this.centerWorldCoords;
      if (this.mouseLastCoords) {
        mouseWorldCoords = this.canvasToWorldCoords(this.mouseLastCoords);
      }
      const centersDiff = {
        x: this.centerWorldCoords.x - mouseWorldCoords.x,
        y: this.centerWorldCoords.y - mouseWorldCoords.y,
      };
      const base = this.isFirefox ? 1.005 : 1.0006;
      const newCentersDiff = {
        x: centersDiff.x * base ** deltaY,
        y: centersDiff.y * base ** deltaY,
      };
      const newCenter = {
        x: mouseWorldCoords.x + newCentersDiff.x,
        y: mouseWorldCoords.y + newCentersDiff.y,
      };
      this.centerWorldCoords.x = newCenter.x;
      this.centerWorldCoords.y = newCenter.y;

      const newWidth = this.widthInWorldUnits * base ** deltaY;
      this.setWorldWidth(newWidth);
    }
  }

  onWindowResize() {
    this.viewportHeight = this.canvas.height = window.innerHeight;
    this.viewportWidth = this.canvas.width = window.innerWidth;;
  }

  // Camera utility functions
  scale(): number {
    return this.widthInWorldUnits / this.viewportWidth;
  }

  canvasToWorldCoords(canvasCoords: CanvasCoords): WorldCoords {
    const worldX = this.canvasToWorldX(canvasCoords.x);
    const worldY = this.canvasToWorldY(canvasCoords.y);
    return { x: worldX, y: worldY };
  }

  worldToCanvasCoords(worldCoords: WorldCoords): CanvasCoords {
    const canvasX = this.worldToCanvasX(worldCoords.x);
    const canvasY = this.worldToCanvasY(worldCoords.y);
    return { x: canvasX, y: canvasY };
  }

  worldToCanvasDist(d: number): number {
    return d / this.scale();
  }

  canvasToWorldDist(d: number): number {
    return d * this.scale();
  }

  worldToCanvasX(x: number): number {
    return (
      (x - this.centerWorldCoords.x) / this.scale() + this.viewportWidth / 2
    );
  }

  canvasToWorldX(x: number): number {
    return (
      (x - this.viewportWidth / 2) * this.scale() + this.centerWorldCoords.x
    );
  }

  worldToCanvasY(y: number): number {
    return (
      (-1 * (y - this.centerWorldCoords.y)) / this.scale() +
      this.viewportHeight / 2
    );
  }

  canvasToWorldY(y: number): number {
    return (
      -1 * (y - this.viewportHeight / 2) * this.scale() +
      this.centerWorldCoords.y
    );
  }

  isInOrAroundViewport(coords: WorldCoords): boolean {
    if (
      Math.abs(coords.x - this.centerWorldCoords.x) >
      0.6 * this.widthInWorldUnits
    ) {
      return false;
    }
    if (
      Math.abs(coords.y - this.centerWorldCoords.y) >
      0.6 * this.heightInWorldUnits
    ) {
      return false;
    }
    return true;
  }

  intersectsViewport(chunk: ExploredChunkData): boolean {
    const chunkLeft = chunk.chunkFootprint.bottomLeft.x;
    const chunkRight = chunkLeft + chunk.chunkFootprint.sideLength;
    const chunkBottom = chunk.chunkFootprint.bottomLeft.y;
    const chunkTop = chunkBottom + chunk.chunkFootprint.sideLength;

    const viewportLeft = this.centerWorldCoords.x - this.widthInWorldUnits / 2;
    const viewportRight = this.centerWorldCoords.x + this.widthInWorldUnits / 2;
    const viewportBottom =
      this.centerWorldCoords.y - this.heightInWorldUnits / 2;
    const viewportTop = this.centerWorldCoords.y + this.heightInWorldUnits / 2;
    if (
      chunkLeft > viewportRight ||
      chunkRight < viewportLeft ||
      chunkBottom > viewportTop ||
      chunkTop < viewportBottom
    ) {
      return false;
    }
    return true;
  }

  private setWorldWidth(width: number): void {
    // world scale width
    this.widthInWorldUnits = width;
    this.heightInWorldUnits =
      (width * this.viewportHeight) / this.viewportWidth;
  }

  public getDetailLevel(): number {
    if (this.widthInWorldUnits > 65536) {
      return 5;
    }
    if (this.widthInWorldUnits > 32768) {
      return 4;
    }
    if (this.widthInWorldUnits > 16384) {
      return 3;
    }
    if (this.widthInWorldUnits > 8192) {
      return 2;
    }
    if (this.widthInWorldUnits > 4096) {
      return 1;
    }
    if (this.widthInWorldUnits > 2048) {
      return 0;
    }
    if (this.widthInWorldUnits > 1024) {
      return -1;
    }
    if (this.widthInWorldUnits > 512) {
      return -2;
    }
    return -3;
  }
}

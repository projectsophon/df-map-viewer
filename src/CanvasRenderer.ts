import {
  ExploredChunkData,
  Planet,
  WorldCoords,
  CanvasCoords,
  PlanetLevel,
  PlanetResource,
  Location,
  LocationId
} from './GlobalTypes';
import {
  PlanetHelper,
  QueuedArrival,
  getPlanetRank,
  hasOwner,
  bonusFromHex,
} from './PlanetHelper';
import {
  Viewport,
} from './Viewport';
import {
  HatType,
  getPlanetCosmetic,
  getOwnerColor,
  hatFromType,
} from './Cosmetic';
import {
  dfstyles,
} from './dfstyles';
import { Timer } from './Timer';

export const formatNumber = (num: number): string => {
  if (num < 1000) return `${num.toFixed(0)}`;

  const suffixes = ['', 'K', 'M', 'B', 'T', 'q', 'Q'];
  let log000 = 0;
  let rem = num;
  while (rem / 1000 >= 1) {
    rem /= 1000;
    log000++;
  }

  if (log000 === 0) return `${Math.floor(num)}`;

  if (rem < 10) return `${rem.toFixed(2)}${suffixes[log000]}`;
  else if (rem < 100) return `${rem.toFixed(1)}${suffixes[log000]}`;
  /*rem < 1000*/ else return `${rem.toFixed(0)}${suffixes[log000]}`;
};

export class CanvasRenderer {
  planetHelper: PlanetHelper;
  viewport: Viewport;
  timer: Timer;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  frameRequestId: number;
  worldRadius: number;
  perlinThreshold1: number;
  perlinThreshold2: number;

  frameCount: number;
  now: number;
  selected: Planet | null;

  viewportDetailLevel: number;

  constructor(
    canvas: HTMLCanvasElement,
    worldRadius: any,
    perlinThresholds: number[],
    planetHelper: PlanetHelper,
    viewport: Viewport,
    timer: Timer,
  ) {
    this.worldRadius = worldRadius;
    this.planetHelper = planetHelper;
    this.viewport = viewport;
    this.timer = timer;

    this.canvas = canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Not a 2D canvas.');
    }
    this.ctx = ctx;


    this.perlinThreshold1 = perlinThresholds[0];
    this.perlinThreshold2 = perlinThresholds[1];

    this.frameCount = 0;
    this.now = this.timer.now();
    this.selected = null;

    this.frame();
  }

  private draw() {
    this.drawCleanBoard();

    for (const exploredChunk of this.planetHelper.getExploredNebula()) {
      if (!this.viewport.intersectsViewport(exploredChunk)) {
        continue;
      }

      this.drawKnownChunk(exploredChunk);
    }

    for (const exploredChunk of this.planetHelper.getExploredSpace()) {
      if (!this.viewport.intersectsViewport(exploredChunk)) {
        continue;
      }

      this.drawKnownChunk(exploredChunk);
    }

    for (const exploredChunk of this.planetHelper.getExploredDeepSpace()) {
      if (!this.viewport.intersectsViewport(exploredChunk)) {
        continue;
      }

      this.drawKnownChunk(exploredChunk);
    }

    this.drawSelectedRangeRing();
    // TODO: make this only in viewport too
    this.drawVoyages();
    this.drawPlanets();

    this.drawSelectedRect();
    this.drawHoveringRect();
    this.drawMousePath();
    this.drawBorders();

    this.drawMiner();
  }

  private frame() {
    // Cache this once per frame
    this.viewportDetailLevel = this.viewport.getDetailLevel();
    this.frameCount++;

    // make the tick depend on detail level?
    const tick = 1;

    if (this.frameCount % tick === 0) {
      // this.selected = this.gameUIManager.getSelectedPlanet();
      this.now = this.timer.now();
      this.draw();
    }
    this.frameRequestId = window.requestAnimationFrame(this.frame.bind(this));
  }

  private drawMiner() {
    // const minerLoc = this.gameUIManager.getMinerLocation();
    // if (minerLoc === null) return;

    // const loc = this.viewport.worldToCanvasCoords(minerLoc);

    // const { ctx } = this;

    // ctx.save();
    // ctx.translate(loc.x, loc.y);
    // ctx.scale(1 / 16, 1 / 16);

    // const path = new Path2D(
    //   'M512 224h-50.462c-13.82-89.12-84.418-159.718-173.538-173.538v-50.462h-64v50.462c-89.12 13.82-159.718 84.418-173.538 173.538h-50.462v64h50.462c13.82 89.12 84.418 159.718 173.538 173.538v50.462h64v-50.462c89.12-13.82 159.718-84.418 173.538-173.538h50.462v-64zM396.411 224h-49.881c-9.642-27.275-31.255-48.889-58.53-58.53v-49.881c53.757 12.245 96.166 54.655 108.411 108.411zM256 288c-17.673 0-32-14.327-32-32s14.327-32 32-32c17.673 0 32 14.327 32 32s-14.327 32-32 32zM224 115.589v49.881c-27.275 9.641-48.889 31.255-58.53 58.53h-49.881c12.245-53.756 54.655-96.166 108.411-108.411zM115.589 288h49.881c9.641 27.275 31.255 48.889 58.53 58.53v49.881c-53.756-12.245-96.166-54.654-108.411-108.411zM288 396.411v-49.881c27.275-9.642 48.889-31.255 58.53-58.53h49.881c-12.245 53.757-54.654 96.166-108.411 108.411z'
    // );
    // ctx.translate(-256, -256);

    // ctx.fillStyle = 'white';
    // ctx.fill(path);

    // ctx.restore();
  }

  private drawCleanBoard() {
    this.ctx.clearRect(0, 0, this.viewport.viewportWidth, this.viewport.viewportHeight);
    this.ctx.fillStyle = 'grey';
    this.ctx.fillRect(0, 0, this.viewport.viewportWidth, this.viewport.viewportHeight);
  }

  private drawKnownChunk(chunk: ExploredChunkData) {
    const chunkLoc = chunk.chunkFootprint;
    const center = {
      x: chunkLoc.bottomLeft.x + chunkLoc.sideLength / 2,
      y: chunkLoc.bottomLeft.y + chunkLoc.sideLength / 2,
    };
    const p = chunk.perlin;

    let fill: CanvasPattern | string = 'black';

    if (p < this.perlinThreshold1) {
      fill = '#303080';
    } else if (p < this.perlinThreshold2) {
      fill = '#202060';
    }

    this.drawRectWithCenter(
      center,
      chunkLoc.sideLength,
      chunkLoc.sideLength,
      fill
    );
  }

  private drawPlanets() {
    for (const exploredChunk of this.planetHelper.getExploredNebula()) {
      if (!this.viewport.intersectsViewport(exploredChunk)) {
        continue;
      }

      for (let planetLocation of exploredChunk.planetLocations) {
        let planet = this.planetHelper.getPlanetWithLocation(planetLocation, this.viewportDetailLevel)
        if (!planet) {
          continue;
        }

        for (let l = PlanetLevel.MAX; l >= PlanetLevel.MIN; l--) {
          this.drawPlanetAtLocation(planetLocation, planet, l);
        }
      }
    }

    for (const exploredChunk of this.planetHelper.getExploredSpace()) {
      if (!this.viewport.intersectsViewport(exploredChunk)) {
        continue;
      }

      for (let planetLocation of exploredChunk.planetLocations) {
        let planet = this.planetHelper.getPlanetWithLocation(planetLocation, this.viewportDetailLevel)
        if (!planet) {
          continue;
        }

        for (let l = PlanetLevel.MAX; l >= PlanetLevel.MIN; l--) {
          this.drawPlanetAtLocation(planetLocation, planet, l);
        }
      }
    }

    for (const exploredChunk of this.planetHelper.getExploredDeepSpace()) {
      if (!this.viewport.intersectsViewport(exploredChunk)) {
        continue;
      }

      for (let planetLocation of exploredChunk.planetLocations) {
        let planet = this.planetHelper.getPlanetWithLocation(planetLocation, this.viewportDetailLevel)
        if (!planet) {
          continue;
        }

        for (let l = PlanetLevel.MAX; l >= PlanetLevel.MIN; l--) {
          this.drawPlanetAtLocation(planetLocation, planet, l);
        }
      }
    }
  }

  private drawPlanetAtLocation(location: Location, planet: Planet, atLevel: PlanetLevel) {
    const isSelected = location.hash === this.selected?.locationId;

    const planetLevel = planet.planetLevel;
    const detailLevel = planet.planetLevel;

    if (planetLevel !== atLevel) return; // strictly for ordering

    const isVeryBig = planet.planetLevel >= 6;

    // always show selected and very big
    if (!isSelected || !isVeryBig) {
      if (detailLevel === null || detailLevel < this.viewportDetailLevel) {
        return; // so we don't call getPlanetWithLocation, which triggers updates every second
      }
    }

    const radius = this.planetHelper.getRadiusOfPlanetLevel(planetLevel);

    // if (isSelected || isVeryBig) {
    this.ctx.globalAlpha = 1;
    // } else {
    //   const alpha = Math.max(0, 0.25 * (radiusReal - minRadius + 1));
    //   this.ctx.globalAlpha = Math.min(alpha, 1);
    // }

    const energy = planet ? Math.ceil(planet.energy) : 0;

    const silver = planet ? Math.floor(planet.silver) : 0;
    const center = { x: location.coords.x, y: location.coords.y };

    const colors = getPlanetCosmetic(planet);

    const myRotation = (-40 + (colors.baseHue % 80)) * (Math.PI / 180);

    /* draw ring back */
    const rank = getPlanetRank(planet);
    const numRings = rank;
    // const numRings = 2;

    for (let i = 0; i < numRings; i++)
      this.drawHalfRingWithCenter(
        center,
        radius,
        i,
        myRotation,
        true,
        // colorIndex[offset + i]
        colors.backgroundColor
      );

    /* draw planet */

    // hp bar 1
    if (hasOwner(planet)) {
      this.drawLoopWithCenter(
        center,
        radius * 1.2,
        1,
        getOwnerColor(planet, 0.7)
      );
    }

    this.drawPlanetBody(center, radius, planet);

    /* draw ring front */
    for (let i = 0; i < numRings; i++)
      this.drawHalfRingWithCenter(
        center,
        radius,
        i,
        myRotation,
        false,
        // colorIndex[offset + i]
        colors.backgroundColor
      );

    this.drawAsteroidBelt(center, radius, planet);

    const hatLevel = planet.hatLevel;
    // const hatLevel = planetRandomInt(planet.locationId)() % 5;

    if (hatLevel > 0) {
      const hatScale = 1.65 ** (hatLevel - 1);

      this.drawHat(
        colors.hatType,
        // HatType.Squid,
        512,
        512,
        center,
        1.2 * radius * hatScale,
        1.2 * radius * hatScale,
        radius,
        myRotation,
        colors.backgroundColor,
        colors.previewColor
      );
    }

    // draw text
    const current = this.viewport.getDetailLevel();
    const det = this.planetHelper.getPlanetDetailLevel(planet.locationId);
    if (det === null) return;
    if (det > current + 1 || isSelected) {
      // if (!isSelected && !isVeryBig) {
      //   this.ctx.globalAlpha = Math.min(0.2 * radiusReal, 1);
      // } // don't need else, already max opacity

      // const fromPlanet = uiManager.getMouseDownPlanet();
      // const fromCoords = uiManager.getMouseDownCoords();
      // const toPlanet = uiManager.getHoveringOverPlanet();
      // const toCoords = uiManager.getHoveringOverCoords();
      // const moveHereInProgress =
      //   fromPlanet &&
      //   fromCoords &&
      //   toPlanet &&
      //   toCoords &&
      //   fromPlanet.locationId !== toPlanet.locationId &&
      //   toPlanet.locationId === planet.locationId;
      // if (moveHereInProgress || (hasOwner(planet) && energy > 0)) {
      if (hasOwner(planet) && energy > 0) {
        let energyString = energy.toString();

        this.drawText(
          energyString,
          15,
          {
            x: center.x,
            y: center.y - 1.1 * radius - (planet.owner ? 0.75 : 0.25),
          },
          getOwnerColor(planet, 1)
        );
        // hp bar 2
        this.drawArcWithCenter(
          center,
          radius * 1.2,
          3,
          (planet.energy / planet.energyCap) * 100,
          getOwnerColor(planet, 1)
        );
      } else if (!hasOwner(planet) && energy > 0) {
        const current = this.viewport.getDetailLevel();
        const det = this.planetHelper.getPlanetDetailLevel(planet.locationId);
        if (det === null) return;
        if (det > current) {
          this.drawText(
            formatNumber(energy),
            15,
            {
              x: center.x,
              y: center.y - 1.1 * radius - (planet.owner ? 0.75 : 0.25),
            },
            '#996666'
          );
        }
      }

      if (planet.silverGrowth > 0 || planet.silver > 0) {
        this.drawText(
          silver.toString(),
          15,
          {
            x: center.x,
            y: center.y + 1.1 * radius + (planet.owner ? 0.75 : 0.25),
          },
          'gold'
        );
      }
    }

    this.ctx.globalAlpha = 1;
  }

  private drawVoyages() {
    const voyages = this.planetHelper.getAllVoyages();
    for (const voyage of voyages) {
      const now = this.now / 1000;
      if (now < voyage.arrivalTime) {
        this.drawVoyagePath(
          voyage.fromPlanet,
          voyage.toPlanet,
          true,
          false,
        );
        this.drawFleet(voyage);
      }
    }
  }

  private drawFleet(voyage: QueuedArrival) {
    const fromLoc = this.planetHelper.getLocationOfPlanet(voyage.fromPlanet);
    const fromPlanet = this.planetHelper.getPlanetWithId(voyage.fromPlanet);
    const toLoc = this.planetHelper.getLocationOfPlanet(voyage.toPlanet);
    if (!fromPlanet || !toLoc) {
      // not enough info to draw anything
      return;
    } else if (!fromLoc && fromPlanet && toLoc) {
      // can draw a red ring around dest, but don't know source location
      const now = this.now / 1000;
      const timeLeft = voyage.arrivalTime - now;
      const radius = (timeLeft * fromPlanet.speed) / 100;
      this.drawLoopWithCenter(
        toLoc.coords,
        radius,
        2,
        'red',
        true
      );
      this.drawText(`${Math.floor(timeLeft)}s`, 15, {
        x: toLoc.coords.x,
        y: toLoc.coords.y + radius * 1.1,
      });
    } else if (fromLoc && fromPlanet && toLoc) {
      // know source and destination locations
      const now = this.now / 1000;
      let proportion =
        (now - voyage.departureTime) /
        (voyage.arrivalTime - voyage.departureTime);
      proportion = Math.max(proportion, 0.01);
      proportion = Math.min(proportion, 0.99);

      const shipsLocationX =
        (1 - proportion) * fromLoc.coords.x + proportion * toLoc.coords.x;
      const shipsLocationY =
        (1 - proportion) * fromLoc.coords.y + proportion * toLoc.coords.y;
      const shipsLocation = { x: shipsLocationX, y: shipsLocationY };

      this.drawCircleWithCenter(shipsLocation, 1, 'red');
      const timeLeftSeconds = Math.floor(voyage.arrivalTime - now);
      this.drawText(
        `${timeLeftSeconds.toString()}s`,
        15,
        { x: shipsLocationX, y: shipsLocationY - 1.1 },
        'white'
      );
    }
  }

  private drawVoyagePath(
    from: LocationId,
    to: LocationId,
    confirmed: boolean,
    isMyVoyage: boolean
  ) {
    const fromLoc = this.planetHelper.getLocationOfPlanet(from);
    const fromPlanet = this.planetHelper.getPlanetWithId(from);
    const toLoc = this.planetHelper.getLocationOfPlanet(to);
    if (!fromPlanet || !fromLoc || !toLoc) {
      return;
    }

    this.drawLine(
      fromLoc.coords,
      toLoc.coords,
      confirmed ? 2 : 1,
      isMyVoyage ? 'blue' : 'red',
      confirmed ? false : true
    );
  }

  private drawHoveringRect() {
    // const hoveringOverCoords = uiManager.getHoveringOverCoords();
    // if (!hoveringOverCoords) {
    //   return;
    // }

    // const hoveringOverPlanet = uiManager.getHoveringOverPlanet();

    // const sideLength = hoveringOverPlanet
    //   ? 2.4 * this.planetHelper.getRadiusOfPlanetLevel(hoveringOverPlanet.planetLevel)
    //   : 1;

    // this.drawRectBorderWithCenter(
    //   hoveringOverCoords,
    //   sideLength,
    //   sideLength,
    //   2,
    //   'white'
    // );
  }

  private drawSelectedRangeRing() {
    const selected = this.selected;

    if (!selected) return;
    const loc = this.planetHelper.getLocationOfPlanet(selected.locationId);
    if (!loc) return;
    const { x, y } = loc?.coords;

    this.drawLoopWithCenter(
      { x, y },
      4.3219 * selected.range, // log_2 (100/5)
      1,
      dfstyles.game.rangecolors.dash,
      true
    );
    this.drawText(
      '100%',
      15,
      { x, y: y + 4.3219 * selected.range },
      dfstyles.game.rangecolors.dash
    );

    this.drawLoopWithCenter(
      { x, y },
      3.3219 * selected.range, // log_2 (50/5)
      1,
      dfstyles.game.rangecolors.dash,
      true
    );
    this.drawText(
      '50%',
      15,
      { x, y: y + 3.3219 * selected.range },
      dfstyles.game.rangecolors.dash
    );

    this.drawLoopWithCenter(
      { x, y },
      2.3219 * selected.range, // log_2 (25/5)
      1,
      dfstyles.game.rangecolors.dash,
      true
    );
    this.drawText(
      '25%',
      15,
      { x, y: y + 2.3219 * selected.range },
      dfstyles.game.rangecolors.dash
    );
  }

  private drawSelectedRect() {
    // const selectedCoords = uiManager.getSelectedCoords();
    // const selectedPlanet = uiManager.getSelectedPlanet();
    // if (!selectedPlanet || !selectedCoords) {
    //   return;
    // }

    // const sideLength =
    //   2.4 * this.planetHelper.getRadiusOfPlanetLevel(selectedPlanet.planetLevel);
    // this.drawRectBorderWithCenter(
    //   selectedCoords,
    //   sideLength,
    //   sideLength,
    //   2,
    //   'red'
    // );
  }

  private drawMousePath() {

  }

  private drawBorders() {
    this.drawLoopWithCenter({ x: 0, y: 0 }, this.worldRadius, 2, 'white');
  }

  private drawHat(
    hatType: HatType,
    pathHeight: number,
    pathWidth: number,
    center: WorldCoords,
    width: number,
    height: number,
    radius: number,
    rotation: number,
    fill1: string | CanvasPattern = 'white',
    fill2: string | CanvasPattern = 'red'
  ) {
    const { ctx } = this;
    const hat = hatFromType(hatType);

    const trueCenter = this.viewport.worldToCanvasCoords(center);
    const trueRadius = this.viewport.worldToCanvasDist(radius);
    const trueWidth = this.viewport.worldToCanvasDist(width);
    const trueHeight = this.viewport.worldToCanvasDist(height);

    ctx.save();

    // move to planet center
    ctx.translate(trueCenter.x, trueCenter.y);

    // extrude out to outside
    ctx.rotate(rotation);
    ctx.translate(0, -trueRadius - trueHeight / 4);

    // move to svg center
    ctx.scale(trueWidth / pathWidth, trueHeight / pathHeight);
    ctx.translate(-pathWidth / 2, -pathHeight / 2);

    ctx.fillStyle = fill1;
    for (const pathStr of hat.bottomLayer) {
      ctx.fill(new Path2D(pathStr));
    }

    ctx.fillStyle = fill2;
    for (const pathStr of hat.topLayer) {
      ctx.fill(new Path2D(pathStr));
    }

    ctx.restore();
  }

  private drawRectWithCenter(
    center: WorldCoords,
    width: number, // TODO we should label w/h with world vs canvas coords
    height: number,
    fill: string | CanvasPattern = 'white'
  ) {
    const { ctx, viewport } = this;
    const centerCanvasCoords = viewport.worldToCanvasCoords(center);
    const widthCanvasCoords = viewport.worldToCanvasDist(width);
    const heightCanvasCoords = viewport.worldToCanvasDist(height);

    if (typeof fill === 'string') {
      ctx.fillStyle = fill;
      ctx.fillRect(
        Math.floor(centerCanvasCoords.x - widthCanvasCoords / 2),
        Math.floor(centerCanvasCoords.y - heightCanvasCoords / 2),
        widthCanvasCoords,
        heightCanvasCoords
      );
    } else {
      ctx.fillStyle = fill;

      const vCenter = viewport.centerWorldCoords;

      const offX = viewport.worldToCanvasDist(vCenter.x);
      const offY = -viewport.worldToCanvasDist(vCenter.y);

      ctx.save();
      ctx.translate(-offX, -offY);

      ctx.globalCompositeOperation = 'overlay';
      ctx.fillRect(
        Math.floor(centerCanvasCoords.x - widthCanvasCoords / 2) + offX,
        Math.floor(centerCanvasCoords.y - heightCanvasCoords / 2) + offY,
        widthCanvasCoords,
        heightCanvasCoords
      );

      ctx.restore();
    }
  }

  private drawAsteroidBelt(
    center: WorldCoords,
    radius: number,
    planet: Planet
  ) {
    const { ctx, viewport } = this;
    const planetDetailLevel = this.planetHelper.getPlanetDetailLevel(
      planet.locationId
    );
    const detailLevel = this.viewport.getDetailLevel();
    if (planetDetailLevel === null || planetDetailLevel < detailLevel + 1) {
      return;
    }

    const centerCanvasCoords = viewport.worldToCanvasCoords(center);
    const r = viewport.worldToCanvasDist(0.3 * radius);
    const orbit = viewport.worldToCanvasDist(1.2 * radius) + r;

    const [
      energyCapBonus,
      energyGroBonus,
      rangeBonus,
      speedBonus,
      defBonus,
    ] = bonusFromHex(planet.locationId);

    ctx.save();
    ctx.translate(centerCanvasCoords.x, centerCanvasCoords.y);

    const angle = this.now * 0.001;

    const drawAsteroid = (t: number, color: string) => {
      const theta = t + angle;
      const x = Math.cos(theta);
      const y = Math.sin(theta);

      // if (!this.highPerf) {
      //   const clip = (tt: number): number => tt % (Math.PI * 2);
      //   ctx.lineWidth = r;
      //   const oldAlpha = ctx.globalAlpha;
      //   for (let i = 1; i <= 8; i++) {
      //     ctx.globalAlpha = 0.04 * oldAlpha;

      //     ctx.beginPath();
      //     ctx.arc(0, 0, orbit, clip(theta - 0.1 * i), clip(theta));

      //     ctx.strokeStyle = color;
      //     ctx.stroke();
      //     ctx.strokeStyle = 'white';
      //     ctx.stroke();
      //     ctx.stroke();
      //   }
      //   ctx.globalAlpha = oldAlpha;
      // }

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(orbit * x, orbit * y, r, 0, 2 * Math.PI);
      ctx.fill();
    };

    const delT = 1.0;
    if (energyCapBonus) {
      drawAsteroid(0 * delT, dfstyles.game.bonuscolors.energyCap);
    }
    if (energyGroBonus) {
      drawAsteroid(1 * delT, dfstyles.game.bonuscolors.energyGro);
    }
    if (speedBonus) {
      drawAsteroid(2 * delT, dfstyles.game.bonuscolors.speed);
    }
    if (defBonus) {
      drawAsteroid(3 * delT, dfstyles.game.bonuscolors.def);
    }
    if (rangeBonus) {
      drawAsteroid(4 * delT, dfstyles.game.bonuscolors.range);
    }

    ctx.restore();
  }

  private drawRectBorderWithCenter(
    center: WorldCoords,
    width: number,
    height: number,
    strokeWidth: number,
    color = 'white'
  ) {
    const { viewport } = this;

    const centerCanvasCoords = viewport.worldToCanvasCoords(center);
    const widthCanvasCoords = viewport.worldToCanvasDist(width);
    const heightCanvasCoords = viewport.worldToCanvasDist(height);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.strokeRect(
      centerCanvasCoords.x - widthCanvasCoords / 2,
      centerCanvasCoords.y - heightCanvasCoords / 2,
      widthCanvasCoords,
      heightCanvasCoords
    );
  }

  private drawCircleWithCenter(
    center: WorldCoords,
    radius: number,
    color = 'white'
  ) {
    const { viewport } = this;

    const centerCanvasCoords = viewport.worldToCanvasCoords(center);
    const radiusCanvasCoords = viewport.worldToCanvasDist(radius);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(
      centerCanvasCoords.x,
      centerCanvasCoords.y,
      radiusCanvasCoords,
      0,
      2 * Math.PI,
      false
    );
    this.ctx.fill();
  }

  private drawPlanetBody(
    centerRaw: WorldCoords,
    radiusRaw: number,
    planet: Planet
  ) {
    const { ctx, viewport } = this;

    const center = viewport.worldToCanvasCoords(centerRaw);
    const radius = viewport.worldToCanvasDist(radiusRaw);

    ctx.save();
    ctx.translate(center.x, center.y);

    const colors = getPlanetCosmetic(planet);
    if (planet.planetResource === PlanetResource.NONE) {
      ctx.fillStyle = colors.previewColor;

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // silver-producing

      for (let i = 0; i < 5; i++) {
        const t = (i * (Math.PI * 2)) / 5 + this.now * 0.0003;

        ctx.fillStyle = colors.asteroidColor;
        ctx.beginPath();
        ctx.arc(
          radius * 0.6 * Math.cos(t),
          radius * 0.6 * Math.sin(t),
          radius * 0.3,
          0,
          2 * Math.PI
        );

        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawHalfRingWithCenter(
    centerRaw: WorldCoords,
    radiusRaw: number,
    ringNumber: number,
    rotation: number,
    isFlipped: boolean,
    color = 'white'
  ) {
    const { ctx, viewport } = this;
    const i = ringNumber;

    const center = viewport.worldToCanvasCoords(centerRaw);
    const radius = viewport.worldToCanvasDist(radiusRaw);
    ctx.fillStyle = color;

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(rotation);

    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      (1.4 + 0.45 * i) * radius,
      (0.5 + 0.15 * i) * radius,
      0,
      Math.PI,
      2 * Math.PI,
      !isFlipped
    );
    ctx.ellipse(
      0,
      0,
      (1.1 + 0.45 * i) * radius,
      (0.4 + 0.15 * i) * radius,
      0,
      2 * Math.PI,
      Math.PI,
      isFlipped
    );
    ctx.fill();

    ctx.restore();
  }

  private drawLoopWithCenter(
    center: WorldCoords,
    radius: number,
    width: number,
    color = 'white',
    dotted = false
  ) {
    this.drawArcWithCenter(center, radius, width, 100, color, dotted);
  }

  private drawArcWithCenter(
    center: WorldCoords,
    radius: number,
    width: number,
    percent: number,
    color = 'white',
    dotted = false
  ) {
    const { viewport } = this;

    const centerCanvasCoords = viewport.worldToCanvasCoords(center);
    const radiusCanvasCoords = viewport.worldToCanvasDist(radius);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    this.ctx.strokeStyle = color;
    // this.ctx.lineWidth = viewport.worldToCanvasDist(width);
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.arc(
      centerCanvasCoords.x,
      centerCanvasCoords.y,
      radiusCanvasCoords,
      1.5 * Math.PI,
      1.5 * Math.PI + (2 * Math.PI * percent) / 100,
      false
    );

    if (dotted) this.ctx.setLineDash([15, 15]);
    else this.ctx.setLineDash([]);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  private drawLine(
    startCoords: WorldCoords,
    endCoords: WorldCoords,
    lineWidth: number,
    color = 'white',
    dotted = false
  ) {
    const { viewport } = this;

    this.ctx.beginPath();
    // this.ctx.lineWidth = viewport.worldToCanvasDist(lineWidth);
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    const startCanvasCoords: CanvasCoords = viewport.worldToCanvasCoords(
      startCoords
    );
    this.ctx.moveTo(startCanvasCoords.x, startCanvasCoords.y);
    const endCanvasCoords: CanvasCoords = viewport.worldToCanvasCoords(
      endCoords
    );
    this.ctx.lineTo(endCanvasCoords.x, endCanvasCoords.y);

    if (dotted) this.ctx.setLineDash([15, 15]);
    else this.ctx.setLineDash([]);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  private drawText(
    text: string,
    fontSize: number,
    center: WorldCoords,
    color = 'white'
  ) {
    const { viewport } = this;

    const centerCanvasCoords = viewport.worldToCanvasCoords(center);

    this.ctx.font = `${fontSize}px sans-serif`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, centerCanvasCoords.x, centerCanvasCoords.y);
  }
}

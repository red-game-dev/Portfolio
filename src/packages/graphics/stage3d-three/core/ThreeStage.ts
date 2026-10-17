import {
  ACESFilmicToneMapping, Bone, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, Color, CylinderGeometry, DataTexture, DirectionalLight,
  DoubleSide, ExtrudeGeometry, Group, HemisphereLight, LinearFilter, LinearMipmapLinearFilter, Material, Mesh, MeshPhysicalMaterial,
  MeshStandardMaterial, PCFShadowMap, PerspectiveCamera, Plane, PlaneGeometry, PMREMGenerator, PointLight, RGBAFormat, Scene, ShadowMaterial, Shape,
  Skeleton as ThreeSkeleton, SkinnedMesh, SRGBColorSpace, Texture, Vector3, WebGLRenderer,
} from "three";

import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import {
  ActorSpec, Finish, MaterialSpec, MeshData, ModelAsset, ModelRegistry, PictureRect, SceneHandle, Stage, StageBox, StageFrame, StageScene, StageTarget,
  StageView, TextureData,
} from "@/packages/graphics/stage3d";

import { makeSkin, SkinUniforms } from "./skinShader";

// The stage on three.js: one WebGL renderer for the page, offscreen, its drawing buffer grown to the largest view it
// has drawn and each frame rendered into its corner at the size it is drawn at, then copied into the 2D target. Each
// model's geometry is uploaded once and shared by every actor and scene that shows it (each actor with a skeleton of
// its own); a room's light gives skin and metal something to reflect; the key light throws soft shadows on a catcher
// at the picture's plane, so a hand's shadow falls on the 2D drawing behind it. An actor can be cut where it passes into
// part of the picture (a card's end inside the terminal's reader). A scene's shaders are compiled as it is set up, so
// its first frame never stalls, and taking it down gives back everything it made.

interface MountedActor {
  spec: ActorSpec;
  group: Group;
  // Each skinned model part's own bones, by part.
  bones: Bone[][];
  // Its skins, for a camera's read of it.
  skins: SkinUniforms[];
}

interface MountedScene {
  scene: Scene;
  actors: Map<string, MountedActor>;
  lights: Map<string, DirectionalLight | PointLight | HemisphereLight>;
  key: DirectionalLight | null;
  // Where the key light stands from what it lights, kept as it follows the view.
  keyOffset: Vector3;
  skins: SkinUniforms[];
  // What the scene made and gives back when it is taken down.
  disposables: Array<{ dispose(): void }>;
  models: string[];
  pictures: string[];
}

// Each quality level's share of the device's pixels, the shadow map's size and the skin's fine detail.
const QUALITY = [
  { pixels: 0.6, shadow: 512, detail: 0 },
  { pixels: 0.8, shadow: 1024, detail: 0.5 },
  { pixels: 1, shadow: 1536, detail: 1 },
  { pixels: 1, shadow: 2048, detail: 1 },
];

// From this quality up, materials carry their costlier layers (sheen, clear coat, streaked metal, light through frost).
const RICH = 2;

type PhysicalParameters = ConstructorParameters<typeof MeshPhysicalMaterial>[0];

// Each finish as the physical material draws it, rich and plain: brushed metal streaked one way and coloured by its
// picture, a laminated gloss, a velvet matte, frosted plastic the light passes through (plain, only see through).
const FINISHES: Record<Finish, { rich: PhysicalParameters; plain: PhysicalParameters }> = {
  metal: {
    rich: { metalness: 1, roughness: 0.34, anisotropy: 0.65, clearcoat: 0.2, clearcoatRoughness: 0.3 },
    plain: { metalness: 1, roughness: 0.38 },
  },
  gloss: { rich: { roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.06 }, plain: { roughness: 0.3 } },
  matte: { rich: { roughness: 0.88, sheen: 0.25, sheenRoughness: 0.8 }, plain: { roughness: 0.88 } },
  frosted: {
    rich: { roughness: 0.5, transmission: 0.55, thickness: 0.8, ior: 1.46, transparent: true },
    plain: { roughness: 0.5, transparent: true, opacity: 0.82 },
  },
};

// How far the shadow camera reaches round the view's centre, in picture units.
const SHADOW_REACH = 220;

const geometryOf = (mesh: MeshData): BufferGeometry => {
  const geometry = new BufferGeometry();

  geometry.setAttribute("position", new BufferAttribute(mesh.positions, 3));
  geometry.setAttribute("normal", new BufferAttribute(mesh.normals, 3));
  geometry.setIndex(new BufferAttribute(mesh.indices, 1));

  if (mesh.colors) {
    geometry.setAttribute("color", new BufferAttribute(mesh.colors, 3));
  }

  if (mesh.uvs) {
    geometry.setAttribute("uv", new BufferAttribute(mesh.uvs, 2));
  }

  if (mesh.skinIndices && mesh.skinWeights) {
    geometry.setAttribute("skinIndex", new BufferAttribute(mesh.skinIndices, 4));
    geometry.setAttribute("skinWeight", new BufferAttribute(mesh.skinWeights, 4));
  }

  Object.entries(mesh.extras ?? {}).forEach(([name, { size, data }]) => geometry.setAttribute(name, new BufferAttribute(data, size)));
  geometry.computeBoundingSphere();

  return geometry;
};

// A model's texture as the GPU takes it: its values as they are (no colour space), smooth from near and far.
const textureOf = (data: TextureData): DataTexture => {
  const texture = new DataTexture(data.data, data.width, data.height, RGBAFormat);

  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  return texture;
};

// The planes whose inside together is a rectangle of the picture, deep as the stage: what lies inside all four is cut.
const cutOf = (rect: PictureRect): Plane[] => [
  new Plane(new Vector3(-1, 0, 0), rect.x),
  new Plane(new Vector3(1, 0, 0), -(rect.x + rect.width)),
  new Plane(new Vector3(0, -1, 0), -(rect.y + rect.height)),
  new Plane(new Vector3(0, 1, 0), rect.y),
];

// A thin plate with round corners of any radius (a card, a phone), its picture laid across its face edge to edge.
const plateGeometry = (width: number, height: number, depth: number, radius: number): BufferGeometry => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const corner = Math.min(radius, halfWidth, halfHeight);
  const outline = new Shape();

  outline.moveTo(-halfWidth + corner, -halfHeight);
  outline.lineTo(halfWidth - corner, -halfHeight);
  outline.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner);
  outline.lineTo(halfWidth, halfHeight - corner);
  outline.quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight);
  outline.lineTo(-halfWidth + corner, halfHeight);
  outline.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner);
  outline.lineTo(-halfWidth, -halfHeight + corner);
  outline.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight);

  const geometry = new ExtrudeGeometry(outline, { depth, bevelEnabled: false, curveSegments: 8 });
  const position = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");

  geometry.translate(0, 0, -depth / 2);

  for (let vertex = 0; vertex < position.count; vertex += 1) {
    uv.setXY(vertex, (position.getX(vertex) + halfWidth) / width, (position.getY(vertex) + halfHeight) / height);
  }

  uv.needsUpdate = true;

  return geometry;
};

export class ThreeStage extends Stage {
  public readonly id = "three";
  private renderer: WebGLRenderer | null = null;
  private environment: Texture | null = null;
  private level = QUALITY.length - 1;
  private readonly geometries = new Map<string, { parts: BufferGeometry[]; textures: Map<string, DataTexture>; users: number }>();
  private readonly pictures = new Map<string, { texture: CanvasTexture; version: number; users: number }>();
  private readonly scenes = new Map<number, MountedScene>();
  private readonly camera = new PerspectiveCamera(30, 1, 1, 4000);
  private readonly scratch = { centre: new Vector3(), towards: new Vector3(), colour: new Color() };
  private bufferWidth = 0;
  private bufferHeight = 0;
  private nextId = 1;

  constructor(models: ModelRegistry) {
    super(models);
  }

  public get quality(): number {
    return this.level;
  }

  public prepare(): Promise<boolean> {
    if (typeof document === "undefined") {
      return Promise.resolve(false);
    }

    try {
      const canvas = document.createElement("canvas");
      const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true });

      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFShadowMap;
      renderer.localClippingEnabled = true;
      renderer.setClearColor(0x000000, 0);
      canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        this.lose();
      });

      const pmrem = new PMREMGenerator(renderer);

      this.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
      this.renderer = renderer;

      return Promise.resolve(true);
    } catch {
      return Promise.resolve(false);
    }
  }

  public async mount(spec: StageScene): Promise<SceneHandle> {
    const modelIds = [...new Set(spec.actors.flatMap((actor) => actor.parts.flatMap((part) => (part.shape.kind === "model" ? [part.shape.model] : []))))];
    const assets = new Map((await Promise.all(modelIds.map((model) => this.models.load(model)))).map((asset, index) => [modelIds[index], asset]));
    const scene = new Scene();
    const mounted: MountedScene = {
      scene,
      actors: new Map(),
      lights: new Map(),
      key: null,
      keyOffset: new Vector3(),
      skins: [],
      disposables: [],
      models: modelIds,
      pictures: [],
    };

    scene.environment = this.environment;
    scene.environmentIntensity = 0.35;
    modelIds.forEach((model) => this.claim(model, assets.get(model)));

    spec.lights.forEach((light) => {
      const colour = new Color(light.colour);
      const made = light.kind === "ambient"
        ? new HemisphereLight(colour, new Color("#241a14"), light.intensity)
        : light.kind === "glow"
          ? new PointLight(colour, light.intensity, light.reach ?? 0, 1)
          : new DirectionalLight(colour, light.intensity);

      if (light.position) {
        made.position.set(light.position.x, light.position.y, light.position.z);
      }

      if (made instanceof DirectionalLight && light.castsShadow) {
        made.castShadow = true;
        made.shadow.bias = -0.0006;
        made.shadow.normalBias = 0.6;
        made.shadow.radius = 5;
        mounted.key = made;
        mounted.keyOffset.copy(made.position).sub(made.target.position);
        scene.add(made.target);
        mounted.disposables.push(made.shadow);
      }

      mounted.lights.set(light.id, made);
      scene.add(made);
    });

    if (spec.shadow) {
      const plane = new PlaneGeometry(4000, 4000);
      const material = new ShadowMaterial({ opacity: spec.shadow.opacity });
      const catcher = new Mesh(plane, material);

      catcher.receiveShadow = true;
      scene.add(catcher);
      mounted.disposables.push(plane, material);
    }

    spec.actors.forEach((actor) => mounted.actors.set(actor.id, this.build(actor, assets, mounted)));

    const id = this.nextId;

    this.nextId += 1;
    this.scenes.set(id, mounted);
    this.applyQuality(mounted);

    // Every shader the scene needs, compiled now (off the main thread where the browser can), so its first frame
    // draws at once.
    if (this.renderer) {
      this.look({ width: 300, height: 210, centre: { x: 150, y: 105 }, zoom: 1, fov: 30 });
      await this.renderer.compileAsync(scene, this.camera).catch(() => undefined);
    }

    return { id };
  }

  public setPicture(id: string, source: TexImageSource, version: number): void {
    const picture = this.pictureOf(id);

    if (picture.version === version) {
      return;
    }

    picture.texture.image = source as HTMLCanvasElement;
    picture.texture.needsUpdate = true;
    picture.version = version;
  }

  public draw(handle: SceneHandle, frame: StageFrame, target: StageTarget, box: StageBox, pixels: { width: number; height: number }): void {
    const renderer = this.renderer;
    const mounted = this.scenes.get(handle.id);

    if (!renderer || !mounted) {
      return;
    }

    const share = QUALITY[this.level].pixels;
    const width = Math.max(1, Math.round(pixels.width * share));
    const height = Math.max(1, Math.round(pixels.height * share));

    if (width > this.bufferWidth || height > this.bufferHeight) {
      this.bufferWidth = Math.max(width, this.bufferWidth);
      this.bufferHeight = Math.max(height, this.bufferHeight);
      renderer.setSize(this.bufferWidth, this.bufferHeight, false);
    }

    this.frame(mounted, frame);
    renderer.setViewport(0, 0, width, height);
    renderer.setScissor(0, 0, width, height);
    renderer.setScissorTest(true);
    renderer.clear();
    renderer.render(mounted.scene, this.camera);
    renderer.setScissorTest(false);
    target.drawImage(renderer.domElement, 0, this.bufferHeight - height, width, height, box.x, box.y, box.width, box.height);
  }

  public unmount(handle: SceneHandle): void {
    const mounted = this.scenes.get(handle.id);

    if (!mounted) {
      return;
    }

    mounted.disposables.forEach((disposable) => disposable.dispose());
    mounted.models.forEach((model) => this.release(model));
    mounted.pictures.forEach((picture) => this.releasePicture(picture));
    this.scenes.delete(handle.id);
  }

  public setQuality(level: number): void {
    this.level = Math.min(Math.max(Math.round(level), 0), QUALITY.length - 1);
    this.scenes.forEach((mounted) => this.applyQuality(mounted));
  }

  public dispose(): void {
    [...this.scenes.keys()].forEach((id) => this.unmount({ id }));
    this.pictures.forEach(({ texture }) => texture.dispose());
    this.pictures.clear();
    this.environment?.dispose();
    this.renderer?.dispose();
    this.renderer = null;
  }

  // A picture's texture, made blank the first time a material or the host asks for it and filled when it is handed.
  private pictureOf(id: string): { texture: CanvasTexture; version: number; users: number } {
    const known = this.pictures.get(id);

    if (known) {
      return known;
    }

    const blank = document.createElement("canvas");

    blank.width = 1;
    blank.height = 1;

    const texture = new CanvasTexture(blank);
    const picture = { texture, version: -1, users: 0 };

    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    this.pictures.set(id, picture);

    return picture;
  }

  // A picture no scene shows any more is given back.
  private releasePicture(id: string): void {
    const picture = this.pictures.get(id);

    if (!picture) {
      return;
    }

    picture.users -= 1;

    if (picture.users <= 0) {
      picture.texture.dispose();
      this.pictures.delete(id);
    }
  }

  // A model's geometry, uploaded the first time a scene shows it and kept while any does.
  private claim(model: string, asset: ModelAsset | undefined): void {
    const known = this.geometries.get(model);

    if (known) {
      known.users += 1;

      return;
    }

    this.geometries.set(model, {
      parts: (asset?.parts ?? []).map((part) => geometryOf(part.mesh)),
      textures: new Map(Object.entries(asset?.textures ?? {}).map(([id, data]) => [id, textureOf(data)])),
      users: 1,
    });
  }

  private release(model: string): void {
    const known = this.geometries.get(model);

    if (!known) {
      return;
    }

    known.users -= 1;

    if (known.users <= 0) {
      known.parts.forEach((geometry) => geometry.dispose());
      known.textures.forEach((texture) => texture.dispose());
      this.geometries.delete(model);
    }
  }

  private materialOf(spec: MaterialSpec, tint: string | undefined, mounted: MountedScene, textures?: Map<string, DataTexture>, skins?: SkinUniforms[]): Material {
    const colour = new Color(tint ?? spec.colour ?? "#ffffff");
    const isRich = this.level >= RICH;
    let material: Material;

    if (spec.kind === "skin") {
      const skin = new MeshPhysicalMaterial({
        color: colour,
        vertexColors: true,
        roughness: spec.roughness ?? 0.5,
        specularIntensity: 0.55,
        ...(isRich ? { sheen: 0.55, sheenColor: new Color("#ffc6b2"), sheenRoughness: 0.45, clearcoat: 0.12, clearcoatRoughness: 0.38 } : {}),
      });

      const uniforms = makeSkin(skin, (spec.detail && textures?.get(spec.detail)) || null);

      mounted.skins.push(uniforms);
      skins?.push(uniforms);
      material = skin;
    } else if (spec.kind === "nail") {
      material = new MeshPhysicalMaterial({ vertexColors: true, roughness: 0.24, side: DoubleSide, ...(isRich ? { clearcoat: 0.85, clearcoatRoughness: 0.12 } : {}) });
    } else if (spec.kind === "cloth") {
      material = new MeshPhysicalMaterial({
        color: colour,
        roughness: spec.roughness ?? 0.88,
        ...(isRich ? { sheen: 0.7, sheenColor: colour.clone().offsetHSL(0, 0, 0.2), sheenRoughness: 0.6 } : {}),
      });
    } else if (spec.kind === "metal") {
      material = new MeshStandardMaterial({ color: colour, metalness: 1, roughness: spec.roughness ?? 0.22 });
    } else if (spec.kind === "picture") {
      const finish = FINISHES[spec.finish ?? "gloss"];
      const map = spec.picture ? this.pictureOf(spec.picture).texture : null;

      if (spec.picture) {
        this.pictureOf(spec.picture).users += 1;
        mounted.pictures.push(spec.picture);
      }

      // Its picture's clipped corners left out, should the plate be squarer than the print.
      material = new MeshPhysicalMaterial({ color: colour, map, alphaTest: 0.5, ...(isRich ? finish.rich : finish.plain) });
    } else {
      material = new MeshStandardMaterial({ color: colour, roughness: spec.roughness ?? 0.6 });
    }

    mounted.disposables.push(material);

    return material;
  }

  private build(spec: ActorSpec, assets: Map<string, ModelAsset>, mounted: MountedScene): MountedActor {
    const group = new Group();
    const bones: Bone[][] = [];
    const skins: SkinUniforms[] = [];
    const cut = spec.hiddenInside ? cutOf(spec.hiddenInside) : null;
    // Its materials, cut where the actor passes into its part of the picture.
    const dressed = (material: Material): Material => {
      if (cut) {
        material.clippingPlanes = cut;
        material.clipIntersection = true;
        material.clipShadows = true;
      }

      return material;
    };

    group.scale.setScalar(spec.unit ?? 1);
    group.visible = false;

    spec.parts.forEach((part) => {
      const holder = new Group();

      if (part.offset) {
        holder.position.set(part.offset.x, part.offset.y, part.offset.z);
      }

      if (part.turn) {
        holder.quaternion.set(part.turn.x, part.turn.y, part.turn.z, part.turn.w);
      }

      if (part.scale) {
        holder.scale.set(part.scale.x, part.scale.y, part.scale.z);
      }

      group.add(holder);

      if (part.shape.kind === "model") {
        const asset = assets.get(part.shape.model);
        const uploaded = this.geometries.get(part.shape.model);
        const geometries = uploaded?.parts ?? [];
        const tints = part.shape.tints;

        if (!asset) {
          return;
        }

        const partBones: Bone[] = [];
        let skeleton: ThreeSkeleton | null = null;

        if (asset.skeleton) {
          const { joints } = asset.skeleton;

          joints.forEach((joint, index) => {
            const bone = new Bone();
            const parent = joint.parent >= 0 ? joints[joint.parent].position : { x: 0, y: 0, z: 0 };
            const bind = asset.bindTurns?.[index];

            bone.position.set(joint.position.x - parent.x, joint.position.y - parent.y, joint.position.z - parent.z);

            if (bind) {
              bone.quaternion.set(bind.x, bind.y, bind.z, bind.w);
            }

            (joint.parent >= 0 ? partBones[joint.parent] : holder).add(bone);
            partBones.push(bone);
          });
          skeleton = new ThreeSkeleton(partBones);
          mounted.disposables.push(skeleton);
          bones.push(partBones);
        }

        asset.parts.forEach((assetPart, index) => {
          const skinsBefore = skins.length;
          const material = dressed(this.materialOf(assetPart.material, tints?.[assetPart.name], mounted, uploaded?.textures, skins));
          const geometry = geometries[index];

          // A skin's read sweeps its own height.
          if (skins.length > skinsBefore) {
            geometry.computeBoundingBox();

            const box = geometry.boundingBox;

            skins[skins.length - 1].scanRange.value = { x: box?.min.y ?? 0, y: box?.max.y ?? 1 };
          }
          const mesh = skeleton && geometry.getAttribute("skinIndex") ? new SkinnedMesh(geometry, material) : new Mesh(geometry, material);

          mesh.castShadow = Boolean(spec.castsShadow);
          mesh.frustumCulled = false;
          holder.add(mesh);

          if (mesh instanceof SkinnedMesh && skeleton) {
            holder.updateMatrixWorld(true);
            mesh.bind(skeleton);
          }
        });

        return;
      }

      const shape = part.shape;
      const geometry = shape.kind === "box"
        ? new BoxGeometry(shape.width, shape.height, shape.depth)
        : shape.kind === "plate"
          ? plateGeometry(shape.width, shape.height, shape.depth, shape.radius)
          : new CylinderGeometry(shape.radiusTop, shape.radiusBottom, shape.length, 28);
      const material = dressed(this.materialOf(part.material ?? { kind: "matte" }, undefined, mounted));
      const mesh = new Mesh(geometry, material);

      mesh.castShadow = Boolean(spec.castsShadow);
      holder.add(mesh);
      mounted.disposables.push(geometry);
    });

    mounted.scene.add(group);

    return { spec, group, bones, skins };
  }

  private frame(mounted: MountedScene, frame: StageFrame): void {
    frame.actors.forEach((state) => {
      const actor = mounted.actors.get(state.id);

      if (!actor) {
        return;
      }

      actor.group.visible = state.isShown;

      if (!state.isShown) {
        return;
      }

      actor.group.position.set(state.position.x, state.position.y, state.position.z);
      actor.group.quaternion.set(state.rotation.x, state.rotation.y, state.rotation.z, state.rotation.w);

      actor.skins.forEach((skin) => {
        skin.scan.value = state.scan ? state.scan.progress : -1;

        if (state.scan) {
          this.scratch.colour.set(state.scan.colour);
          skin.scanColour.value.r = this.scratch.colour.r;
          skin.scanColour.value.g = this.scratch.colour.g;
          skin.scanColour.value.b = this.scratch.colour.b;
        }
      });

      if (state.joints) {
        const turns = state.joints;

        actor.bones.forEach((partBones) => partBones.forEach((bone, index) => {
          const turn = turns[index];

          bone.quaternion.set(turn?.x ?? 0, turn?.y ?? 0, turn?.z ?? 0, turn?.w ?? 1);
        }));
      }
    });

    if (frame.lights) {
      Object.entries(frame.lights).forEach(([id, change]) => {
        const light = mounted.lights.get(id);

        if (light && change.intensity !== undefined) {
          light.intensity = change.intensity;
        }

        if (light && change.colour) {
          light.color.set(change.colour);
        }
      });
    }

    this.look(frame.view);

    if (!mounted.key) {
      return;
    }

    // The key light follows the view, so its shadow camera covers what is seen.
    const { centre, towards } = this.scratch;

    centre.set(frame.view.centre.x, -frame.view.centre.y, 0);
    mounted.key.target.position.copy(centre);
    mounted.key.position.copy(centre).add(mounted.keyOffset);
    mounted.key.updateMatrixWorld();
    mounted.key.target.updateMatrixWorld();

    // Its direction in view space, for the skin's light through it.
    towards.copy(mounted.keyOffset).normalize()
.transformDirection(this.camera.matrixWorldInverse);

    const strength = Math.min(mounted.key.intensity / 2.5, 1.5);
    const { r, g, b } = mounted.key.color;

    mounted.skins.forEach((skin) => {
      const direction = skin.keyDirection.value;
      const colour = skin.keyColour.value;

      direction.x = towards.x;
      direction.y = towards.y;
      direction.z = towards.z;
      colour.r = r * strength;
      colour.g = g * strength;
      colour.b = b * strength;
    });
  }

  // A camera looking straight at the picture's plane, framing exactly what the 2D camera shows.
  private look(view: StageView): void {
    const height = view.height / view.zoom;
    const distance = height / 2 / Math.tan((view.fov * Math.PI) / 360);

    this.camera.fov = view.fov;
    this.camera.aspect = view.width / view.height;
    this.camera.near = Math.max(1, distance * 0.2);
    this.camera.far = distance * 4;
    this.camera.position.set(view.centre.x, -view.centre.y, distance);
    this.camera.lookAt(view.centre.x, -view.centre.y, 0);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  private applyQuality(mounted: MountedScene): void {
    const { shadow, detail } = QUALITY[this.level];

    if (mounted.key && mounted.key.shadow.mapSize.x !== shadow) {
      mounted.key.shadow.mapSize.set(shadow, shadow);
      mounted.key.shadow.map?.dispose();
      mounted.key.shadow.map = null;
    }

    if (mounted.key) {
      Object.assign(mounted.key.shadow.camera, { left: -SHADOW_REACH, right: SHADOW_REACH, top: SHADOW_REACH, bottom: -SHADOW_REACH, near: 10, far: 1200 });
      mounted.key.shadow.camera.updateProjectionMatrix();
    }

    mounted.skins.forEach((skin) => {
      skin.detail.value = detail;
    });
  }
}

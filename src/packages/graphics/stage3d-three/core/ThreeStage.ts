import {
  ACESFilmicToneMapping, Bone, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, Color, CylinderGeometry, DirectionalLight, DoubleSide,
  Group, HemisphereLight, Material, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PCFShadowMap, PerspectiveCamera,
  PlaneGeometry, PMREMGenerator, PointLight, Scene, ShadowMaterial, Skeleton as ThreeSkeleton, SkinnedMesh, SRGBColorSpace, Texture,
  Vector3, WebGLRenderer,
} from "three";

import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import {
  ActorSpec, Finish, MaterialSpec, MeshData, ModelAsset, ModelRegistry, SceneHandle, Stage, StageFrame, StageScene, StageTarget, StageView,
} from "@/packages/graphics/stage3d";

import { makeSkin, SkinUniforms } from "./skinShader";

// The stage on three.js: one WebGL renderer for the page, offscreen, its drawing buffer grown to the largest view it
// has drawn and each frame rendered into its corner at the size it is drawn at, then copied into the 2D target. Each
// model's geometry is uploaded once and shared by every actor and scene that shows it (each actor with a skeleton of
// its own); a room's light gives skin and metal something to reflect; the key light throws soft shadows on a catcher
// at the picture's plane, so a hand's shadow falls on the 2D drawing behind it.

interface MountedActor {
  spec: ActorSpec;
  group: Group;
  bones: Bone[];
}

interface MountedScene {
  scene: Scene;
  actors: Map<string, MountedActor>;
  lights: Map<string, DirectionalLight | PointLight | HemisphereLight>;
  key: DirectionalLight | null;
  skins: SkinUniforms[];
  materials: Material[];
  models: string[];
}

// Each quality level's share of the device's pixels, the shadow map's size and the skin's fine detail.
const QUALITY = [
  { pixels: 0.6, shadow: 512, detail: 0 },
  { pixels: 0.8, shadow: 1024, detail: 0.5 },
  { pixels: 1, shadow: 1536, detail: 1 },
  { pixels: 1, shadow: 2048, detail: 1 },
];

// Each finish as the physical material draws it: brushed metal streaked one way and coloured by its picture, a
// laminated gloss, a velvet matte, frosted plastic the light passes through.
const FINISHES: Record<Finish, ConstructorParameters<typeof MeshPhysicalMaterial>[0]> = {
  metal: { metalness: 1, roughness: 0.34, anisotropy: 0.65, clearcoat: 0.2, clearcoatRoughness: 0.3 },
  gloss: { roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.06 },
  matte: { roughness: 0.88, sheen: 0.25, sheenRoughness: 0.8 },
  frosted: { roughness: 0.5, transmission: 0.55, thickness: 0.8, ior: 1.46, transparent: true },
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

  if (mesh.skinIndices && mesh.skinWeights) {
    geometry.setAttribute("skinIndex", new BufferAttribute(mesh.skinIndices, 4));
    geometry.setAttribute("skinWeight", new BufferAttribute(mesh.skinWeights, 4));
  }

  Object.entries(mesh.extras ?? {}).forEach(([name, { size, data }]) => geometry.setAttribute(name, new BufferAttribute(data, size)));
  geometry.computeBoundingSphere();

  return geometry;
};

export class ThreeStage extends Stage {
  public readonly id = "three";
  private renderer: WebGLRenderer | null = null;
  private environment: Texture | null = null;
  private quality = QUALITY.length - 1;
  private readonly geometries = new Map<string, { parts: BufferGeometry[]; users: number }>();
  private readonly pictures = new Map<string, { texture: CanvasTexture; version: number }>();
  private readonly scenes = new Map<number, MountedScene>();
  private readonly camera = new PerspectiveCamera(30, 1, 1, 4000);
  private bufferWidth = 0;
  private bufferHeight = 0;
  private nextId = 1;

  constructor(models: ModelRegistry) {
    super(models);
  }

  public prepare(): Promise<boolean> {
    if (typeof document === "undefined") {
      return Promise.resolve(false);
    }

    try {
      const canvas = document.createElement("canvas");
      const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });

      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFShadowMap;
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
    const mounted: MountedScene = { scene, actors: new Map(), lights: new Map(), key: null, skins: [], materials: [], models: modelIds };

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
        scene.add(made.target);
      }

      mounted.lights.set(light.id, made);
      scene.add(made);
    });

    if (spec.shadow) {
      const catcher = new Mesh(new PlaneGeometry(4000, 4000), new ShadowMaterial({ opacity: spec.shadow.opacity }));

      catcher.receiveShadow = true;
      scene.add(catcher);
      mounted.materials.push(catcher.material);
    }

    spec.actors.forEach((actor) => mounted.actors.set(actor.id, this.build(actor, assets, mounted)));

    const id = this.nextId;

    this.nextId += 1;
    this.scenes.set(id, mounted);
    this.applyQuality(mounted);

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

  public draw(handle: SceneHandle, frame: StageFrame, target: StageTarget, box: { x: number; y: number; width: number; height: number }): void {
    const renderer = this.renderer;
    const mounted = this.scenes.get(handle.id);

    if (!renderer || !mounted) {
      return;
    }

    const transform = typeof target.getTransform === "function" ? target.getTransform() : null;
    const share = QUALITY[this.quality].pixels;
    const width = Math.max(1, Math.round(box.width * (transform ? Math.hypot(transform.a, transform.b) : 1) * share));
    const height = Math.max(1, Math.round(box.height * (transform ? Math.hypot(transform.c, transform.d) : 1) * share));

    if (width > this.bufferWidth || height > this.bufferHeight) {
      this.bufferWidth = Math.max(width, this.bufferWidth);
      this.bufferHeight = Math.max(height, this.bufferHeight);
      renderer.setSize(this.bufferWidth, this.bufferHeight, false);
    }

    this.frame(mounted, frame);
    this.look(frame.view);
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

    mounted.materials.forEach((material) => material.dispose());
    mounted.models.forEach((model) => this.release(model));
    this.scenes.delete(handle.id);
  }

  public setQuality(level: number): void {
    this.quality = Math.min(Math.max(Math.round(level), 0), QUALITY.length - 1);
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
  private pictureOf(id: string): { texture: CanvasTexture; version: number } {
    const known = this.pictures.get(id);

    if (known) {
      return known;
    }

    const blank = document.createElement("canvas");

    blank.width = 1;
    blank.height = 1;

    const texture = new CanvasTexture(blank);
    const picture = { texture, version: -1 };

    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    this.pictures.set(id, picture);

    return picture;
  }

  // A model's geometry, uploaded the first time a scene shows it and kept while any does.
  private claim(model: string, asset: ModelAsset | undefined): void {
    const known = this.geometries.get(model);

    if (known) {
      known.users += 1;

      return;
    }

    this.geometries.set(model, { parts: (asset?.parts ?? []).map((part) => geometryOf(part.mesh)), users: 1 });
  }

  private release(model: string): void {
    const known = this.geometries.get(model);

    if (!known) {
      return;
    }

    known.users -= 1;

    if (known.users <= 0) {
      known.parts.forEach((geometry) => geometry.dispose());
      this.geometries.delete(model);
    }
  }

  private materialOf(spec: MaterialSpec, tint: string | undefined, mounted: MountedScene): Material {
    const colour = new Color(tint ?? spec.colour ?? "#ffffff");
    let material: Material;

    if (spec.kind === "skin") {
      const skin = new MeshPhysicalMaterial({
        color: colour,
        vertexColors: true,
        roughness: spec.roughness ?? 0.5,
        sheen: 0.55,
        sheenColor: new Color("#ffc6b2"),
        sheenRoughness: 0.45,
        clearcoat: 0.12,
        clearcoatRoughness: 0.38,
        specularIntensity: 0.55,
      });

      mounted.skins.push(makeSkin(skin));
      material = skin;
    } else if (spec.kind === "nail") {
      material = new MeshPhysicalMaterial({ vertexColors: true, roughness: 0.24, clearcoat: 0.85, clearcoatRoughness: 0.12, side: DoubleSide });
    } else if (spec.kind === "cloth") {
      material = new MeshPhysicalMaterial({
        color: colour,
        roughness: spec.roughness ?? 0.88,
        sheen: 0.7,
        sheenColor: colour.clone().offsetHSL(0, 0, 0.2),
        sheenRoughness: 0.6,
      });
    } else if (spec.kind === "metal") {
      material = new MeshStandardMaterial({ color: colour, metalness: 1, roughness: spec.roughness ?? 0.22 });
    } else if (spec.kind === "picture") {
      const map = spec.picture ? this.pictureOf(spec.picture).texture : null;

      material = new MeshPhysicalMaterial({ color: colour, map, ...FINISHES[spec.finish ?? "gloss"] });
    } else {
      material = new MeshStandardMaterial({ color: colour, roughness: spec.roughness ?? 0.6 });
    }

    mounted.materials.push(material);

    return material;
  }

  private build(spec: ActorSpec, assets: Map<string, ModelAsset>, mounted: MountedScene): MountedActor {
    const group = new Group();
    const bones: Bone[] = [];

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
        const geometries = this.geometries.get(part.shape.model)?.parts ?? [];

        if (!asset) {
          return;
        }

        let skeleton: ThreeSkeleton | null = null;

        if (asset.skeleton) {
          asset.skeleton.joints.forEach((joint) => {
            const bone = new Bone();
            const parent = joint.parent >= 0 ? asset.skeleton?.joints[joint.parent].position : { x: 0, y: 0, z: 0 };

            const bind = asset.bindTurns?.[bones.length];

            bone.position.set(joint.position.x - (parent?.x ?? 0), joint.position.y - (parent?.y ?? 0), joint.position.z - (parent?.z ?? 0));

            if (bind) {
              bone.quaternion.set(bind.x, bind.y, bind.z, bind.w);
            }

            (joint.parent >= 0 ? bones[joint.parent] : holder).add(bone);
            bones.push(bone);
          });
          skeleton = new ThreeSkeleton(bones);
        }

        asset.parts.forEach((assetPart, index) => {
          const tint = part.shape.kind === "model" ? part.shape.tints?.[assetPart.name] : undefined;
          const material = spec.isOccluder ? this.occluder(mounted) : this.materialOf(assetPart.material, tint, mounted);
          const geometry = geometries[index];
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
          ? new RoundedBoxGeometry(shape.width, shape.height, shape.depth, 3, shape.radius)
          : new CylinderGeometry(shape.radiusTop, shape.radiusBottom, shape.length, 28);
      const material = spec.isOccluder ? this.occluder(mounted) : this.materialOf(part.material ?? { kind: "matte" }, undefined, mounted);
      const mesh = new Mesh(geometry, material);

      mesh.castShadow = Boolean(spec.castsShadow);
      holder.add(mesh);
      mounted.materials.push({ dispose: () => geometry.dispose() } as Material);
    });

    mounted.scene.add(group);

    return { spec, group, bones };
  }

  // Writes depth and nothing else, so what passes behind it is hidden and the 2D drawing shows through.
  private occluder(mounted: MountedScene): Material {
    const material = new MeshStandardMaterial({ colorWrite: false });

    mounted.materials.push(material);

    return material;
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
      state.joints?.forEach((turn, index) => {
        const bone = actor.bones[index];

        if (bone) {
          bone.quaternion.set(turn?.x ?? 0, turn?.y ?? 0, turn?.z ?? 0, turn?.w ?? 1);
        }
      });
    });

    Object.entries(frame.lights ?? {}).forEach(([id, change]) => {
      const light = mounted.lights.get(id);

      if (light && change.intensity !== undefined) {
        light.intensity = change.intensity;
      }

      if (light && change.colour) {
        light.color.set(change.colour);
      }
    });

    const centre = new Vector3(frame.view.centre.x, -frame.view.centre.y, 0);

    if (mounted.key) {
      const offset = mounted.key.position.clone().sub(mounted.key.target.position);

      mounted.key.target.position.copy(centre);
      mounted.key.position.copy(centre).add(offset);
      mounted.key.updateMatrixWorld();
      mounted.key.target.updateMatrixWorld();
    }

    // The key light's direction in view space, for the skin's light through it.
    this.look(frame.view);
    this.camera.updateMatrixWorld();

    const towards = mounted.key ? mounted.key.position.clone().sub(mounted.key.target.position)
.normalize() : new Vector3(0.3, 0.6, 0.7);
    const inView = towards.transformDirection(this.camera.matrixWorldInverse);
    const keyColour = mounted.key?.color ?? new Color(1, 1, 1);
    const strength = mounted.key ? Math.min(mounted.key.intensity / 2.5, 1.5) : 1;

    mounted.skins.forEach((skin) => {
      skin.keyDirection.value = { x: inView.x, y: inView.y, z: inView.z };
      skin.keyColour.value = { r: keyColour.r * strength, g: keyColour.g * strength, b: keyColour.b * strength };
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
  }

  private applyQuality(mounted: MountedScene): void {
    const { shadow, detail } = QUALITY[this.quality];

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


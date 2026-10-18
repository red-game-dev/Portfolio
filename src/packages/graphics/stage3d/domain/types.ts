import type { Canvas2DContext } from "@/packages/graphics/canvas";
import type { Quat, Vec3 } from "@/packages/math/space";

// A mesh as plain typed arrays, so it crosses from a worker without a copy and any renderer can draw it.
export interface MeshData {
  // Three values per vertex.
  positions: Float32Array;
  normals: Float32Array;
  // Three per triangle.
  indices: Uint32Array;
  // A colour per vertex (linear red, green and blue) that the material's own colour is multiplied by.
  colors?: Float32Array;
  // Two per vertex: where it falls on the textures its model carries.
  uvs?: Float32Array;
  // Four joints per vertex and how much each moves it, the four summing to 1.
  skinIndices?: Uint16Array;
  skinWeights?: Float32Array;
  // Anything else a material reads, by name, with its values per vertex.
  extras?: Record<string, { size: number; data: Float32Array }>;
}

// A skeleton at rest: joints listed after their parents, each at its place in the model's space, none turned.
export interface SkeletonJoint {
  name: string;
  parent: number;
  position: Vec3;
}

export interface Skeleton {
  joints: SkeletonJoint[];
}

// Each joint's turn from rest in its parent's frame, by index; a joint left out stays at rest.
export type JointTurns = Array<Quat | undefined>;

// How the 3D world lines up with a 2D picture drawn in its own units, y down: the stage looks straight at the
// picture's plane (z = 0, z growing towards the viewer) and frames exactly what a 2D camera at `centre` and `zoom`
// shows of a `width` by `height` picture, so 3D drawn over 2D lands where the 2D would.
export interface StageView {
  width: number;
  height: number;
  centre: { x: number; y: number };
  zoom: number;
  // The lens's vertical field of view in degrees: narrower is flatter, wider shows more depth.
  fov: number;
}

export type LightKind = "ambient" | "key" | "rim" | "glow";

export interface LightSpec {
  id: string;
  kind: LightKind;
  colour: string;
  intensity: number;
  // Where it shines from (a key or a rim) or stands (a glow), in stage space.
  position?: Vec3;
  // A glow's reach.
  reach?: number;
  // A key light throws soft shadows on the catcher and on everything that takes them.
  castsShadow?: boolean;
}

// How a surface is drawn: skin (light through it at its edges, a sheen, pores and creases from its extras), a
// nail's gloss, cloth, polished metal, a plain finish, or a picture painted in 2D (a card's face, a phone's screen).
export type MaterialKind = "skin" | "nail" | "cloth" | "metal" | "matte" | "picture";

// How a picture's surface is finished: brushed metal, glossy plastic, velvet matte, or frosted and clear.
export type Finish = "metal" | "gloss" | "matte" | "frosted";

export interface MaterialSpec {
  kind: MaterialKind;
  colour?: string;
  roughness?: number;
  // The id of a texture its model carries, read as the kind reads it: for skin, red how far the skin stands up (a vein
  // under it), green how much a vein's blue shows through, blue how thick its fine hair grows.
  detail?: string;
  // Pictures by their address, for a model made elsewhere: its colour, and the way its surface faces in fine detail.
  image?: string;
  normalImage?: string;
  // Where its picture is clearer than this (0 to 1), the surface is cut away: hair drawn as strands on cards.
  cutout?: number;
  isDoubleSided?: boolean;
  // The id of a picture the host paints and hands the stage with `setPicture`, and how its surface is finished.
  picture?: string;
  finish?: Finish;
}

// A model as a slot fills it: its parts, each a mesh with the material it is drawn in, and the skeleton that moves
// them (skinned parts follow its joints), in the model's own units.
export interface ModelPart {
  name: string;
  mesh: MeshData;
  material: MaterialSpec;
}

// A named place on a model to hold it by (a fingertip's pad, the thumb's): on a joint, offset in the joint's rest
// frame, with the way it faces forward and up there, so it moves with the joint wherever the model is posed.
export interface ModelSocket {
  joint: number;
  offset: Vec3;
  forward: Vec3;
  up: Vec3;
}

// A texture a model carries for its materials, four channels to a texel (each 0 to 255, not a colour space's), in rows
// from the bottom up.
export interface TextureData {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface ModelAsset {
  id: string;
  parts: ModelPart[];
  textures?: Record<string, TextureData>;
  skeleton?: Skeleton;
  // The turns the skeleton's joints have in the pose the mesh was made in, which the skin is bound at.
  bindTurns?: JointTurns;
}

// What an actor is made of: a model from a slot by its id (its materials can be tinted, a skin tone or a sleeve's
// colour, by part name), or a simple shape in picture units.
export type ShapeSpec =
  | { kind: "model"; model: string; tints?: Record<string, string> }
  | { kind: "box"; width: number; height: number; depth: number }
  | { kind: "cylinder"; radiusTop: number; radiusBottom: number; length: number }
  | { kind: "plate"; width: number; height: number; depth: number; radius: number };

export interface ActorPart {
  shape: ShapeSpec;
  // Stretched along each axis (a sleeve flattened to the arm's oval).
  scale?: Vec3;
  // A shape's material; a model brings its own.
  material?: MaterialSpec;
  // Where the part sits on the actor, in picture units, turned (a sleeve on an arm).
  offset?: Vec3;
  turn?: Quat;
}

// A rectangle of the picture, in its units (y down).
export interface PictureRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ActorSpec {
  id: string;
  parts: ActorPart[];
  castsShadow?: boolean;
  // Not drawn where it passes into this part of the picture, whatever its depth: the end of a card inside the
  // terminal's reader, with the hand that holds it still drawn in front.
  hiddenInside?: PictureRect;
  // Picture units per model unit, for a model built in its own (millimetres, metres).
  unit?: number;
}

// Everything on a stage, set up once: its actors, its lights, and a catcher for the shadows they throw on the
// picture behind them.
export interface StageScene {
  actors: ActorSpec[];
  lights: LightSpec[];
  shadow?: { opacity: number };
}

// Where an actor stands in a flat drawing, for a 2D stage: picture units (y down), its turn, its size, and which of its
// drawings it shows (a hand pointing or holding).
export interface FlatPlacement {
  x: number;
  y: number;
  angle: number;
  scale: number;
  look: string;
}

// An actor at a moment: shown or not, where and how turned in stage space, its joints, and (for a 2D stage) where it
// stands flat. Stage space is right handed and in picture units: x right, y up (the picture's y turned over), z
// towards the viewer, the picture lying at z = 0.
export interface ActorState {
  id: string;
  isShown: boolean;
  position: Vec3;
  rotation: Quat;
  joints?: JointTurns;
  flat?: FlatPlacement;
}

export interface StageFrame {
  view: StageView;
  actors: ActorState[];
  // A light's colour or strength for this moment, by id (the screen's glow brightening as it approves).
  lights?: Record<string, { intensity?: number; colour?: string }>;
}

// Where a stage draws: any 2D context it is composited into.
export type StageTarget = Canvas2DContext;

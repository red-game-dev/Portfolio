import {
  atom
} from "recoil";

export const AppLoaderReadyState = atom({
  key: "AppLoaderReady",
  default: false,
});

import {
  useRecoilState
} from "recoil";

import {
  AppLoaderLoadingState
} from "@/components/AppLoader/atoms/LoadingAtom";
import {
  AppLoaderReadyState
} from "@/components/AppLoader/atoms/ReadyAtom";

export const useAppLoaderStateHook = () => {
  const [isLoading, setIsLoading] = useRecoilState(AppLoaderLoadingState);
  const [isReady, setIsReady] = useRecoilState(AppLoaderReadyState);

  return {
    isLoading,
    setIsLoading,
    isReady,
    setIsReady
  };
};

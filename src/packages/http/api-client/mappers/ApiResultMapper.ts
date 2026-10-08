import type { FetchResponse } from "fetchff";

import { Mapper } from "@/packages/core/domain";

import { ApiResult } from "../domain/types";

// A fetchff response as a result: its error, if any, becomes a failure with a status and a reason; otherwise the
// data is handed over as the type the call asked for. An error's unread stream is cancelled, so its connection
// is freed rather than left open until it times out.
export class ApiResultMapper<TData> extends Mapper<FetchResponse<TData>, ApiResult<TData>> {
  public map(response: FetchResponse<TData>): ApiResult<TData> {
    if (response.error) {
      if (response.data instanceof ReadableStream) {
        void response.data.cancel();
      }

      return { ok: false, status: response.error.status || 0, message: response.error.message, isCancelled: response.error.isCancelled };
    }

    const data: TData | null = response.data;

    if (data === null) {
      return { ok: false, status: response.status, message: "The response had no body", isCancelled: false };
    }

    return { ok: true, status: response.status, data };
  }
}

// Where content comes from: a file in the repo, a CMS, an API. A source hands back raw data and makes
// no promises about its shape; the service on the other side of the port guards and validates it.
export interface ContentSource {
  read(): unknown;
}

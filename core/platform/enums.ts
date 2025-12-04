export enum NodeEnv {
  Local = 'local',
  Test = 'test',
  Development = 'development',
  Sandbox = 'sandbox',
  Preproduction = 'preproduction',
  Production = 'production',
}

/**
 * Request body content type which corresponding to header content-type
 **/
export enum BodyContentType {
  Json = 'application/json',
  MultipartFormData = 'multipart/form-data',
}

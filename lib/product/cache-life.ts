export function productDetailsCacheLife(found: boolean): "max" | "minutes" {
  return found ? "max" : "minutes";
}

/**
 * Convert a string with a map, this is used for the webdoc template
 * to do string subtitutions (e.g., `${name}` replaced with `map.name`).
 */
export const template = (str, map) => str.replace(/\${([^}]+)}/g, (_, key) => map[key]);

// CSS module type declarations — allows dynamic `import("./some.css")` in TypeScript
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

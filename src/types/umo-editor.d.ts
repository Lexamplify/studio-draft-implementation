declare module '@umoteam/editor/dist/style.css' {
  const content: any;
  export default content;
}

declare module '@umoteam/editor' {
  const UmoEditor: any;
  const useUmoEditor: any;
  export { UmoEditor, useUmoEditor };
  export default UmoEditor;
}

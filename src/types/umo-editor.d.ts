declare module 'lexteam-editor/dist/style.css' {
  const content: any;
  export default content;
}

declare module 'lexteam-editor' {
  const UmoEditor: any;
  const useUmoEditor: any;
  export { UmoEditor, useUmoEditor };
  export default UmoEditor;
}

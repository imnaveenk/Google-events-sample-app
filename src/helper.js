export const getTokens = () => {
  return JSON.parse(localStorage.getItem("theCodeMeshTokens", {}));
}
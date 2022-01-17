import { TRIGGER_URL } from "./constants";

export const getToken = () => {
  if (window && localStorage) return JSON.parse(localStorage.getItem("theCodeMeshTokens", {}));
  else return null;
};

export const setToken = (loginKey, loginToken) => {
  const tokens = JSON.parse(localStorage.getItem("theCodeMeshTokens")) || {};
  tokens[loginKey] = loginToken;
  localStorage.setItem("theCodeMeshTokens", JSON.stringify(tokens));
};

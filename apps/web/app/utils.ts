export const getAuthCode = () => {
  return window.localStorage.getItem('authCode') || '';
};

export const setAuthCode = (authCode: string) => {
  window.localStorage.setItem('authCode', authCode);
};

let token: string | null = null;

export const getAuthCode = () => {
  if (token !== null) {
    return token;
  }

  token = window.localStorage.getItem('authCode');
  return token;
};

export const setAuthCode = (authCode: string | null) => {
  token = authCode;
  if (!authCode) {
    window.localStorage.removeItem('authCode');
    return;
  }
  window.localStorage.setItem('authCode', authCode);
};

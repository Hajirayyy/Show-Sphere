import api from './axiosInstance'; 

export const loginUser = async (email, password) => {
  const res = await api.post('/login', { email, password }); 

  const { roleID, userName, userID } = res.data;

  localStorage.setItem('roleID', roleID);
  localStorage.setItem('userName', userName);
  localStorage.setItem('userID', userID);

  console.log('Login successful:', res.data); 
  return { roleID, userID, userName };
};

export const signupUser = async (data) => {
  const res = await api.post('/signup', data); 
  return res.data;
};

export const requestPasswordReset = async (email) => {
  const res = await api.post('/request-password-reset', { email });
  return res.data;
};

export const resetPassword = async (email, token, newPassword) => {
  const res = await api.post('/reset-password', {
    email,
    token,
    newPassword
  });
  return res.data;
};

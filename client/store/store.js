import create from 'zustand';

export const useUserStore = create((set) => ({
  userName: '',
  email: '',
  phone: '',
  bloodType: '',
  birthDate: '',
  setUserData: (data) => set({
    userName: data.userName,
    email: data.email,
    phone: data.phone,
    bloodType: data.bloodType,
    birthDate: data.birthDate,
  }),
}));



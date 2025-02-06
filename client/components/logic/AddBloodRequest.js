import { getFirestore, collection, addDoc, doc } from "firebase/firestore";
import { useEffect } from "react";

const AddBloodRequest = () => {
  const db = getFirestore();

  const addNewBloodRequest = async () => {
    try {
      // Дані нового запиту на кров
      const bloodRequestData = {
        bloodGroup: "3+", // Група крові
        collectedAmount: 5, // Зібрано
        dateOfRequest: new Date(2025, 1, 5, 14, 0, 0), // Використовуємо новий формат дати (місяці від 0)
        medicalCenterId: doc(db, "medicalCenters", "ZB0qKQ6E43psxTEZGVcP"), // ID лікарні
        neededAmount: 10, // Необхідна кількість
        status: "активний", // Статус
      };
  
      // Додавання запиту до колекції bloodNeeds
      await addDoc(collection(db, "bloodNeeds"), bloodRequestData);
      console.log("Запит на кров успішно додано!");
    } catch (error) {
      console.error("Помилка при додаванні запиту на кров: ", error);
    }
  };

  useEffect(() => {
    addNewBloodRequest(); // Додавання запиту при завантаженні компонента
  }, []);

  return null; // Цей компонент нічого не рендерить, він лише додає дані
};

export default AddBloodRequest;

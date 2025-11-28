import { useEffect, useState } from "react";

export default function useLocalData(key, defaultJSON) {
  const [data, setData] = useState([]);

  // Solo se ejecuta la PRIMER vez que existe el localStorage
  useEffect(() => {
    const stored = localStorage.getItem(key);

    if (stored) {
      // Si ya existe localStorage → usarlo SIEMPRE
      setData(JSON.parse(stored));
    } else {
      // Si NO existe → inicializar con el JSON original
      setData(defaultJSON);
      localStorage.setItem(key, JSON.stringify(defaultJSON));
    }
  }, [key]); // 👉 ojo: SOLO depende de "key"

  const updateData = (newData) => {
    setData(newData);
    localStorage.setItem(key, JSON.stringify(newData));
  };

  return { data, setData: updateData };
}

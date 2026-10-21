import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to connect to Django");
        }
        return response.json();
      })
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Could not connect to the backend."));
  }, []);

  return (
    <main>
      <h1>My Application</h1>
      <p>{message}</p>
    </main>
  );
}

export default App;
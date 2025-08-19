import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx loading - current URL:', window.location.href);
console.log('Import meta env:', import.meta.env);
console.log('Base URL:', import.meta.env.BASE_URL);

createRoot(document.getElementById("root")!).render(<App />);

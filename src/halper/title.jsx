// halper/title.js
import { useEffect } from "react";

export default function Title({ title }) {
  useEffect(() => {
    document.title = title;
  }, [title]); // أضفنا title هنا ليتحدث العنوان إذا تغيرت الـ props
  
  return null; 
}
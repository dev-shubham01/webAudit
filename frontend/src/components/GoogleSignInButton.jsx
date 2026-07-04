import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function GoogleSignInButton() {
  const { ready, renderButton } = useAuth();
  const ref = useRef(null);

  useEffect(() => {
    if (ready) renderButton(ref.current);
  }, [ready, renderButton]);

  return <div ref={ref} />;
}

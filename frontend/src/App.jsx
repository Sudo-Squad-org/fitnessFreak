import React from "react";
import { AppRoutes } from "./routes/AppRoutes";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}

export default App;

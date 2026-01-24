import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/app/router";
import { AppProviders } from "@/app/providers";

const App: React.FC = () => (
  <BrowserRouter>
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  </BrowserRouter>
);

export default App;

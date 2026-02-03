import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import Navbar from "./components/Navbar";
import Feed from "./pages/Feed";
import AdminRoute from "./routes/AdminRoute";
import AdminModeration from "./pages/AdminPanel";
import { AuthProvider } from "./contexts/AuthContext";
import { DialogProvider } from "./contexts/DialogContext";


function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalizes CSS and applies background color */}
      <DialogProvider>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminModeration />
                </AdminRoute>
              }
            />
            
          </Routes>
        </Router>
      </AuthProvider>
      </DialogProvider>
    </ThemeProvider>
  );
}

export default App;

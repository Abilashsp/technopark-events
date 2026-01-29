import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import Navbar from "./components/Navbar";
import Feed from "./pages/Feed";
import Upload from "./pages/Upload";
import AdminRoute from "./routes/AdminRoute";
import AdminModeration from "./pages/AdminPanel";
import { AuthProvider } from "./contexts/AuthContext";


function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalizes CSS and applies background color */}
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/upload" element={<Upload />} />
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
    </ThemeProvider>
  );
}

export default App;

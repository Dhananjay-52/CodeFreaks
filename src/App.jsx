import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NewChat from "./pages/NewChat";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import WorkspaceLayout from "./layouts/WorkspaceLayout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";

/**
 * Guards the workspace — unauthenticated users are redirected to /login.
 */
function ProtectedWorkspace() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <WorkspaceLayout>
      <NewChat />
    </WorkspaceLayout>
  );
}

/**
 * Redirect authenticated users away from login/signup back to workspace.
 */
function AuthRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/workspace" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/workspace" replace />} />
            <Route
              path="/login"
              element={
                <AuthRoute>
                  <Login />
                </AuthRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <AuthRoute>
                  <Signup />
                </AuthRoute>
              }
            />
            <Route path="/workspace" element={<ProtectedWorkspace />} />
            <Route path="*" element={<Navigate to="/workspace" replace />} />
          </Routes>
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
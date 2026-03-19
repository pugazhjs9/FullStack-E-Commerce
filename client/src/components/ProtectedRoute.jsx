import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps a page that requires authentication.
 * Unauthenticated users are redirected to /login, with the
 * current path saved in `location.state.from` so they can be
 * sent back after logging in.
 *
 * Shows a loading spinner while auth state is being resolved on
 * first mount (prevents flash of redirect before token is checked).
 */
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="protected-loading">
                <div className="spinner" aria-label="Checking authentication…" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

export default ProtectedRoute;

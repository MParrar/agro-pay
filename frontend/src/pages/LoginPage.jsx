import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/client.js';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo iniciar sesión.'));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-brand-800 to-brand-900 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <div className="text-center">
          <div className="text-4xl">🍓</div>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Agro-Pay</h1>
          <p className="text-sm text-gray-500">Registro de cosecha y pagos a trato</p>
        </div>

        {error && <p className="alert-error">{error}</p>}

        <div>
          <label className="label" htmlFor="username">Usuario</label>
          <input
            id="username"
            className="input"
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            className="input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <p className="text-center text-xs text-white/60">
        © {new Date().getFullYear()} Agro-Pay · Creado por Matias Ignacio Parra Rivas
      </p>
    </div>
  );
}

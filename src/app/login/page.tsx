import { signIn } from "./actions";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-brand mb-1">VGS Autos</h1>
        <p className="text-slate-500 mb-6 text-sm">Espace de réservation nettoyage automobile</p>

        <form action={signIn} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              placeholder="contact@site.fr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {searchParams.error && (
            <p className="text-sm text-red-600">{decodeURIComponent(searchParams.error)}</p>
          )}

          <button
            type="submit"
            className="w-full bg-brand text-white rounded-md py-2 text-sm font-semibold hover:bg-slate-800"
          >
            Se connecter
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-4">
          Pas encore de compte ? Contactez VGS Autos pour recevoir votre invitation.
        </p>
      </div>
    </main>
  );
}

import LoginForm from '../components/LoginForm';

export default function Home() {
  return (
    <main style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#37003c' }}>FPL Analysis & Assistant</h1>
      <p style={{ marginBottom: '20px', color: '#555' }}>
        Welcome! Please log in using your public FPL Team Code to access your dashboard.
      </p>
      <LoginForm />
    </main>
  );
}

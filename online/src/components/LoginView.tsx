'use client';
import { loginAction } from "@/app/actions";

export default function LoginView() {
  return (
    <div id="tela-inicial" className="screen active">
      <div className="glass-container text-center hero-section">
        <h1 className="glow-text">FIRMA<span>FOOT</span></h1>
        <p className="subtitle">Torne-se o maior técnico de futebol do Brasil</p>
        
        <form action={loginAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px', margin: '0 auto', background: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <h2 className="title-select-team" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Login / Novo Treinador</h2>
          
          <input 
            type="text" 
            name="username" 
            placeholder="Digite seu nome (Ex: Renato Gaúcho)" 
            required
            className="form-control"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: '1rem' }}
          />
          
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Entrar no Jogo
          </button>
          
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Se a conta não existir, ela será criada automaticamente.
          </span>
        </form>
      </div>
    </div>
  );
}

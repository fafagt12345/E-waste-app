import React from 'react';
import { Link } from 'react-router-dom';

export function LoginPage() {
    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h1>Halaman Login</h1>
            <p>Ini adalah halaman login.</p>
            <form>
                <div>
                    <label>Email: </label>
                    <input type="email" />
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label>Password: </label>
                    <input type="password" />
                </div>
                <button type="submit" style={{ marginTop: '20px' }}>Masuk</button>
            </form>
            <p style={{ marginTop: '20px' }}>
                Belum punya akun? <Link to="/daftar">Daftar di sini</Link>
            </p>
        </div>
    );
}
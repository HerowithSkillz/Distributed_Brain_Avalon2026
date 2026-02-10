import { useState } from "react";

function App() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Frontend-only placeholder: backend team can replace this with API integration.
    console.log("Register payload:", formData);
  };

  return (
    <main className="page">
      <section className="card">
        <h1>Create Account</h1>
        <p className="subtitle">Share your compute power with the network.</p>

        <form onSubmit={handleSubmit} className="form" autoComplete="off">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            required
            minLength={3}
            placeholder="Enter username"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            placeholder="Enter password"
          />

          <button type="submit">Register</button>
        </form>
      </section>
    </main>
  );
}

export default App;

import { useEffect, useState } from "react";
import { api, peso } from "./api.js";

const emptyForm = { name: "", barcode: "", price: "", on_hand_units: "" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = () => api("/products").then(setProducts).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api("/products", {
        method: "POST",
        body: { ...form, barcode: form.barcode || null, price: Number(form.price), on_hand_units: Number(form.on_hand_units) },
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    setError("");
    try {
      await api(`/products/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="card">
      <h2>Products</h2>
      <form className="row" onSubmit={add}>
        <input placeholder="Name" value={form.name} onChange={update("name")} required />
        <input placeholder="Barcode" value={form.barcode} onChange={update("barcode")} />
        <input type="number" step="0.01" placeholder="Price" value={form.price} onChange={update("price")} required />
        <input type="number" placeholder="Stock" value={form.on_hand_units} onChange={update("on_hand_units")} required />
        <button className="primary">Add</button>
      </form>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Barcode</th>
            <th>Price</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.barcode}</td>
              <td>{peso(p.price)}</td>
              <td>{p.on_hand_units}</td>
              <td>
                <button onClick={() => remove(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

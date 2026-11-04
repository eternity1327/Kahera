import { useEffect, useState } from "react";
import { api, peso } from "./api.js";

export default function Pos() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const load = () => api("/products").then(setProducts).catch((err) => setMessage(err.message));

  useEffect(() => {
    load();
  }, []);

  const setQuantity = (product, quantity) => {
    const inCart = cart.some((item) => item.product.id === product.id);
    const next = inCart
      ? cart.map((item) => (item.product.id === product.id ? { product, quantity } : item))
      : [...cart, { product, quantity }];
    setCart(next.filter((item) => item.quantity > 0));
  };

  const quantityOf = (product) => cart.find((item) => item.product.id === product.id)?.quantity || 0;

  const addToCart = (product) => setQuantity(product, quantityOf(product) + 1);

  const scan = (e) => {
    e.preventDefault();
    const product = products.find((p) => p.barcode === search);
    if (!product) return setMessage("No product with that barcode");
    addToCart(product);
    setMessage("");
    setSearch("");
  };

  const checkout = async () => {
    try {
      const items = cart.map((item) => ({ product_id: item.product.id, quantity: item.quantity }));
      const sale = await api("/sales", { method: "POST", body: { items } });
      setCart([]);
      setMessage(`Sale #${sale.id} saved: ${peso(sale.total)}`);
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shown = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="pos">
      <section className="card">
        <form onSubmit={scan}>
          <input placeholder="Search or scan barcode" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        <div className="grid">
          {shown.map((p) => (
            <button key={p.id} className="item" onClick={() => addToCart(p)} disabled={p.on_hand_units === 0}>
              <strong>{p.name}</strong>
              <span>{peso(p.price)}</span>
              <small>{p.on_hand_units} in stock</small>
            </button>
          ))}
        </div>
      </section>
      <section className="card cart">
        <h2>Cart</h2>
        {cart.map(({ product, quantity }) => (
          <div key={product.id} className="cart-row">
            <span>{product.name}</span>
            <div>
              <button onClick={() => setQuantity(product, quantity - 1)}>-</button>
              <b>{quantity}</b>
              <button onClick={() => setQuantity(product, quantity + 1)}>+</button>
            </div>
          </div>
        ))}
        <div className="cart-row total">
          <span>Subtotal</span>
          <b>{peso(total)}</b>
        </div>
        {message && <p>{message}</p>}
        <button className="primary" onClick={checkout} disabled={cart.length === 0}>
          Checkout
        </button>
      </section>
    </main>
  );
}


import { Link } from "react-router-dom";
import { ShoppingBag, Search, UserRound } from "lucide-react";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="nav-logo">
          PARAÉLLE
          <span>BEAUTY • CARE • WELLNESS</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Accueil</Link>
          <Link to="/shop">Boutique</Link>
          <a href="#brands">Nos marques</a>
          <a href="#promotions">Promotions</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="nav-actions">
          <button aria-label="Rechercher"><Search /></button>
          <Link to="/login" aria-label="Mon compte"><UserRound /></Link>
          <Link to="/cart" aria-label="Panier"><ShoppingBag /></Link>
        </div>
      </div>
    </header>
  );
}

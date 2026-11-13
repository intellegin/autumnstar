import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <section className="notfound">
      <div className="container" style={{ maxWidth: 720 }}>
        <h1>Off course</h1>
        <p className="lead">We couldn&rsquo;t find that page. It may have moved.</p>
        <div className="hero-actions">
          <Link className="btn btn-navy btn-lg" href="/services">Explore services</Link>
          <Link className="btn btn-orange btn-lg" href="/quote">Request a Quote <Icon name="arrow" size={20} /></Link>
        </div>
      </div>
    </section>
  );
}

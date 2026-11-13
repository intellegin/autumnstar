import Link from "next/link";
import { Icon } from "./Icon";

/** Section heading: title + optional intro, optional link aligned right. */
export function Head({ title, text, id, link }: { title: string; text?: string; id?: string; link?: { label: string; href: string } }) {
  const head = (
    <header className="head">
      <h2 id={id}>{title}</h2>
      {text && <p>{text}</p>}
    </header>
  );
  if (!link) return head;
  return (
    <div className="head-row">
      {head}
      <Link className="link" href={link.href}>{link.label} <Icon name="arrow" size={18} /></Link>
    </div>
  );
}

import { Icon } from "./Icon";

type Step = { icon: string; title: string; text: string };

/** "How a shipment comes together": waypoints (diamond markers) along a dashed route line. */
export function RouteProcess({ steps }: { steps: Step[] }) {
  return (
    <ol className="route">
      {steps.map((s) => (
        <li key={s.title} className="waypoint">
          <span className="waypoint-marker" aria-hidden="true"><Icon name={s.icon} size={26} /></span>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

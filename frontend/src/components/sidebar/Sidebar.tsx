import NavegadorLigas from "./NavegadorLigas";
import FeedNoticias from "./FeedNoticias";

export default function Sidebar() {
  return (
    <aside className="space-y-6">
      <NavegadorLigas />
      <FeedNoticias />
    </aside>
  );
}

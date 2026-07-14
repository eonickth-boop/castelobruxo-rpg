import Header from "./Header";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

import "../../styles/layout/mainLayout.css";

export default function MainLayout({ children }) {
  return (
    <div className="layout">
      <Header />

      <div className="layout-body">
        <Sidebar />

        <main className="layout-content">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
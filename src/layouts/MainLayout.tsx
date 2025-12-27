import { Outlet } from "react-router-dom";
import TopNavbar from "@/components/curve/TopNavbar";

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <TopNavbar />
      <div className="flex flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;

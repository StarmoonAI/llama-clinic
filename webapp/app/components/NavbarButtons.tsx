import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { LogIn, Home } from "lucide-react";
import { Gamepad2, ShoppingCart } from "lucide-react";

interface NavbarButtonsProps {
    user: User | null;
}

const ICON_SIZE = 18;
const STROKE_WIDTH = 3;

const NavbarButtons: React.FC<NavbarButtonsProps> = ({ user }) => {
    return user ? (
        <Link href="/home">
            <Button
                variant="outline"
                size="sm"
                className="flex font-semibold border-2 border-nav-bar flex-row items-center gap-2 rounded-full font-quicksand"
            >
                <Home size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
                <span className="hidden sm:block">Dashboard</span>
            </Button>
        </Link>
    ) : (
        <Link href="/login">
            <Button
                variant="outline"
                size="sm"
                className="font-semibold border-2 border-nav-bar flex flex-row items-center gap-2 rounded-full bg-nav-bar font-quicksand"
            >
                {/* <LogIn size={ICON_SIZE} strokeWidth={STROKE_WIDTH} /> */}
                <Gamepad2 size={22} strokeWidth={STROKE_WIDTH} />
                <span className="hidden sm:block">Login</span>
            </Button>
        </Link>
    );
};

export default NavbarButtons;

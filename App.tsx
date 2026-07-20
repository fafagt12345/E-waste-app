import { Toaster } from "sonner";
import AppRoutes from "./AppRoutes";

function App() {
    return (
        <>
            <AppRoutes />
            <Toaster richColors />
        </>
    );
}

export default App;
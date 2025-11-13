import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import UploadCV from "./pages/UploadCV";
import ScreeningSetup from "./pages/ScreeningSetup";
import MicTest from "./pages/MicTest";
import Interview from "./pages/Interview";
import Results from "./pages/Results";
import Download from "./pages/Download";
import Dashboard from "./pages/Dashboard";
import Transcript from "./pages/Transcript";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/upload-cv" element={<UploadCV />} />
          <Route path="/screening-setup" element={<ScreeningSetup />} />
          <Route path="/mic-test" element={<MicTest />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/results" element={<Results />} />
          <Route path="/download" element={<Download />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transcript" element={<Transcript />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import PostureApp from "./components/PostureApp";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PostureApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

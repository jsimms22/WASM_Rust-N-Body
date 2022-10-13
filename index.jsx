import React from "react";
import ReactDOM from "react-dom";

const wasm = import("../build/nbody_wasm");

wasm.then((m) => {
  const App = () => {
    return (
      <>
        <div>
        </div>
      </>
    );
  };

  ReactDOM.render(<App />, document.getElementById("root"));
});
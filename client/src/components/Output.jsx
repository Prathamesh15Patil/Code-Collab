import React from "react";

const Output = ({ output }) => {
  return (
    <div className="bg-gray-900">
    <pre className="w-full h-screen p-2 border border-gray-400 rounded bg-gray-900 overflow-auto">
      {output}
    </pre>
    </div>
  );
};

export default Output;


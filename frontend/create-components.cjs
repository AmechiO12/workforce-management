const fs = require('fs');
const path = require('path');

// List of components to create
const components = [
  { name: 'Navbar', content: `import React from 'react';\nimport { Link } from 'react-router-dom';\n\nexport const Navbar = () => (\n  <nav className=\"bg-white shadow p-4 flex justify-between\">\n    <h1 className=\"text-2xl font-bold\">Workforce Management System</h1>\n    <div>\n      <Link to=\"/\" className=\"mr-4\">Home</Link>\n      <Link to=\"/dashboard\" className=\"mr-4\">Dashboard</Link>\n      <Link to=\"/attendance\" className=\"mr-4\">Attendance</Link>\n      <Link to=\"/payroll\" className=\"mr-4\">Payroll</Link>\n      <Link to=\"/login\">Login</Link>\n    </div>\n  </nav>\n);` },

  { name: 'Home', content: `import React from 'react';\n\nexport const Home = () => (\n  <div className=\"p-8\">\n    <h2 className=\"text-3xl font-semibold\">Welcome to the Workforce Management System</h2>\n    <p className=\"mt-4\">Manage attendance, payroll, and staff data securely and efficiently.</p>\n  </div>\n);` },

  { name: 'Login', content: `import React, { useState } from 'react';\n\nexport const Login = () => {\n  const [email, setEmail] = useState('');\n  const [password, setPassword] = useState('');\n\n  const handleSubmit = async (e) => {\n    e.preventDefault();\n    const response = await fetch(\"/api/login\", {\n      method: \"POST\",\n      headers: { \"Content-Type\": \"application/json\" },\n      body: JSON.stringify({ email, password }),\n    });\n    if (response.ok) {\n      alert(\"Login successful!\");\n    } else {\n      alert(\"Invalid credentials\");\n    }\n  };\n\n  return (\n    <div className=\"p-8 max-w-md mx-auto bg-white shadow rounded-lg\">\n      <h2 className=\"text-2xl mb-4\">Login</h2>\n      <form onSubmit={handleSubmit}>\n        <input\n          className=\"w-full p-2 mb-4 border rounded\"\n          type=\"email\"\n          placeholder=\"Email\"\n          value={email}\n          onChange={(e) => setEmail(e.target.value)}\n          required\n        />\n        <input\n          className=\"w-full p-2 mb-4 border rounded\"\n          type=\"password\"\n          placeholder=\"Password\"\n          value={password}\n          onChange={(e) => setPassword(e.target.value)}\n          required\n        />\n        <button className=\"w-full bg-blue-500 text-white p-2 rounded\" type=\"submit\">\n          Login\n        </button>\n      </form>\n    </div>\n  );\n};` },

  { name: 'Dashboard', content: `import React from 'react';\n\nexport const Dashboard = () => (\n  <div className=\"p-8\">\n    <h2 className=\"text-3xl font-semibold\">Dashboard</h2>\n    <p className=\"mt-4\">Access key metrics, reports, and manage user data from this centralized dashboard.</p>\n  </div>\n);` },

  { name: 'Attendance', content: `import React from 'react';\n\nexport const Attendance = () => (\n  <div className=\"p-8\">\n    <h2 className=\"text-3xl font-semibold\">Attendance</h2>\n    <p className=\"mt-4\">View and manage attendance records. Check-in data is verified with GPS.</p>\n  </div>\n);` },

  { name: 'Payroll', content: `import React from 'react';\n\nexport const Payroll = () => (\n  <div className=\"p-8\">\n    <h2 className=\"text-3xl font-semibold\">Payroll</h2>\n    <p className=\"mt-4\">Generate and export payroll reports. Accurate calculations based on verified attendance.</p>\n  </div>\n);` }
];

// Path to the components directory
const componentsDir = path.join(__dirname, 'src', 'components');

// Create the components directory if it doesn't exist
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// Create each component file
components.forEach(({ name, content }) => {
  const filePath = path.join(componentsDir, `${name}.jsx`);
  fs.writeFileSync(filePath, content);
  console.log(`✅ Created ${name}.jsx`);
});

console.log('🎉 All component files have been created successfully!');
